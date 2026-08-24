using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;

namespace backend.Tests;

// SQLite en memoria (no el proveedor InMemory de EF) porque StockService depende de
// ExecuteUpdateAsync, que necesita un motor SQL real para traducirse.
public class StockServiceTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private AppDbContext _db = null!;
    private StockService _service = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        await _connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new AppDbContext(options);
        await _db.Database.EnsureCreatedAsync();
        _service = new StockService(_db);

        _db.Categories.Add(new Category { Id = "mayor", Name = "Piezas Mayores" });
        _db.Products.Add(new Product { Id = "p1", Name = "Sofá", Material = "Lino", CategoryId = "mayor", Price = 100_000m, Stock = 5 });
        await _db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task TryDecrementAsync_Succeeds_WhenEnoughStock()
    {
        var ok = await _service.TryDecrementAsync("p1", 3);

        Assert.True(ok);
        var product = await _db.Products.AsNoTracking().SingleAsync(p => p.Id == "p1");
        Assert.Equal(2, product.Stock);
    }

    [Fact]
    public async Task TryDecrementAsync_Fails_WhenNotEnoughStock_AndLeavesStockUntouched()
    {
        var ok = await _service.TryDecrementAsync("p1", 10);

        Assert.False(ok); // la guarda WHERE Stock >= quantity evita el update
        var product = await _db.Products.AsNoTracking().SingleAsync(p => p.Id == "p1");
        Assert.Equal(5, product.Stock);
    }

    [Fact]
    public async Task TryDecrementAsync_ExactStock_Succeeds_LeavesZero()
    {
        var ok = await _service.TryDecrementAsync("p1", 5);

        Assert.True(ok);
        var product = await _db.Products.AsNoTracking().SingleAsync(p => p.Id == "p1");
        Assert.Equal(0, product.Stock);
    }

    [Fact]
    public async Task IncrementAsync_AddsStockBack()
    {
        await _service.IncrementAsync("p1", 4);

        var product = await _db.Products.AsNoTracking().SingleAsync(p => p.Id == "p1");
        Assert.Equal(9, product.Stock);
    }
}
