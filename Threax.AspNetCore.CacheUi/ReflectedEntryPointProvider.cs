using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text;
using Threax.AspNetCore.Halcyon.Ext;

namespace Threax.AspNetCore.CacheUi
{
    public class ReflectedEntryPointProvider<T> : IEntryPointProvider
        where T: Controller
    {
        private readonly T entryPointController;
        private Lazy<MethodInfo> getEntrypointMethod;

        public ReflectedEntryPointProvider(T entryPointController)
        {
            this.entryPointController = entryPointController;
            getEntrypointMethod = new Lazy<MethodInfo>(() => LookupEntryPoint(), true);
        }

        public object GetEntryPoint(Controller primaryController)
        {
            this.entryPointController.Url = primaryController.Url;
            this.entryPointController.ControllerContext = primaryController.ControllerContext;

            return this.getEntrypointMethod.Value.Invoke(this.entryPointController, null);
        }

        private static MethodInfo LookupEntryPoint()
        {
            var typeInfo = typeof(T);
            var method = typeInfo.GetMethod("Get");
            if (method.GetCustomAttribute<HalRelAttribute>() == null)
            {
                throw new InvalidOperationException($"Your Entry Point Get method must be marked with a '{nameof(HalRelAttribute)}'.");
            }
            return method;
        }
    }
}
