using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Tests;

// Verifica el idioma de transición atómica guardada por estado que usan
// SalesController.UpdateStatus y BudgetsController.Convert para evitar que dos requests
// concurrentes (doble click, retry) dupliquen un efecto secundario (reponer stock, crear venta).
// No prueba concurrencia real (dos threads a la vez) sino que la guarda WHERE Status == estado
// esperado hace lo que promete: 1 fila si el estado seguía siendo el leído, 0 si ya cambió.
public class GuardedStatusTransitionTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private AppDbContext _db = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        await _connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options;
        _db = new AppDbContext(options);
        await _db.Database.EnsureCreatedAsync();

        _db.Sales.Add(new Sale
        {
            Number = 1,
            Customer = new CustomerInfo { Name = "Cliente" },
            ClientType = ClientType.Retail,
            Status = SaleStatus.Paid,
            PaymentMethod = PaymentMethod.Cash,
        });
        await _db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task GuardedUpdate_Succeeds_WhenStatusStillMatches()
    {
        var sale = await _db.Sales.AsNoTracking().SingleAsync();

        var rows = await _db.Sales
            .Where(s => s.Id == sale.Id && s.Status == sale.Status)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, SaleStatus.Cancelled));

        Assert.Equal(1, rows);
    }

    [Fact]
    public async Task GuardedUpdate_Fails_WhenStatusAlreadyChanged_PreventingDoubleEffect()
    {
        var sale = await _db.Sales.AsNoTracking().SingleAsync();

        // Simula que otra request ya canceló la venta entre el SELECT y este UPDATE.
        await _db.Sales.Where(s => s.Id == sale.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, SaleStatus.Cancelled));

        // Esta request sigue creyendo que el estado leído es "Paid" (valor stale de `sale`).
        var rows = await _db.Sales
            .Where(s => s.Id == sale.Id && s.Status == sale.Status)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, SaleStatus.Cancelled));

        Assert.Equal(0, rows); // 0 filas => el controller no debe reponer stock ni confirmar
    }
}
