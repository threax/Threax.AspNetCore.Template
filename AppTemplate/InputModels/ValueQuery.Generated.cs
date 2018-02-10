using Halcyon.HAL.Attributes;
using AppTemplate.Controllers;
using AppTemplate.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using System.ComponentModel.DataAnnotations;

namespace AppTemplate.InputModels
{
    [HalModel]
    public partial class ValueQuery : PagedCollectionQuery, IValueQuery
    {
        /// <summary>
        /// Lookup a value by id.
        /// </summary>
        public Guid? ValueId { get; set; }


        /// <summary>
        /// Populate an IQueryable for values. Does not apply the skip or limit.
        /// </summary>
        /// <param name="query">The query to populate.</param>
        /// <returns>The query passed in populated with additional conditions.</returns>
        public IQueryable<T> Create<T>(IQueryable<T> query) where T : IValue, IValueId
        {
            if (ValueId.HasValue)
            {
                query = query.Where(i => i.ValueId == ValueId);
            }
            else
            {
                OnCreate(ref query);
            }

            return query;
        }

        partial void OnCreate<T>(ref IQueryable<T> query);
    }
}