using Microsoft.AspNetCore.Mvc;
using System;

namespace Threax.AspNetCore.CacheUi
{
    public class CacheUiBuilder : ICacheUiBuilder
    {
        private readonly CacheUiConfig cacheUiConfig;

        public CacheUiBuilder(CacheUiConfig cacheUiConfig)
        {
            this.cacheUiConfig = cacheUiConfig;
        }

        public IActionResult HandleCache(Controller controller, string cacheToken, out bool usingCacheRoot, string view = null)
        {
            var action = controller.Request.RouteValues["action"]?.ToString();
            if (action == null)
            {
                throw new InvalidOperationException("Cannot determine action for handling cache. Is the Request.ReouteValue 'action' set?");
            }

            if (view == null)
            {
                view = action;
            }

            controller.Request.RouteValues.Remove("cacheToken");
            controller.RouteData.Values.Remove("cacheToken");
            if (cacheToken != null) //Cache and return as js if we have a token
            {
                if (cacheToken != cacheUiConfig.NoCacheModeToken)
                {
                    controller.HttpContext.Response.Headers["Cache-Control"] = cacheUiConfig.CacheControlHeader;
                }
                else
                {
                    controller.HttpContext.Response.Headers["Cache-Control"] = "no-store"; //Force no cache if requested.
                }
                controller.HttpContext.Response.Headers["Content-Type"] = "application/javascript";
                usingCacheRoot = false;
                return controller.View(view);
            }
            else
            {
                controller.HttpContext.Response.Headers["Cache-Control"] = "no-store"; //No caching for the entry page.

                controller.ViewData["Title"] = action;
                controller.ViewData["ContentLink"] = controller.Url.CacheUiActionLink(action, controller.GetType());
                usingCacheRoot = true;
                return controller.View("CacheRoot");
            }
        }

        public IActionResult HandleCache(Controller controller, string cacheToken, string view = null)
        {
            return HandleCache(controller, cacheToken, out _, view);
        }
    }
}
