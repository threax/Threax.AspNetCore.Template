using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Threax.ProgressiveWebApp;
using Halcyon.HAL;
using AppTemplate.Controllers.Api;
using Microsoft.AspNetCore.Http;
using AppTemplate.Views;
using Newtonsoft.Json;

namespace AppTemplate.Controllers
{
    [Authorize(AuthenticationSchemes = AuthCoreSchemes.Cookies)]
    public partial class HomeController : Controller
    {
        private readonly IHALConverter halConverter;
        private readonly EntryPointController entryPointController;
        private readonly IHttpContextAccessor httpContextAccessor;

        public HomeController(IHALConverter halConverter, EntryPointController entryPointController, IHttpContextAccessor httpContextAccessor)
        {
            this.halConverter = halConverter;
            this.entryPointController = entryPointController;
            this.httpContextAccessor = httpContextAccessor;
        }

        //You can get rid of this AllowAnonymous to secure the welcome page
        [AllowAnonymous]
        public IActionResult Index(String cacheToken)
        {
            return HandleCache(cacheToken, nameof(Index));
        }

        //The following functions enable this site to work as a progressive web app.
        //They can be removed if you don't want this functionality.

        [AllowAnonymous]
        public IActionResult AppStart()
        {
            return View();
        }

        //The following functions enable this site to work as a progressive web app.
        //They can be removed if you don't want this functionality.

        [AllowAnonymous]
        public IActionResult Header(String cacheToken)
        {
            return HandleCache(cacheToken, nameof(Header));
        }

        [AllowAnonymous]
        public IActionResult Footer(String cacheToken)
        {
            return HandleCache(cacheToken, nameof(Footer));
        }

        [Route("webmanifest.json")]
        [AllowAnonymous]
        public IActionResult Manifest([FromServices] IWebManifestProvider webManifestProvider)
        {
            return Json(webManifestProvider.CreateManifest(Url));
        }

        private IActionResult HandleCache(string cacheToken, string view)
        {
            //Have to do this here or we don't have these properties yet.
            this.entryPointController.Url = Url;
            this.entryPointController.ControllerContext = ControllerContext;

            this.Request.RouteValues.Remove("cacheToken");
            this.RouteData.Values.Remove("cacheToken");
            if (cacheToken != null) //Cache and return as js if we have a token
            {
                if (cacheToken != "nocache")
                {
                    HttpContext.Response.Headers["Cache-Control"] = "private, max-age=2592000, stale-while-revalidate=86400, immutable";
                }
                HttpContext.Response.Headers["Content-Type"] = "application/javascript";
                return View($"{view}Cache");
            }
            else
            {
                var entryPoint = entryPointController.Get(httpContextAccessor);
                if (!halConverter.CanConvert(entryPoint.GetType()))
                {
                    throw new InvalidOperationException($"Cannot convert entry point class '{entryPoint.GetType().FullName}' to a hal result.");
                }
                var halEntryPoint = halConverter.Convert(entryPoint);
                var model = new EntryPageModel()
                {
                    EntryJson = JsonConvert.SerializeObject(halEntryPoint, Microsoft.Extensions.DependencyInjection.HalcyonConvention.DefaultJsonSerializerSettings)
                };
                return View(view, model);
            }
        }

        //The other view action methods are in the additional partial classes for HomeController, expand the node for
        //this class to see them.

        //If you need to declare any other view action methods manually, do that here.
    }
}
