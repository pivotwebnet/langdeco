using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Services;

public class BudgetLifecycleService
{
    private readonly AppDbContext _db;

    public BudgetLifecycleService(AppDbContext db) => _db = db;

    public async Task ExpireIfNeededAsync(Budget budget)
    {
        if (budget.Status == BudgetStatus.Open && budget.ValidUntil is not null && budget.ValidUntil < DateTime.UtcNow)
        {
            budget.Status = BudgetStatus.Expired;
            await _db.SaveChangesAsync();
        }
    }

    public async Task ExpireIfNeededAsync(IEnumerable<Budget> budgets)
    {
        var toExpire = budgets
            .Where(b => b.Status == BudgetStatus.Open && b.ValidUntil is not null && b.ValidUntil < DateTime.UtcNow)
            .ToList();

        if (toExpire.Count == 0) return;

        foreach (var budget in toExpire)
            budget.Status = BudgetStatus.Expired;

        await _db.SaveChangesAsync();
    }

    public async Task ReopenIfConvertedAsync(int budgetId)
    {
        var budget = await _db.Budgets.FirstOrDefaultAsync(b => b.Id == budgetId);
        if (budget is null || budget.Status != BudgetStatus.Converted) return;

        var expired = budget.ValidUntil is not null && budget.ValidUntil < DateTime.UtcNow;
        budget.Status = expired ? BudgetStatus.Expired : BudgetStatus.Open;
        budget.ConvertedSaleId = null;
        budget.ConvertedAt = null;
        await _db.SaveChangesAsync();
    }
}
