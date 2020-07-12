using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Halcyon.HAL.Attributes;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Models;
using Threax.AspNetCore.Tracking;
using AppTemplate.Controllers.Api;
using Threax.AspNetCore.Halcyon.Ext.ValueProviders;
using AppTemplate.Controllers;

namespace AppTemplate.ViewModels
{
    [HalModel]
    [HalSelfActionLink(typeof(EntryPointController), nameof(EntryPointController.AppMenu))]
    [CacheEndpointDoc]
    public partial class AppMenu
    {
        public String UserName { get; set; }

        public bool IsAuthenticated { get; set; }

        public List<AppMenuItem> MenuItems { get; set; }
    }

    public class AppMenuItem
    {
        public AppMenuItem()
        {

        }

        public AppMenuItem(String text, String href)
        {
            this.Text = text;
            this.Href = href;
        }

        public String Text { get; set; }

        public String Href { get; set; }
    }
}
