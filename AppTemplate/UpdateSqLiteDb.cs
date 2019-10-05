using Microsoft.EntityFrameworkCore;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppTemplate
{
    public class UpdateSqLiteDb<T> where T : DbContext
    {
        private DbContext dbContext;

        public UpdateSqLiteDb(T dbContext)
        {
            this.dbContext = dbContext;
        }

        public void Execute()
        {
            var type = typeof(T);
            var enumerableType = typeof(IEnumerable);

            foreach(var prop in type.GetProperties()
                .Where(i => enumerableType.IsAssignableFrom(i.PropertyType)))
            {
                var propType = prop.PropertyType.GetGenericArguments()[0];

                var mapping = dbContext.Model.FindEntityType(propType);
                var schema = mapping.GetSchema();
                var table = mapping.GetTableName();

                foreach (var columnInfo in propType.GetProperties().Where(i => i.PropertyType == typeof(Guid)))
                {
                    var column = columnInfo.Name;

                    dbContext.Database.ExecuteSqlRaw(
$@"PRAGMA foreign_keys = 0;
UPDATE ""{table}""
SET ""{column}"" = hex(substr(""{column}"", 4, 1)) ||
                 hex(substr(""{column}"", 3, 1)) ||
                 hex(substr(""{column}"", 2, 1)) ||
                 hex(substr(""{column}"", 1, 1)) || '-' ||
                 hex(substr(""{column}"", 6, 1)) ||
                 hex(substr(""{column}"", 5, 1)) || '-' ||
                 hex(substr(""{column}"", 8, 1)) ||
                 hex(substr(""{column}"", 7, 1)) || '-' ||
                 hex(substr(""{column}"", 9, 2)) || '-' ||
                 hex(substr(""{column}"", 11, 6))
WHERE typeof(""{column}"") == 'blob';
PRAGMA foreign_keys = 1;");
                }
            }
        }
    }
}
