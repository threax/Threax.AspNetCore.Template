using Microsoft.AspNetCore.Mvc;

namespace Threax.AspNetCore.CacheUi
{
    public interface ICacheUiBuilder
    {
        IActionResult HandleCache(Controller controller, string cacheToken, string title = null, string view = null, string action = null);
    }
}