using Microsoft.EntityFrameworkCore;

namespace AppTemplate.Database
{
    public partial class AppDbContext
    {
        public DbSet<ValueEntity> Values { get; set; }
    }
}
