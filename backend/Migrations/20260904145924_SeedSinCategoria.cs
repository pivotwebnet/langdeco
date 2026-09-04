using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SeedSinCategoria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Categoría placeholder para productos importados por Excel sin categoría de
            // origen. Active=false la oculta del filtro público de categorías; los productos
            // que caen acá siguen siendo visibles individualmente hasta que se reasignan
            // desde el wizard de categorización del panel.
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Name", "Group", "Active" },
                values: new object[] { "sin-categoria", "Sin categoría", "Tesoro", false });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: "sin-categoria");
        }
    }
}
