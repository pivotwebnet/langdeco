using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/gastos")]
[RequireAdminKey]
public class GastosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly DocumentNumberingService _numbering;
    private readonly GastoExcelService _excel;

    public GastosController(AppDbContext db, DocumentNumberingService numbering, GastoExcelService excel)
    {
        _db = db;
        _numbering = numbering;
        _excel = excel;
    }

    // Mismo patrón que ProductsController.Import: formato de columnas fijo (ver GastoExcelService),
    // se cae a la primera hoja del archivo sea cual sea su nombre, crea el Proveedor si no existe
    // por nombre (igual que el import de productos crea el Proveedor que trae la planilla), y
    // corre todo dentro de una única transacción. A diferencia de Compras/Ventas, un Gasto
    // importado no afecta stock ni ningún otro estado — es un alta directa fila a fila.
    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<GastoImportResultDto>> Import(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Archivo vacío" });

        List<GastoImportRow> rows;
        try
        {
            using var stream = file.OpenReadStream();
            rows = _excel.ParseImport(stream);
        }
        catch (Exception ex) when (ex is InvalidOperationException or IOException or FormatException)
        {
            return BadRequest(new { error = $"No se pudo leer el archivo como Excel (.xlsx): {ex.Message}" });
        }

        var supplierLookup = await PartyImportMatcher.PrefetchAsync(
            _db.Suppliers,
            rows.Where(r => !string.IsNullOrWhiteSpace(r.SupplierName)).Select(r => ((string?)null, r.SupplierName!)));

        var errors = new List<ImportRowError>();
        var created = 0;
        var suppliersCreated = 0;

        await using var tx = await _db.Database.BeginTransactionAsync();

        foreach (var row in rows)
        {
            if (string.IsNullOrWhiteSpace(row.Description))
            {
                errors.Add(new ImportRowError(row.RowNumber, "Falta la descripción"));
                continue;
            }

            if (row.Amount <= 0)
            {
                errors.Add(new ImportRowError(row.RowNumber, "El monto debe ser mayor a cero"));
                continue;
            }

            Supplier? supplier = null;
            if (!string.IsNullOrWhiteSpace(row.SupplierName))
            {
                supplier = supplierLookup.Find(null, row.SupplierName);
                if (supplier is null)
                {
                    supplier = new Supplier
                    {
                        CompanyOrFullName = row.SupplierName.Trim(),
                        BillingCompanyOrFullName = row.SupplierName.Trim(),
                    };
                    _db.Suppliers.Add(supplier);
                    supplierLookup.Register(supplier);
                    suppliersCreated++;
                }
            }

            _db.Gastos.Add(new Gasto
            {
                Date = DateTime.SpecifyKind(row.Date, DateTimeKind.Utc),
                Category = MapCategory(row.CategoryRaw),
                Description = row.Description,
                Amount = row.Amount,
                PaymentMethod = MapPaymentMethod(row.PaymentMethodRaw),
                Supplier = supplier,
                Number = await _numbering.NextNumberAsync(DocumentType.Gasto),
                CreatedAt = DateTime.UtcNow,
            });
            created++;
        }

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new GastoImportResultDto(created, suppliersCreated, errors));
    }

    private static GastoCategory MapCategory(string raw) =>
        Enum.TryParse<GastoCategory>(raw.Trim(), ignoreCase: true, out var category) ? category : GastoCategory.Otro;

    private static PaymentMethod MapPaymentMethod(string? raw)
    {
        var value = (raw ?? "").Trim();
        if (value.Contains("Transfer", StringComparison.OrdinalIgnoreCase) || value.Contains("Banco", StringComparison.OrdinalIgnoreCase))
            return PaymentMethod.Transfer;
        if (value.Contains("Efectivo", StringComparison.OrdinalIgnoreCase) || value.Contains("Cash", StringComparison.OrdinalIgnoreCase))
            return PaymentMethod.Cash;
        return PaymentMethod.Other;
    }

    [HttpPost]
    public async Task<ActionResult<GastoDto>> Create(GastoUpsertDto input)
    {
        var error = await ValidateInput(input);
        if (error is not null) return BadRequest(new { error });

        var gasto = new Gasto
        {
            Date = DateTime.SpecifyKind(input.Date, DateTimeKind.Utc),
            Category = input.Category,
            Description = input.Description.Trim(),
            Amount = input.Amount,
            PaymentMethod = input.PaymentMethod,
            SupplierId = input.SupplierId,
            Number = await _numbering.NextNumberAsync(DocumentType.Gasto),
            CreatedAt = DateTime.UtcNow,
        };

        _db.Gastos.Add(gasto);
        await _db.SaveChangesAsync();

        return Ok(await ReloadDto(gasto.Id));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<GastoDto>> Update(int id, GastoUpsertDto input)
    {
        var gasto = await _db.Gastos.FindAsync(id);
        if (gasto is null) return NotFound();

        var error = await ValidateInput(input);
        if (error is not null) return BadRequest(new { error });

        gasto.Date = DateTime.SpecifyKind(input.Date, DateTimeKind.Utc);
        gasto.Category = input.Category;
        gasto.Description = input.Description.Trim();
        gasto.Amount = input.Amount;
        gasto.PaymentMethod = input.PaymentMethod;
        gasto.SupplierId = input.SupplierId;

        await _db.SaveChangesAsync();

        return Ok(await ReloadDto(id));
    }

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] GastoCategory? category = null,
        [FromQuery] int? supplierId = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query = _db.Gastos.Include(g => g.Supplier).AsNoTracking().AsQueryable();

        if (category is not null) query = query.Where(g => g.Category == category);
        if (supplierId is not null) query = query.Where(g => g.SupplierId == supplierId);
        if (from is not null) query = query.Where(g => g.Date >= DateTime.SpecifyKind(from.Value, DateTimeKind.Utc));
        if (to is not null) query = query.Where(g => g.Date <= DateTime.SpecifyKind(to.Value, DateTimeKind.Utc));

        query = query.OrderByDescending(g => g.Date);

        if (page is not null)
        {
            var paged = await Paging.ApplyAsync(query, page.Value, pageSize);
            return Ok(new PagedResult<GastoDto>(paged.Items.Select(ToDto).ToList(), paged.Total, paged.Page, paged.PageSize));
        }

        var gastos = await query.ToListAsync();
        return Ok(gastos.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GastoDto>> GetById(int id)
    {
        var gasto = await _db.Gastos.Include(g => g.Supplier).AsNoTracking().FirstOrDefaultAsync(g => g.Id == id);
        if (gasto is null) return NotFound();
        return Ok(ToDto(gasto));
    }

    // A diferencia de Compras/Ventas/Presupuestos, un Gasto no tiene ninguna FK que lo
    // referencie — no hay riesgo de integridad que preservar, así que la baja es un
    // borrado real, no una transición de estado.
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var gasto = await _db.Gastos.FindAsync(id);
        if (gasto is null) return NotFound();

        _db.Gastos.Remove(gasto);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string?> ValidateInput(GastoUpsertDto input)
    {
        if (string.IsNullOrWhiteSpace(input.Description))
            return "La descripción es obligatoria";

        if (input.Description.Length > 300)
            return "La descripción no puede superar los 300 caracteres";

        if (input.Amount <= 0)
            return "El monto debe ser mayor a cero";

        if (input.SupplierId is not null && !await _db.Suppliers.AnyAsync(s => s.Id == input.SupplierId))
            return "El proveedor indicado no existe";

        return null;
    }

    private async Task<GastoDto> ReloadDto(int id)
    {
        var gasto = await _db.Gastos.Include(g => g.Supplier).AsNoTracking().FirstAsync(g => g.Id == id);
        return ToDto(gasto);
    }

    private static GastoDto ToDto(Gasto g) => new(
        g.Id, g.Number, g.Date, g.Category, g.Description, g.Amount,
        g.PaymentMethod, g.SupplierId, g.Supplier?.CompanyOrFullName, g.CreatedAt);
}
