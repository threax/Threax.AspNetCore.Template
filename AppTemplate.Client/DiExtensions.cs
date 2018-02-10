using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection.Extensions;
using AppTemplateClient;
using System;
using Threax.AspNetCore.AuthCore;
using Threax.AspNetCore.Halcyon.Client;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class DiExtensions
    {
        /// <summary>
        /// Add the AppTemplate setup to use client credentials to connect to the service.
        /// </summary>
        /// <param name="services">The service collection.</param>
        /// <param name="configure">The configure callback.</param>
        /// <returns></returns>
        public static IServiceCollection AddAppTemplateWithClientCredentials(this IServiceCollection services, Action<AppTemplateOptions> configure)
        {
            var options = new AppTemplateOptions();
            configure?.Invoke(options);

            services.TryAddSingleton<IHttpClientFactory, DefaultHttpClientFactory>();
            services.TryAddSingleton<IHttpClientFactory<EntryPointInjector>>(s =>
            {
                return new ClientCredentialsAccessTokenFactory<EntryPointInjector>(options.ClientCredentials, new BearerHttpClientFactory<EntryPointInjector>(s.GetRequiredService<IHttpClientFactory>()));
            });
            services.TryAddScoped<EntryPointInjector>(s =>
            {
                return new EntryPointInjector(options.ServiceUrl, s.GetRequiredService<IHttpClientFactory<EntryPointInjector>>());
            });

            return services;
        }

        /// <summary>
        /// Add the AppTemplate setup to forward the current user's access token from the to the service.
        /// </summary>
        /// <param name="services">The service collection.</param>
        /// <param name="configure">The configure callback.</param>
        /// <returns></returns>
        public static IServiceCollection AddAppTemplateWithUserAccessToken(this IServiceCollection services, Action<AppTemplateOptions> configure)
        {
            var options = new AppTemplateOptions();
            configure?.Invoke(options);

            services.TryAddSingleton<IHttpClientFactory, DefaultHttpClientFactory>();
            services.TryAddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.TryAddScoped<IHttpClientFactory<EntryPointInjector>>(s =>
                new AddUserTokenHttpClientFactory<EntryPointInjector>(p => p.GetAccessToken(), s.GetRequiredService<IHttpContextAccessor>(), s.GetRequiredService<IHttpClientFactory>(), s.GetRequiredService<ILoggingInUserAccessor>()));
            services.TryAddScoped<ILoggingInUserAccessor, LoggingInUserAccessor>();
            services.TryAddScoped<EntryPointInjector>(s =>
            {
                return new EntryPointInjector(options.ServiceUrl, s.GetRequiredService<IHttpClientFactory<EntryPointInjector>>());
            });

            return services;
        }
    }
}
