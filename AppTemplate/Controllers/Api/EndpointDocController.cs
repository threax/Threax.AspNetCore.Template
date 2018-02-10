using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Net;
using Threax.AspNetCore.ExceptionFilter;
using Threax.AspNetCore.Halcyon.Ext;

namespace AppTemplate.Controllers.Api
{
    [Route("api/[controller]")]
    [ResponseCache(NoStore = true)]
    [Authorize(AuthenticationSchemes = AuthCoreSchemes.Bearer)]
    public class EndpointDocController : Controller
    {
        IEndpointDocBuilder descriptionProvider;

        public EndpointDocController(IEndpointDocBuilder descriptionProvider)
        {
            this.descriptionProvider = descriptionProvider;
        }

        [HttpGet("{groupName}/{method}/{*relativePath}")]
        [HalRel(HalDocEndpointInfo.DefaultRels.Get)]
        [AllowAnonymous]
        public EndpointDoc Get(String groupName, String method, String relativePath)
        {
            try
            {
                return descriptionProvider.GetDoc(groupName, method, relativePath, User);
            }
            catch (UnauthorizedAccessException)
            {
                throw new ErrorResultException("Unauthorized", HttpStatusCode.Unauthorized);
            }
        }
    }
}
