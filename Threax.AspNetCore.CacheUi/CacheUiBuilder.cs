using Halcyon.HAL;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using System;

namespace Threax.AspNetCore.CacheUi
{
    public class CacheUiBuilder : ICacheUiBuilder
    {
        private readonly IHALConverter halConverter;
        private readonly IEntryPointProvider entryPointProvider;

        public CacheUiBuilder(IHALConverter halConverter, IEntryPointProvider entryPointProvider)
        {
            this.halConverter = halConverter;
            this.entryPointProvider = entryPointProvider;
        }

        public IActionResult HandleCache(Controller controller, string cacheToken, string title = null, string view = null, string action = null)
        {
            if (action == null)
            {
                action = controller.Request.RouteValues["action"]?.ToString();
                if (action == null)
                {
                    throw new InvalidOperationException("Cannot determine action for handling cache. Is the Request.ReouteValue 'action' set?");
                }
            }

            if (view == null)
            {
                view = action;
            }

            if (title == null)
            {
                title = action;
            }

            controller.Request.RouteValues.Remove("cacheToken");
            controller.RouteData.Values.Remove("cacheToken");
            if (cacheToken != null) //Cache and return as js if we have a token
            {
                if (cacheToken != "nocache")
                {
                    controller.HttpContext.Response.Headers["Cache-Control"] = "private, max-age=2592000, stale-while-revalidate=86400, immutable";
                }
                controller.HttpContext.Response.Headers["Content-Type"] = "application/javascript";
                return controller.View($"{view}Cache");
            }
            else
            {
                var entryPoint = entryPointProvider.GetEntryPoint(controller);
                if (!halConverter.CanConvert(entryPoint.GetType()))
                {
                    throw new InvalidOperationException($"Cannot convert entry point class '{entryPoint.GetType().FullName}' to a hal result.");
                }
                var halEntryPoint = halConverter.Convert(entryPoint);
                var model = new CacheRootModel()
                {
                    EntryJson = JsonConvert.SerializeObject(halEntryPoint, HalcyonConvention.DefaultJsonSerializerSettings),
                    Title = title ?? view,
                    ContentLink = controller.Url.CacheUiActionLink(action, controller.GetType())
                };
                return controller.View(view, model);
            }
        }
    }
}
