using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_Active",
                table: "Suppliers",
                column: "Active");

            migrationBuilder.CreateIndex(
                name: "IX_Sales_CreatedAt",
                table: "Sales",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Sales_Status",
                table: "Sales",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Active",
                table: "Products",
                column: "Active");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_Active",
                table: "Clients",
                column: "Active");

            migrationBuilder.CreateIndex(
                name: "IX_Budgets_Status",
                table: "Budgets",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Budgets_ValidUntil",
                table: "Budgets",
                column: "ValidUntil");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Suppliers_Active",
                table: "Suppliers");

            migrationBuilder.DropIndex(
                name: "IX_Sales_CreatedAt",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Sales_Status",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Products_Active",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Clients_Active",
                table: "Clients");

            migrationBuilder.DropIndex(
                name: "IX_Budgets_Status",
                table: "Budgets");

            migrationBuilder.DropIndex(
                name: "IX_Budgets_ValidUntil",
                table: "Budgets");
        }
    }
}
