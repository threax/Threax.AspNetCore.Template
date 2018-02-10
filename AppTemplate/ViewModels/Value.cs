using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Halcyon.HAL.Attributes;
using Threax.AspNetCore.Halcyon.Ext;
using AppTemplate.Models;
using AppTemplate.Controllers.Api;

namespace AppTemplate.ViewModels
{
    [HalModel]
    [HalSelfActionLink(typeof(ValuesController), nameof(ValuesController.Get))]
    [HalActionLink(typeof(ValuesController), nameof(ValuesController.Update))]
    [HalActionLink(typeof(ValuesController), nameof(ValuesController.Delete))]
    public partial class Value
    {
        //You can add your own customizations here. These will not be overwritten by the model generator.
        //See Value.Generated for the generated code
    }
}