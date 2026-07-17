using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddClientsAndSuppliers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ClientId",
                table: "Sales",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ClientId",
                table: "Budgets",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NicknameML = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SalesCategory = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    SalesDiscountPercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    NoteForClient = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CompanyOrFullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Cell = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    WebPage = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Address = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Province = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Locality = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    InitialBalance = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    BillingCompanyOrFullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TaxId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IvaCondition = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DefaultReceiptType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BillingPhone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    BillingCell = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    FiscalAddress = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    FiscalLocality = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FiscalProvince = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FiscalPostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Suppliers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PurchasesCategory = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    PurchasesDiscountPercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    NoteInternal = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CompanyOrFullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Cell = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    WebPage = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Address = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Province = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Locality = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    InitialBalance = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    BillingCompanyOrFullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TaxId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IvaCondition = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DefaultReceiptType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BillingPhone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    BillingCell = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    FiscalAddress = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    FiscalLocality = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FiscalProvince = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FiscalPostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Suppliers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClientContactPersons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClientId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Role = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    Cell = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientContactPersons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientContactPersons_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClientCustomFields",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClientId = table.Column<int>(type: "integer", nullable: false),
                    Label = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Value = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientCustomFields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientCustomFields_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SupplierContactPersons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SupplierId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Role = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    Cell = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplierContactPersons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupplierContactPersons_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SupplierCustomFields",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SupplierId = table.Column<int>(type: "integer", nullable: false),
                    Label = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Value = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplierCustomFields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupplierCustomFields_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Sales_ClientId",
                table: "Sales",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Budgets_ClientId",
                table: "Budgets",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientContactPersons_ClientId",
                table: "ClientContactPersons",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientCustomFields_ClientId",
                table: "ClientCustomFields",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_TaxId",
                table: "Clients",
                column: "TaxId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierContactPersons_SupplierId",
                table: "SupplierContactPersons",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierCustomFields_SupplierId",
                table: "SupplierCustomFields",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_TaxId",
                table: "Suppliers",
                column: "TaxId");

            migrationBuilder.AddForeignKey(
                name: "FK_Budgets_Clients_ClientId",
                table: "Budgets",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Sales_Clients_ClientId",
                table: "Sales",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Budgets_Clients_ClientId",
                table: "Budgets");

            migrationBuilder.DropForeignKey(
                name: "FK_Sales_Clients_ClientId",
                table: "Sales");

            migrationBuilder.DropTable(
                name: "ClientContactPersons");

            migrationBuilder.DropTable(
                name: "ClientCustomFields");

            migrationBuilder.DropTable(
                name: "SupplierContactPersons");

            migrationBuilder.DropTable(
                name: "SupplierCustomFields");

            migrationBuilder.DropTable(
                name: "Clients");

            migrationBuilder.DropTable(
                name: "Suppliers");

            migrationBuilder.DropIndex(
                name: "IX_Sales_ClientId",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Budgets_ClientId",
                table: "Budgets");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "Budgets");
        }
    }
}
