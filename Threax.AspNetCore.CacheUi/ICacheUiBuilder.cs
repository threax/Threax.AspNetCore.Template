using Microsoft.AspNetCore.Mvc;

namespace Threax.AspNetCore.CacheUi
{
    public interface ICacheUiBuilder
    {
        IActionResult HandleCache(Controller controller, string cacheToken, out bool useContentRoot, string view = null);

        IActionResult HandleCache(Controller controller, string cacheToken, string view = null);
    }
}