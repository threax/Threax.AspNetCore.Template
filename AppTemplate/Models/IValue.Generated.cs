using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Halcyon.HAL.Attributes;
using Threax.AspNetCore.Halcyon.Ext;

namespace AppTemplate.Models 
{
    public partial interface IValue 
    {
        String Name { get; set; }

    }

    public partial interface IValueId
    {
        Guid ValueId { get; set; }
    }    

    public partial interface IValueQuery
    {
        Guid? ValueId { get; set; }
        
    }
}
