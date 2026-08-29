using System.Linq;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SeedInitialCategories : Migration
    {
        private static readonly string[] SeedIds = new[]
        {
            "bancos", "escritorios", "mesas-comedor", "mesas-de-luz", "mesas-ratonas",
            "percheros-repisas", "racks-tv", "recibidores-mesas-arrime",
            "adornos-y-accesorios", "almohadones-y-mantas", "aromas-y-velas", "bandejas",
            "caminos-de-mesa", "canastos-cestos", "cuadros", "espejos", "fanales-y-candelabros",
            "floreros-jarrones-ceramica", "floreros-jarrones-vidrio", "gift-card", "manteles",
            "plantas-artificiales", "platos-de-sitio", "relojes",
        };

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Name", "Group", "Active" },
                values: new object[,]
                {
                    // Piezas Mayores
                    { "bancos", "Bancos", "Mayor", true },
                    { "escritorios", "Escritorios", "Mayor", true },
                    { "mesas-comedor", "Mesas comedor", "Mayor", true },
                    { "mesas-de-luz", "Mesas de luz", "Mayor", true },
                    { "mesas-ratonas", "Mesas ratonas", "Mayor", true },
                    { "percheros-repisas", "Percheros / repisas", "Mayor", true },
                    { "racks-tv", "Racks TV", "Mayor", true },
                    { "recibidores-mesas-arrime", "Recibidores / mesas de arrime", "Mayor", true },

                    // Pequeños Tesoros
                    { "adornos-y-accesorios", "Adornos y accesorios", "Tesoro", true },
                    { "almohadones-y-mantas", "Almohadones y mantas", "Tesoro", true },
                    { "aromas-y-velas", "Aromas y velas", "Tesoro", true },
                    { "bandejas", "Bandejas", "Tesoro", true },
                    { "caminos-de-mesa", "Caminos de mesa", "Tesoro", true },
                    { "canastos-cestos", "Canastos / cestos", "Tesoro", true },
                    { "cuadros", "Cuadros", "Tesoro", true },
                    { "espejos", "Espejos", "Tesoro", true },
                    { "fanales-y-candelabros", "Fanales y candelabros", "Tesoro", true },
                    { "floreros-jarrones-ceramica", "Floreros / jarrones de cerámica", "Tesoro", true },
                    { "floreros-jarrones-vidrio", "Floreros / jarrones de vidrio", "Tesoro", true },
                    { "gift-card", "Gift card", "Tesoro", true },
                    { "manteles", "Manteles", "Tesoro", true },
                    { "plantas-artificiales", "Plantas artificiales", "Tesoro", true },
                    { "platos-de-sitio", "Platos de sitio", "Tesoro", true },
                    { "relojes", "Relojes", "Tesoro", true },
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValues: SeedIds.Cast<object>().ToArray());
        }
    }
}
