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

        public IActionResult Build(Controller controller, string cacheToken, string view = null)
        {
            var result = cacheUiBuilder.HandleCache(controller, cacheToken, out var useContentRoot, view);
            if (useContentRoot)
            {
                this.entryPointRenderer.AddEntryPoint(controller);
            }
            return result;
        }
    }
}
