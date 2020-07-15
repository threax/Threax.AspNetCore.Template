using AppTemplate.Controllers.Api;
using Halcyon.HAL;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppTemplate.Services
{
    public class EntryPointRenderer : IEntryPointRenderer
    {
        private readonly EntryPointController entryPointController;
        private readonly IHALConverter halConverter;

        public EntryPointRenderer(EntryPointController entryPointController, IHALConverter halConverter)
        {
            this.entryPointController = entryPointController;
            this.halConverter = halConverter;
        }

        public void AddEntryPoint(Controller controller)
        {
            this.entryPointController.Url = controller.Url;
            this.entryPointController.ControllerContext = controller.ControllerContext;

            var entryPoint = entryPointController.Get();
            if (!halConverter.CanConvert(entryPoint.GetType()))
            {
                throw new InvalidOperationException($"Cannot convert entry point class '{entryPoint.GetType().FullName}' to a hal result.");
            }
            var halEntryPoint = halConverter.Convert(entryPoint);
            controller.ViewData["EntryJson"] = JsonConvert.SerializeObject(halEntryPoint, HalcyonConvention.DefaultJsonSerializerSettings);
        }
    }
}
