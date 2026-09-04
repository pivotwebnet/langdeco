using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using backend.Controllers;
using backend.Data;
using backend.Dtos;
using backend.Models;
using backend.Services;

namespace backend.Tests;

// SQLite en memoria (no el proveedor InMemory de EF) porque Import usa transacciones
// explícitas (BeginTransactionAsync), que el proveedor InMemory no soporta.
public class ProductsControllerImportTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private AppDbContext _db = null!;
    private ProductsController _controller = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        await _connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options;
        _db = new AppDbContext(options);
        await _db.Database.EnsureCreatedAsync();

        _db.Categories.Add(new Category { Id = "sin-categoria", Name = "Sin categoría", Active = false });
        await _db.SaveChangesAsync();

        _controller = new ProductsController(_db, new ConfigurationBuilder().Build(), new ProductExcelService());
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    private static readonly string[] Headers =
    {
        "Id", "Nombre", "Tipo de Producto", "Proveedor", "Código", "Stock", "Costo", "IVA Compras",
        "Precio de Venta", "IVA Ventas", "CONTADO EFECTIVO", "PUBLICO", "Descripción", "Activo",
        "Mostrar en Ventas", "Mostrar en Compras", "Imagen",
    };

    private static IFormFile BuildWorkbook(params object[][] rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Productos");
        for (var i = 0; i < Headers.Length; i++) sheet.Cell(1, i + 1).Value = Headers[i];

        for (var r = 0; r < rows.Length; r++)
        {
            for (var c = 0; c < rows[r].Length; c++)
            {
                var cell = sheet.Cell(r + 2, c + 1);
                switch (rows[r][c])
                {
                    case string s: cell.Value = s; break;
                    case decimal d: cell.Value = d; break;
                    case int n: cell.Value = n; break;
                }
            }
        }

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return new FormFile(stream, 0, stream.Length, "file", "productos.xlsx");
    }

    private static object[] Row(int id, string name, string proveedor, string stock, decimal costo, decimal precio) =>
        new object[] { id, name, "", proveedor, "", stock, costo, 21, precio, 21, 0, 0, "", "Si", "Si", "Si", "No" };

    [Fact]
    public async Task Import_CreatesProduct_CreatesSupplier_And_LinksThem()
    {
        var file = BuildWorkbook(Row(1, "Mesa Ratona", "Proveedor Test", "2.0", 1000m, 2000m));

        var result = await _controller.Import(file);
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<ProductImportResultDto>(ok.Value);

        Assert.Equal(1, dto.Created);
        Assert.Equal(1, dto.SuppliersCreated);
        Assert.Empty(dto.Errors);

        var product = await _db.Products.Include(p => p.Supplier).AsNoTracking().SingleAsync();
        Assert.Equal("mesa-ratona", product.Id);
        Assert.Equal("sin-categoria", product.CategoryId);
        Assert.Equal(2, product.Stock);
        Assert.Equal(1000m, product.CostPrice);
        Assert.True(product.Active);
        Assert.NotNull(product.Supplier);
        Assert.Equal("Proveedor Test", product.Supplier!.CompanyOrFullName);
    }

    [Fact]
    public async Task Import_SameSupplierTwice_CreatesItOnlyOnce()
    {
        var file = BuildWorkbook(
            Row(1, "Silla A", "Mismo Proveedor", "1.0", 100m, 500m),
            Row(2, "Silla B", "Mismo Proveedor", "1.0", 100m, 500m));

        await _controller.Import(file);

        Assert.Equal(1, await _db.Suppliers.CountAsync());
    }

    [Fact]
    public async Task Import_ZeroPrice_CreatesInactiveWithPlaceholderPrice()
    {
        var file = BuildWorkbook(Row(1, "Producto Discontinuado", "", "0", 0m, 0m));

        await _controller.Import(file);

        var product = await _db.Products.AsNoTracking().SingleAsync();
        Assert.False(product.Active);
        Assert.Equal(1m, product.Price);
        Assert.Contains("revisar", product.Note);
    }

    [Fact]
    public async Task Import_NegativeStock_ClampsToZero_AndReportsCorrection()
    {
        var file = BuildWorkbook(Row(1, "Producto Ajuste", "", "-5.0", 100m, 500m));

        var result = await _controller.Import(file);
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<ProductImportResultDto>(ok.Value);

        Assert.Equal(1, dto.StockCorrected);
        var product = await _db.Products.AsNoTracking().SingleAsync();
        Assert.Equal(0, product.Stock);
    }

    [Fact]
    public async Task Import_DuplicateNames_GetDistinctSlugs()
    {
        var file = BuildWorkbook(
            Row(1, "Portarretrato", "", "1.0", 100m, 500m),
            Row(2, "Portarretrato", "", "1.0", 100m, 500m));

        await _controller.Import(file);

        var ids = await _db.Products.AsNoTracking().Select(p => p.Id).ToListAsync();
        Assert.Contains("portarretrato", ids);
        Assert.Contains("portarretrato-2", ids);
    }

    [Fact]
    public async Task Import_BlankName_IsReportedAsError_AndNotCreated()
    {
        // Un espacio (no una celda vacía) para que el parser no descarte la fila antes de
        // tiempo — así se ejerce la validación de nombre en blanco del propio controller.
        var file = BuildWorkbook(Row(1, " ", "", "1.0", 100m, 500m));

        var result = await _controller.Import(file);
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<ProductImportResultDto>(ok.Value);

        Assert.Equal(0, dto.Created);
        Assert.Single(dto.Errors);
        Assert.False(await _db.Products.AnyAsync());
    }
}
