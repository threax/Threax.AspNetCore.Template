using Halcyon.HAL.Attributes;
using AppTemplate.Controllers.Api;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.UserBuilder.Entities.Mvc;
using Threax.AspNetCore.UserLookup.Mvc.Controllers;
using System;
using System.Collections.Generic;

namespace AppTemplate.ViewModels
{
    [HalModel]
    [HalEntryPoint]
    [HalSelfActionLink(typeof(EntryPointController), nameof(EntryPointController.Get))]
    //This first set of links is for role editing, you can erase them if you don't have users or roles.
    [HalActionLink(RolesControllerRels.GetUser, typeof(RolesController))]
    [HalActionLink(RolesControllerRels.ListUsers, typeof(RolesController))]
    [HalActionLink(RolesControllerRels.SetUser, typeof(RolesController))]
    //User Search Actions
    [HalActionLink(typeof(UserSearchController), nameof(UserSearchController.List), "ListAppUsers")]
    //The additional entry point links are in the other entry point partial classes, expand this node to see them
    public partial class EntryPoint
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
