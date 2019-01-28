using AppTemplate.Controllers;
using AppTemplate.Controllers.Api;
using AppTemplate.Database;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using Threax.AspNetCore.BuiltInTools;
using Threax.AspNetCore.CorsManager;
using Threax.AspNetCore.Halcyon.ClientGen;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.IdServerAuth;
using Threax.AspNetCore.UserBuilder;
using Threax.AspNetCore.UserLookup.Mvc.Controllers;
using Threax.Extensions.Configuration.SchemaBinder;

namespace AppTemplate
{
    public class Startup
    {
        //Replace the following values with your own values
        private IdServerAuthAppOptions authConfig = new IdServerAuthAppOptions()
        {
            Scope = "AppTemplate", //The name of the scope for api access
            DisplayName = "AppTemplate", //Change this to a pretty name for the client/resource
            ClientId = "AppTemplate", //Change this to a unique client id
            AdditionalScopes = new List<String> { /*Additional scopes here "ScopeName", "Scope2Name", "etc"*/ },
            ClientCredentialsScopes = new List<string> { "Threax.IdServer" }
        };
        //End user replace

        private AppConfig appConfig = new AppConfig();
        private ClientConfig clientConfig = new ClientConfig();
        private CorsManagerOptions corsOptions = new CorsManagerOptions();

        public Startup(IConfiguration configuration)
        {
            Configuration = new SchemaConfigurationBinder(configuration);
            Configuration.Bind("JwtAuth", authConfig);
            Configuration.Bind("AppConfig", appConfig);
            Configuration.Bind("ClientConfig", clientConfig);
            Configuration.Bind("Cors", corsOptions);
        }

        public SchemaConfigurationBinder Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            Threax.AspNetCore.Docker.Certs.CertManager.LoadTrustedRoots(o => Configuration.Bind("CertManager", o));

            //Add the client side configuration object
            services.AddClientConfig(clientConfig, o =>
            {
                o.RouteArgsToClear = new List<string>() { "inPagePath" };
            });

            services.AddAssetBundle(o =>
            {
                o.UseBundles = appConfig.UseAssetBundles;
            });

            ApiExplorerController.Allow = appConfig.AllowApiExplorer;

            services.AddTimeTracking();

            services.AddHalClientGen(new HalClientGenOptions()
            {
                SourceAssemblies = new Assembly[] { this.GetType().GetTypeInfo().Assembly, typeof(UserSearchController).Assembly },
                CSharp = new CSharpOptions()
                {
                    Namespace = "AppTemplate.Client"
                }
            });

            services.AddConventionalIdServerAuthentication(o =>
            {
                o.AppOptions = authConfig;
                o.CookiePath = appConfig.PathBase;
                o.AccessDeniedPath = "/Account/AccessDenied";
                o.ConfigureIdServerMetadataJwtOptions = jwtOpt =>
                {
                    jwtOpt.Audience = "Threax.IdServer";
                };
            });

            services.AddAppDatabase(appConfig.ConnectionString);
            services.AddAppMapper();
            services.AddAppRepositories();

            var halOptions = new HalcyonConventionOptions()
            {
                BaseUrl = appConfig.BaseUrl,
                HalDocEndpointInfo = new HalDocEndpointInfo(typeof(EndpointDocController)),
                EnableValueProviders = appConfig.EnableValueProviders
            };

            services.AddConventionalHalcyon(halOptions);

            services.AddExceptionErrorFilters(new ExceptionFilterOptions()
            {
                DetailedErrors = appConfig.DetailedErrors
            });

            services.AddThreaxIdServerClient(o =>
            {
                o.GetSharedClientCredentials = s => Configuration.Bind("SharedClientCredentials", s);
                Configuration.Bind("IdServerClient", o);
            });

            // Add framework services.
            services.AddMvc(o =>
            {
                o.UseExceptionErrorFilters();
                o.UseConventionalHalcyon(halOptions);
            })
            .AddJsonOptions(o =>
            {
                o.SerializerSettings.SetToHalcyonDefault();
                o.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
            })
            .AddConventionalIdServerMvc()
            .AddThreaxUserLookup(o =>
            {
                o.UseIdServer();
            })
            .SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

            services.ConfigureHtmlRapierTagHelpers(o =>
            {
                o.FrontEndLibrary = HtmlRapier.TagHelpers.FrontEndLibrary.Bootstrap4;
            });

            services.AddScoped<IToolRunner>(s =>
            {
                return new ToolRunner()
                .AddTool("migrate", new ToolCommand("Migrate database to newest version. Run anytime new migrations have been added.", async a =>
                {
                    await a.Migrate();
                }))
                .AddTool("seed", new ToolCommand("Seed database data. Only needed for an empty database.", async a =>
                {
                    await a.Seed();
                }))
                .AddTool("addadmin", new ToolCommand("Add given guids as a user with permissions to all roles in the database.", async a =>
                {
                    await a.AddAdmin();
                }))
                .AddTool("updateConfigSchema", new ToolCommand("Update the schema file for this application's configuration.", async a =>
                {
                    var json = await Configuration.CreateSchema();
                    await File.WriteAllTextAsync("appsettings.schema.json", json);
                }))
                .AddTool("createCert", new ToolCommand("Create a cert to secure the server. createCert publicandprivate.pfx [public.pem]", a =>
                {
                    var rsa = RSA.Create(); // generate asymmetric key pair
                    var request = new CertificateRequest($"cn=localhost", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
                    
                    //Thanks to Muscicapa Striata for these settings at
                    //https://stackoverflow.com/questions/42786986/how-to-create-a-valid-self-signed-x509certificate2-programmatically-not-loadin
                    request.CertificateExtensions.Add(new X509KeyUsageExtension(X509KeyUsageFlags.DataEncipherment | X509KeyUsageFlags.KeyEncipherment | X509KeyUsageFlags.DigitalSignature, false));
                    request.CertificateExtensions.Add(new X509EnhancedKeyUsageExtension(new OidCollection { new Oid("1.3.6.1.5.5.7.3.1") }, false));

                    //Create the cert
                    var certificate = request.CreateSelfSigned(new DateTimeOffset(DateTime.UtcNow.AddMinutes(-1)), new DateTimeOffset(DateTime.UtcNow.AddYears(5)));

                    // Create pfx with private key
                    File.WriteAllBytes(a.Args[0], certificate.Export(X509ContentType.Pfx));

                    if (a.Args.Count > 1)
                    {
                        // Create Base 64 encoded CER public key only
                        File.WriteAllText(a.Args[1],
                        "-----BEGIN CERTIFICATE-----\r\n"
                        + Convert.ToBase64String(certificate.Export(X509ContentType.Cert), Base64FormattingOptions.InsertLineBreaks)
                        + "\r\n-----END CERTIFICATE-----");
                    }

                    return Task.CompletedTask;
                }))
                .UseClientGenTools();
            });

            services.AddUserBuilderForUserWhitelistWithRoles();

            services.AddThreaxCSP(o =>
            {
                o.AddDefault().AddNone();
                o.AddImg().AddSelf().AddData();
                o.AddConnect().AddSelf();
                o.AddManifest().AddSelf();
                o.AddFont().AddSelf();
                o.AddFrame().AddSelf().AddEntries(new String[] { authConfig.Authority });
                o.AddScript().AddSelf().AddUnsafeInline();
                o.AddStyle().AddSelf().AddUnsafeInline();
                o.AddFrameAncestors().AddSelf();
            });

            services.AddLogging(o =>
            {
                o.AddConfiguration(Configuration.GetSection("Logging"))
                    .AddConsole()
                    .AddDebug();
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedProto
                //Can add ForwardedHeaders.XForwardedFor later, but tricky with container proxy since we don't know its ip
                //This is enough to get https detection working again, however.
                //https://github.com/aspnet/Docs/issues/2384
            });

            app.UseUrlFix(o =>
            {
                o.CorrectPathBase = appConfig.PathBase;
            });

            app.UseStaticFiles();

            app.UseCorsManager(corsOptions, loggerFactory);

            app.UseAuthentication();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "root",
                    template: "{action=Index}/{*inPagePath}",
                    defaults: new { controller = "Home" });

                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{*inPagePath}");
            });
        }
    }
}
