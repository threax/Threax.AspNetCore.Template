using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Threax.ProgressiveWebApp;
using System.IO;

namespace AppTemplate.Controllers
{
    [Authorize(AuthenticationSchemes = AuthCoreSchemes.Cookies)]
    public partial class HomeController : Controller
    {
        //You can get rid of this AllowAnonymous to secure the welcome page
        [AllowAnonymous]
        public IActionResult Index()
        {
            return View();
        }

        [AllowAnonymous]
        public IActionResult SlashBang(String url)
        {
            //There is probably a better way to do this, try to match the url to the routes on the other controllers or something.
            if (!String.IsNullOrEmpty(Path.GetExtension(url)))
            {
                return NotFound(); //For files return not found
            }

            //Otherwise send back index triggered to that url
            return View("Index");
        }

        //The following functions enable this site to work as a progressive web app.
        //They can be removed if you don't want this functionality.

        [AllowAnonymous]
        public IActionResult AppStart()
        {
            return View();
        }

        [Route("webmanifest.json")]
        [AllowAnonymous]
        public IActionResult Manifest([FromServices] IWebManifestProvider webManifestProvider)
        {
            return Json(webManifestProvider.CreateManifest(Url));
        }

        //The other view action methods are in the additional partial classes for HomeController, expand the node for
        //this class to see them.

        //If you need to declare any other view action methods manually, do that here.
    }
}
