using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace AppTemplate.Services
{
    public interface ICachedPageBuilder
    {
        Task<IActionResult> Build(Controller controller, string cacheToken, string view = null, object model = null);
    }
}