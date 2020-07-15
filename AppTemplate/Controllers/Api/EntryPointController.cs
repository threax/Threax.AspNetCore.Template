﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppTemplate.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using System.Security.Claims;
using Threax.AspNetCore.UserBuilder.Entities;
using Microsoft.AspNetCore.Http;

namespace AppTemplate.Controllers.Api
{
    [Route("api")]
    [ResponseCache(NoStore = true)]
    [Authorize(AuthenticationSchemes = AuthCoreSchemes.Bearer)]
    public class EntryPointController : Controller
    {
        private readonly IHttpContextAccessor httpContextAccessor;

        public class Rels
        {
            public const String Get = "GetEntryPoint";
        }

        public EntryPointController(IHttpContextAccessor httpContextAccessor)
        {
            this.httpContextAccessor = httpContextAccessor;
        }

        [HttpGet]
        [HalRel(Rels.Get)]
        [AllowAnonymous]
        public EntryPoint Get()
        {
            var httpContex = httpContextAccessor.HttpContext;
            var user = httpContex.User;

            return new EntryPoint()
            {
                IsAuthenticated = user.Identity.IsAuthenticated,
                UserName = user.Identity.Name
            };
        }
    }
}
