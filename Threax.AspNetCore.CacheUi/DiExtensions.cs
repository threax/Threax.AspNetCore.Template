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
        public static IServiceCollection AddThreaxCacheUi<T>(this IServiceCollection services, String cacheToken, Action<CacheUiConfig> configureOptions = null)
            where T : Controller
        {
            var options = new CacheUiConfig();
            configureOptions?.Invoke(options);

            CacheUiUrlHelperExtensions.CacheToken = cacheToken;

            services.TryAddScoped<ICacheUiBuilder, CacheUiBuilder>();
            services.TryAddScoped<IEntryPointProvider, ReflectedEntryPointProvider<T>>();

            return services;
        }
    }
}
