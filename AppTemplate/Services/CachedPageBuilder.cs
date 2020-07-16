using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.CacheUi;

namespace AppTemplate.Services
{
    public class CachedPageBuilder : ICachedPageBuilder
    {
        private readonly ICacheUiBuilder cacheUiBuilder;
        private readonly IEntryPointRenderer entryPointRenderer;

        public CachedPageBuilder(ICacheUiBuilder cacheUiBuilder, IEntryPointRenderer entryPointRenderer)
        {
            this.cacheUiBuilder = cacheUiBuilder;
            this.entryPointRenderer = entryPointRenderer;
        }

        public async Task<IActionResult> Build(Controller controller, string cacheToken, string view = null, object model = null)
        {
            var result = await cacheUiBuilder.HandleCache(controller, cacheToken, view, model);
            if (result.UsingCacheRoot)
            {
                this.entryPointRenderer.AddEntryPoint(controller);
            }
            return result.ActionResult;
        }
    }
}
