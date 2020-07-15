using Microsoft.AspNetCore.Mvc;

namespace AppTemplate.Services
{
    public interface ICachedPageBuilder
    {
        IActionResult Build(Controller controller, string cacheToken, string view = null);
    }
}