using Halcyon.HAL.Attributes;
using AppTemplate.Controllers.Api;
using AppTemplate.Models;
using AppTemplate.InputModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;

namespace AppTemplate.ViewModels
{
    public partial class ValueCollection : PagedCollectionViewWithQuery<Value, ValueQuery>
    {
        
    }
}