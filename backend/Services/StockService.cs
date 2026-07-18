using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Services;

public class StockService
{
    private readonly AppDbContext _db;

    public StockService(AppDbContext db) => _db = db;

    public async Task<bool> TryDecrementAsync(string productId, int quantity)
    {
        var rowsUpdated = await _db.Products
            .Where(p => p.Id == productId && p.Stock >= quantity)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock - quantity));

        return rowsUpdated > 0;
    }

    public Task IncrementAsync(string productId, int quantity) =>
        _db.Products
            .Where(p => p.Id == productId)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock + quantity));
}
