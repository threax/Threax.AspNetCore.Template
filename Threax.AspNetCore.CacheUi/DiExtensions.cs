using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System;
using System.Collections.Generic;
using System.Text;
using Threax.AspNetCore.CacheUi;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class DiExtensions
    {
        public static IServiceCollection AddThreaxCacheUi(this IServiceCollection services, String cacheToken, Action<CacheUiConfig> configureOptions = null)
        {
            var options = new CacheUiConfig();
            configureOptions?.Invoke(options);

            CacheUiUrlHelperExtensions.CacheToken = cacheToken;

            services.TryAddSingleton<CacheUiConfig>(options);
            services.TryAddScoped<ICacheUiBuilder, CacheUiBuilder>();

            return services;
        }
    }
}
