using System;
using HtmlRapier.TagHelpers;
using Newtonsoft.Json;

namespace AppTemplate
{
    /// <summary>
    /// Client side configuration, copied onto pages returned to client, so don't include secrets.
    /// </summary>
    public class ClientConfig : ClientConfigBase
    {
        /// <summary>
        /// The url of the app's service, defaults to ~/api. You can
        /// specify an absolute url here if you want.
        /// </summary>
        [ExpandHostPath]
        public string ServiceUrl { get; set; } = "~/api";

        [ExpandHostPath]
        public string AccessTokenPath { get; set; } = "~/Account/AccessToken";

        /// <summary>
        /// The path to the bearer cookie. Move this somewhere else
        /// </summary>
        public String BearerCookieName
        {

            //This needs to move to a tag helper, this is why its so ugly

            get;





            set;
        }

        /// <summary>
        /// The base path to the cached uis. This should use forward slash '/' and not start or end with one. 
        /// It will be combined with the PageBasePath provided by the framework,
        /// so it should be a relative path.
        /// </summary>
        public String HashUiBasePath
        {

            //This needs to move to a tag helper, this is why its so ugly

            get;





            set;
        }
    }
}