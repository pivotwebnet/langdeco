using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class RemoveProductAspectOriginTagAddCardPrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Aspect",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Origin",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Tag",
                table: "Products");

            migrationBuilder.AddColumn<decimal>(
                name: "CardPrice",
                table: "Products",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CardPrice",
                table: "Products");

            migrationBuilder.AddColumn<string>(
                name: "Aspect",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Origin",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tag",
                table: "Products",
                type: "text",
                nullable: true);
        }
    }
}
