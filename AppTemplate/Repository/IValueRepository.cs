using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AppTemplate.InputModels;
using AppTemplate.ViewModels;
using AppTemplate.Models;
using Threax.AspNetCore.Halcyon.Ext;

namespace AppTemplate.Repository
{
    public partial interface IValueRepository
    {
        Task<Value> Add(ValueInput value);
        Task AddRange(IEnumerable<ValueInput> values);
        Task Delete(Guid id);
        Task<Value> Get(Guid valueId);
        Task<bool> HasValues();
        Task<ValueCollection> List(ValueQuery query);
        Task<Value> Update(Guid valueId, ValueInput value);
    }
}