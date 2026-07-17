using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddBudgetsAndReceiptNumbering : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Customer_Address",
                table: "Sales",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Customer_Contact",
                table: "Sales",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Customer_Name",
                table: "Sales",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Customer_TaxId",
                table: "Sales",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountAmount",
                table: "Sales",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountPercent",
                table: "Sales",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "Number",
                table: "Sales",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "Subtotal",
                table: "Sales",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxAmount",
                table: "Sales",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxRatePercent",
                table: "Sales",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            // Backfill: copy legacy client fields into the new owned Customer_* columns
            // and derive Number/Subtotal from existing data before dropping the old columns.
            migrationBuilder.Sql(
                "UPDATE \"Sales\" SET \"Customer_Name\" = \"ClientName\", \"Customer_Contact\" = \"ClientContact\";");
            migrationBuilder.Sql(
                "UPDATE \"Sales\" SET \"Number\" = \"Id\", \"Subtotal\" = \"Total\";");

            migrationBuilder.DropColumn(
                name: "ClientContact",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ClientName",
                table: "Sales");

            migrationBuilder.CreateTable(
                name: "Budgets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Number = table.Column<int>(type: "integer", nullable: false),
                    Customer_Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Customer_Contact = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Customer_TaxId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Customer_Address = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    ClientType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Subtotal = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    DiscountPercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    TaxRatePercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    TaxAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Total = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ValidUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Budgets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CompanySettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    LogoPath = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanySettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DocumentCounters",
                columns: table => new
                {
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    LastNumber = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentCounters", x => x.Type);
                });

            migrationBuilder.CreateTable(
                name: "BudgetItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BudgetId = table.Column<int>(type: "integer", nullable: false),
                    ProductId = table.Column<string>(type: "character varying(80)", nullable: false),
                    ProductName = table.Column<string>(type: "text", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BudgetItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BudgetItems_Budgets_BudgetId",
                        column: x => x.BudgetId,
                        principalTable: "Budgets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BudgetItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Sales_Number",
                table: "Sales",
                column: "Number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BudgetItems_BudgetId",
                table: "BudgetItems",
                column: "BudgetId");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetItems_ProductId",
                table: "BudgetItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Budgets_Number",
                table: "Budgets",
                column: "Number",
                unique: true);

            // Seed default company settings and per-document-type correlative counters.
            // Sale's counter continues from the highest backfilled Number so future sales
            // never collide with historical ones; Budget starts fresh at 0 (first issued = 1).
            migrationBuilder.Sql(
                "INSERT INTO \"CompanySettings\" (\"Id\", \"Name\", \"Phone\", \"LogoPath\") VALUES (1, 'LaLang Deco', NULL, NULL);");
            migrationBuilder.Sql(
                "INSERT INTO \"DocumentCounters\" (\"Type\", \"LastNumber\") " +
                "VALUES ('Sale', COALESCE((SELECT MAX(\"Number\") FROM \"Sales\"), 0)), ('Budget', 0);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BudgetItems");

            migrationBuilder.DropTable(
                name: "CompanySettings");

            migrationBuilder.DropTable(
                name: "DocumentCounters");

            migrationBuilder.DropTable(
                name: "Budgets");

            migrationBuilder.DropIndex(
                name: "IX_Sales_Number",
                table: "Sales");

            migrationBuilder.AddColumn<string>(
                name: "ClientContact",
                table: "Sales",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClientName",
                table: "Sales",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(
                "UPDATE \"Sales\" SET \"ClientName\" = \"Customer_Name\", \"ClientContact\" = \"Customer_Contact\";");

            migrationBuilder.DropColumn(
                name: "Customer_Address",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "Customer_Contact",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "Customer_Name",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "Customer_TaxId",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "DiscountAmount",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "DiscountPercent",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "Number",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "Subtotal",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "TaxAmount",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "TaxRatePercent",
                table: "Sales");
        }
    }
}
