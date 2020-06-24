using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Threax.ProgressiveWebApp;
using Microsoft.AspNetCore.StaticFiles;
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
            //return View();

            var file = "wwwroot/index.html";
            var content = new FileExtensionContentTypeProvider();
            String contentType;
            if (content.TryGetContentType(file, out contentType))
            {
                var stream = System.IO.File.Open(file, FileMode.Open, FileAccess.Read, FileShare.Read);
                return new FileStreamResult(stream, contentType); //Dispose happens in here
            }
            throw new FileNotFoundException($"Cannot find file type for '{file}'", file);
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
