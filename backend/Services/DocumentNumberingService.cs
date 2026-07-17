using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Services;

public class DocumentNumberingService
{
    private readonly AppDbContext _db;

    public DocumentNumberingService(AppDbContext db) => _db = db;

    public async Task<int> NextNumberAsync(DocumentType type)
    {
        var typeValue = type.ToString();
        var results = await _db.Database
            .SqlQuery<int>($"UPDATE \"DocumentCounters\" SET \"LastNumber\" = \"LastNumber\" + 1 WHERE \"Type\" = {typeValue} RETURNING \"LastNumber\"")
            .ToListAsync();

        if (results.Count == 0)
            throw new InvalidOperationException($"No existe contador de documento para el tipo '{typeValue}'");

        return results.Single();
    }
}
