using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Mvc.CacheUi;

namespace AppTemplate.Services
{
    public class AddEntryPointUiRenderer : ICacheUiBuilder
    {
        private readonly ICacheUiBuilder cacheUiBuilder;
        private readonly IEntryPointRenderer entryPointRenderer;

        public AddEntryPointUiRenderer(ICacheUiBuilder cacheUiBuilder, IEntryPointRenderer entryPointRenderer)
        {
            this.cacheUiBuilder = cacheUiBuilder;
            this.entryPointRenderer = entryPointRenderer;
        }

        public async Task<CacheUiResult> Build(Controller controller, string view, object model, string cacheToken)
        {
            var result = await cacheUiBuilder.Build(controller, view, model, cacheToken);
            if (result.UsingCacheRoot)
            {
                this.entryPointRenderer.AddEntryPoint(controller);
            }
            return result;
        }
    }
}
