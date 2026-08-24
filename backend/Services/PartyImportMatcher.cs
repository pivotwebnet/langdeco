using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Services;

// Resuelve el matching de import de Excel (por TaxId, con fallback a nombre) para Client/Supplier
// con un único prefetch en vez de 1-2 SELECT por fila.
public static class PartyImportMatcher
{
    public static async Task<PartyLookup<TParty>> PrefetchAsync<TParty>(
        IQueryable<TParty> query,
        IEnumerable<(string? TaxId, string CompanyOrFullName)> rows) where TParty : PartyBase
    {
        var taxIds = rows.Select(r => r.TaxId).Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t!).Distinct().ToList();
        var names = rows.Select(r => r.CompanyOrFullName.ToLower()).Distinct().ToList();

        var matches = await query
            .Where(p => (p.TaxId != null && taxIds.Contains(p.TaxId)) || names.Contains(p.CompanyOrFullName.ToLower()))
            .ToListAsync();

        return new PartyLookup<TParty>(matches);
    }
}

public class PartyLookup<TParty> where TParty : PartyBase
{
    private readonly Dictionary<string, TParty> _byTaxId = new();
    private readonly Dictionary<string, TParty> _byName = new();

    public PartyLookup(List<TParty> matches)
    {
        foreach (var p in matches)
        {
            if (!string.IsNullOrWhiteSpace(p.TaxId))
                _byTaxId.TryAdd(p.TaxId, p);
            _byName.TryAdd(p.CompanyOrFullName.ToLower(), p);
        }
    }

    public TParty? Find(string? taxId, string companyOrFullName)
    {
        if (!string.IsNullOrWhiteSpace(taxId) && _byTaxId.TryGetValue(taxId, out var byTax))
            return byTax;
        return _byName.TryGetValue(companyOrFullName.ToLower(), out var byName) ? byName : null;
    }
}
