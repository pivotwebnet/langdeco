using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddWholesalePricingAndBudgetConversion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BudgetId",
                table: "Sales",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountFixedAmount",
                table: "Sales",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "DiscountType",
                table: "Sales",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Percent");

            migrationBuilder.AddColumn<string>(
                name: "PriceType",
                table: "SaleItems",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Retail");

            migrationBuilder.AddColumn<decimal>(
                name: "WholesalePrice",
                table: "Products",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ConvertedAt",
                table: "Budgets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ConvertedSaleId",
                table: "Budgets",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountFixedAmount",
                table: "Budgets",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "DiscountType",
                table: "Budgets",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Percent");

            migrationBuilder.AddColumn<string>(
                name: "PriceType",
                table: "BudgetItems",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Retail");

            migrationBuilder.CreateIndex(
                name: "IX_Sales_BudgetId",
                table: "Sales",
                column: "BudgetId");

            migrationBuilder.CreateIndex(
                name: "IX_Budgets_ConvertedSaleId",
                table: "Budgets",
                column: "ConvertedSaleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Budgets_Sales_ConvertedSaleId",
                table: "Budgets",
                column: "ConvertedSaleId",
                principalTable: "Sales",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Sales_Budgets_BudgetId",
                table: "Sales",
                column: "BudgetId",
                principalTable: "Budgets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Budgets_Sales_ConvertedSaleId",
                table: "Budgets");

            migrationBuilder.DropForeignKey(
                name: "FK_Sales_Budgets_BudgetId",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Sales_BudgetId",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Budgets_ConvertedSaleId",
                table: "Budgets");

            migrationBuilder.DropColumn(
                name: "BudgetId",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "DiscountFixedAmount",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "DiscountType",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "PriceType",
                table: "SaleItems");

            migrationBuilder.DropColumn(
                name: "WholesalePrice",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ConvertedAt",
                table: "Budgets");

            migrationBuilder.DropColumn(
                name: "ConvertedSaleId",
                table: "Budgets");

            migrationBuilder.DropColumn(
                name: "DiscountFixedAmount",
                table: "Budgets");

            migrationBuilder.DropColumn(
                name: "DiscountType",
                table: "Budgets");

            migrationBuilder.DropColumn(
                name: "PriceType",
                table: "BudgetItems");
        }
    }
}
