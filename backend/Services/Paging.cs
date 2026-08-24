using Microsoft.EntityFrameworkCore;
using backend.Dtos;

namespace backend.Services;

public static class Paging
{
    public const int DefaultPageSize = 50;
    public const int MaxPageSize = 200;

    public static async Task<PagedResult<T>> ApplyAsync<T>(IQueryable<T> query, int page, int? pageSize)
    {
        var size = Math.Clamp(pageSize ?? DefaultPageSize, 1, MaxPageSize);
        var pageNum = Math.Max(page, 1);
        var total = await query.CountAsync();
        var items = await query.Skip((pageNum - 1) * size).Take(size).ToListAsync();
        return new PagedResult<T>(items, total, pageNum, size);
    }
}
