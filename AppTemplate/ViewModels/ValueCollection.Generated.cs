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
    public partial class ValueCollection : PagedCollectionView<Value>, IValueQuery
    {
        private ValueQuery query;

        public Guid? ValueId
        {
            get { return query.ValueId; }
            set { query.ValueId = value; }
        }

        protected override void AddCustomQuery(string rel, QueryStringBuilder queryString)
        {
            if (ValueId != null)
            {
                queryString.AppendItem("valueId", ValueId.Value.ToString());
            }


            OnAddCustomQuery(rel, queryString);

            base.AddCustomQuery(rel, queryString);
        }

        partial void OnAddCustomQuery(String rel, QueryStringBuilder queryString);
    }
}