using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.AspNetCore.CacheUi
{
    public class CacheUiConfig
    {
        /// <summary>
        /// The value to set for the CacheControlHeader. Default: 'private, max-age=2592000, stale-while-revalidate=86400, immutable'
        /// </summary>
        public String CacheControlHeader { get; set; } = "private, max-age=2592000, stale-while-revalidate=86400, immutable";
    }
}
