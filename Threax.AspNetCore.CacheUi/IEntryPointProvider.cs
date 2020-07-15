using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.AspNetCore.CacheUi
{
    public interface IEntryPointProvider
    {
        Object GetEntryPoint(Controller controller);
    }
}
