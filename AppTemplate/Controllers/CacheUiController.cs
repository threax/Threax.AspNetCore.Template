using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppTemplate.Controllers
{
    //No authorization, since pages are cached assume some amount of public access
    //This could be locked down if you want to lock down all pages on the front end.
    //With caching all must be locked or unlocked for best performance. If you want to
    //hide admin pages you can do that.
    //Need to investigate the behavior more once this is all in place.
    public class CacheUiController : Controller
    {
        //A root page for the embedded iframe to load.
        public IActionResult Values(String cacheToken)
        {
            HandleCache(cacheToken);
            return View();
        }

        private void HandleCache(string cacheToken)
        {
            if (cacheToken != null && cacheToken != "nocache")
            {
                HttpContext.Response.Headers["Cache-Control"] = "private, max-age=2592000, stale-while-revalidate=86400, immutable";
            }
            HttpContext.Response.Headers["Content-Type"] = "application/javascript";
        }
    }
}
