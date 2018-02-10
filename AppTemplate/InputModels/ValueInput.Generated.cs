using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Halcyon.HAL.Attributes;
using Threax.AspNetCore.Halcyon.Ext;
using AppTemplate.Models;
using Threax.AspNetCore.Models;

namespace AppTemplate.InputModels 
{
    [HalModel]
    public partial class ValueInput : IValue
    {
        [UiOrder]
        [MaxLength(450, ErrorMessage = "Name must be less than 450 characters.")]
        [Required(ErrorMessage = "Name must have a value.")]
        public String Name { get; set; }

    }
}
