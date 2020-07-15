using Microsoft.AspNetCore.Mvc;

namespace AppTemplate.Services
{
    public interface IEntryPointRenderer
    {
        void AddEntryPoint(Controller controller);
    }
}