using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppTemplate.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Threax.AspNetCore.UserBuilder.Entities;

namespace AppTemplate.Controllers.Api
{
    [Route("api")]
    [ResponseCache(NoStore = true)]
    [Authorize(AuthenticationSchemes = AuthCoreSchemes.Bearer)]
    public class EntryPointController : Controller
    {
        public class Rels
        {
            public const String Get = "GetEntryPoint";
            public const String GetAppMenu = "GetAppMenu";
        }

        [HttpGet]
        [HalRel(Rels.Get)]
        [AllowAnonymous]
        public EntryPoint Get()
        {
            return new EntryPoint();
        }

        [HttpGet("AppMenu")]
        [HalRel(Rels.GetAppMenu)]
        [AllowAnonymous]
        public AppMenu AppMenu([FromServices] IHttpContextAccessor httpContextAccessor)
        {
            var httpContex = httpContextAccessor.HttpContext;
            var user = httpContex.User;

            return new AppMenu()
            {
                IsAuthenticated = user.Identity.IsAuthenticated,
                MenuItems = GetMenuItems(user).ToList(),
                UserName = user.Identity.Name
            };
        }

        private IEnumerable<AppMenuItem> GetMenuItems(ClaimsPrincipal user)
        {
            yield return new AppMenuItem("Home", Url.Content("~/CacheUi/needscache/Startup"));
            yield return new AppMenuItem("Values", Url.Content("~/CacheUi/needscache/Values"));

            if (user.IsInRole(AuthorizationAdminRoles.EditRoles))
            {
                yield return new AppMenuItem("Edit Users", Url.Content("~/Admin/Users"));
            }
        }
    }
}
