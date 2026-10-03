using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/compras")]
[RequireAdminKey]
public class ComprasController : ControllerBase
{
    private static readonly Dictionary<CompraStatus, CompraStatus[]> ValidTransitions = new()
    {
        [CompraStatus.Pending] = new[] { CompraStatus.Received, CompraStatus.Cancelled },
        [CompraStatus.Received] = new[] { CompraStatus.Cancelled },
        [CompraStatus.Cancelled] = Array.Empty<CompraStatus>(),
    };

    private readonly AppDbContext _db;
    private readonly DocumentNumberingService _numbering;
    private readonly ReceiptPdfService _pdf;
    private readonly StockService _stock;
    private readonly CompraExcelService _excel;

    public ComprasController(
        AppDbContext db, DocumentNumberingService numbering, ReceiptPdfService pdf, StockService stock,
        CompraExcelService excel)
    {
        _db = db;
        _numbering = numbering;
        _pdf = pdf;
        _stock = stock;
        _excel = excel;
    }

    // Mismo patrón que ProductsController.Import: columnas fijas (ver CompraExcelService), se cae
    // a la primera hoja sea cual sea su nombre, crea Proveedor si no existe por nombre (igual que
    // el import de productos) y Producto si no existe por nombre (igual que SalesController.Import,
    // inactivo y con nota para que el admin lo revise), todo en una única transacción. A diferencia
    // de Create(), NO aplica efectos de stock/costo aunque la fila venga marcada "Recibida": son
    // compras históricas que se cargan para llevar registro, y el stock actual del producto ya es
    // el real — aplicarlos de nuevo lo duplicaría (mismo criterio que SalesController.Import con
    // ventas históricas).
    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<CompraImportResultDto>> Import(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Archivo vacío" });

        if (!await _db.Categories.AnyAsync(c => c.Id == ProductsController.PendingCategoryId))
            return BadRequest(new { error = "Falta la categoría 'Sin categoría' — faltan aplicar migraciones" });

        List<CompraImportRow> rows;
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
            rows.Select(r => ((string?)null, r.SupplierName)));

        var existingProductIds = (await _db.Products.Select(p => p.Id).ToListAsync()).ToHashSet();
        var productNameLookup = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var p in await _db.Products.Select(p => new { p.Id, p.Name }).ToListAsync())
            productNameLookup.TryAdd(p.Name.Trim(), p.Id);

        var errors = new List<ImportRowError>();
        var created = 0;
        var suppliersCreated = 0;
        var productsCreated = 0;

        await using var tx = await _db.Database.BeginTransactionAsync();

        foreach (var row in rows)
        {
            if (row.Quantity <= 0)
            {
                errors.Add(new ImportRowError(row.RowNumber, "La cantidad debe ser mayor a 0"));
                continue;
            }

            if (row.UnitCost <= 0)
            {
                errors.Add(new ImportRowError(row.RowNumber, "El costo unitario debe ser mayor a 0"));
                continue;
            }

            var supplier = supplierLookup.Find(null, row.SupplierName);
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

            if (!productNameLookup.TryGetValue(row.ProductName, out var productId))
            {
                var slug = Validation.Slugify(row.ProductName);
                var candidate = slug;
                var suffix = 2;
                while (!existingProductIds.Add(candidate))
                    candidate = $"{slug}-{suffix++}";

                _db.Products.Add(new Product
                {
                    Id = candidate,
                    Name = row.ProductName,
                    CategoryId = ProductsController.PendingCategoryId,
                    Price = 1m,
                    Stock = 0,
                    Active = false,
                    Note = "Creado automáticamente al importar compras — revisar precio, categoría y stock",
                });
                productNameLookup[row.ProductName] = candidate;
                productId = candidate;
                productsCreated++;
            }

            var status = MapStatus(row.StatusRaw);
            var subtotal = row.Quantity * row.UnitCost;

            _db.Compras.Add(new Compra
            {
                // Navegación en vez de SupplierId directo: un proveedor recién creado en esta
                // misma importación todavía no tiene Id asignado (identity de la base) hasta el
                // SaveChangesAsync de más abajo — asignar el Id a mano acá insertaría 0 y violaría
                // la FK. Mismo criterio que ProductsController.Import con Product.Supplier.
                Supplier = supplier,
                SupplierName = supplier.CompanyOrFullName,
                PaymentMethod = MapPaymentMethod(row.PaymentMethodRaw),
                Status = status,
                Note = row.Note,
                DiscountType = DiscountType.Fixed,
                DiscountPercent = 0,
                DiscountFixedAmount = 0,
                DiscountAmount = 0,
                TaxRatePercent = 0,
                TaxAmount = 0,
                Subtotal = subtotal,
                Total = subtotal,
                Number = await _numbering.NextNumberAsync(DocumentType.Compra),
                CreatedAt = DateTime.SpecifyKind(row.Date, DateTimeKind.Utc),
                ReceivedAt = status == CompraStatus.Received ? DateTime.SpecifyKind(row.Date, DateTimeKind.Utc) : null,
                Items = new List<CompraItem>
                {
                    new() { ProductId = productId, ProductName = row.ProductName, Quantity = row.Quantity, UnitCost = row.UnitCost },
                },
            });
            created++;
        }

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new CompraImportResultDto(created, suppliersCreated, productsCreated, errors));
    }

    private static CompraStatus MapStatus(string? raw)
    {
        var value = (raw ?? "").Trim();
        if (value.Contains("Recib", StringComparison.OrdinalIgnoreCase)) return CompraStatus.Received;
        if (value.Contains("Cancel", StringComparison.OrdinalIgnoreCase)) return CompraStatus.Cancelled;
        return CompraStatus.Pending;
    }

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
    public async Task<ActionResult<CompraDto>> Create(CompraCreateDto input)
    {
        if (input.Items is null || input.Items.Count == 0)
            return BadRequest(new { error = "La compra debe tener al menos un producto" });

        var supplier = await _db.Suppliers.FirstOrDefaultAsync(s => s.Id == input.SupplierId);
        if (supplier is null || !supplier.Active)
            return BadRequest(new { error = "El proveedor indicado no existe o está inactivo" });

        var status = input.Status ?? CompraStatus.Pending;
        if (status != CompraStatus.Pending && status != CompraStatus.Received)
            return BadRequest(new { error = "El estado inicial solo puede ser pending o received" });

        await using var tx = await _db.Database.BeginTransactionAsync();

        var compra = new Compra
        {
            SupplierId = supplier.Id,
            SupplierName = supplier.CompanyOrFullName,
            PaymentMethod = input.PaymentMethod,
            Status = status,
            Note = input.Note,
            DiscountType = input.DiscountType,
            DiscountPercent = input.DiscountPercent,
            DiscountFixedAmount = input.DiscountFixedAmount,
            TaxRatePercent = input.TaxRatePercent,
            CreatedAt = DateTime.UtcNow,
        };

        decimal subtotal;
        try
        {
            subtotal = await BuildItemsAsync(compra.Items, input.Items);
        }
        catch (ItemValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        var totals = DocumentTotalsCalculator.Compute(
            subtotal, input.DiscountType, input.DiscountPercent, input.DiscountFixedAmount, input.TaxRatePercent);

        var validationError = DocumentTotalsCalculator.Validate(input.DiscountType, input.DiscountPercent, input.TaxRatePercent, totals);
        if (validationError is not null)
        {
            await tx.RollbackAsync();
            return BadRequest(new { error = validationError });
        }

        compra.Subtotal = totals.Subtotal;
        compra.DiscountAmount = totals.DiscountAmount;
        compra.TaxAmount = totals.TaxAmount;
        compra.Total = totals.Total;
        compra.Number = await _numbering.NextNumberAsync(DocumentType.Compra);

        _db.Compras.Add(compra);
        await _db.SaveChangesAsync();

        if (status == CompraStatus.Received)
            await ApplyReceivedEffectsAsync(compra);

        await tx.CommitAsync();

        return Ok(ToDto(compra));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CompraDto>> Update(int id, CompraUpdateDto input)
    {
        if (input.Items is null || input.Items.Count == 0)
            return BadRequest(new { error = "La compra debe tener al menos un producto" });

        var compra = await _db.Compras.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id);
        if (compra is null) return NotFound();

        if (compra.Status != CompraStatus.Pending)
            return BadRequest(new { error = "Solo se pueden editar compras pendientes" });

        var supplier = await _db.Suppliers.FirstOrDefaultAsync(s => s.Id == input.SupplierId);
        if (supplier is null || !supplier.Active)
            return BadRequest(new { error = "El proveedor indicado no existe o está inactivo" });

        await using var tx = await _db.Database.BeginTransactionAsync();

        _db.CompraItems.RemoveRange(compra.Items);
        compra.Items.Clear();

        decimal subtotal;
        try
        {
            subtotal = await BuildItemsAsync(compra.Items, input.Items);
        }
        catch (ItemValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        compra.SupplierId = supplier.Id;
        compra.SupplierName = supplier.CompanyOrFullName;
        compra.PaymentMethod = input.PaymentMethod;
        compra.Note = input.Note;
        compra.DiscountType = input.DiscountType;
        compra.DiscountPercent = input.DiscountPercent;
        compra.DiscountFixedAmount = input.DiscountFixedAmount;
        compra.TaxRatePercent = input.TaxRatePercent;

        var totals = DocumentTotalsCalculator.Compute(
            subtotal, input.DiscountType, input.DiscountPercent, input.DiscountFixedAmount, input.TaxRatePercent);

        var validationError = DocumentTotalsCalculator.Validate(input.DiscountType, input.DiscountPercent, input.TaxRatePercent, totals);
        if (validationError is not null)
        {
            await tx.RollbackAsync();
            return BadRequest(new { error = validationError });
        }

        compra.Subtotal = totals.Subtotal;
        compra.DiscountAmount = totals.DiscountAmount;
        compra.TaxAmount = totals.TaxAmount;
        compra.Total = totals.Total;

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDto(compra));
    }

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] CompraStatus? status = null,
        [FromQuery] int? supplierId = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query = _db.Compras.Include(c => c.Items).AsNoTracking().AsQueryable();

        if (status is not null) query = query.Where(c => c.Status == status);
        if (supplierId is not null) query = query.Where(c => c.SupplierId == supplierId);
        if (from is not null) query = query.Where(c => c.CreatedAt >= DateTime.SpecifyKind(from.Value, DateTimeKind.Utc));
        if (to is not null) query = query.Where(c => c.CreatedAt <= DateTime.SpecifyKind(to.Value, DateTimeKind.Utc));

        query = query.OrderByDescending(c => c.CreatedAt);

        if (page is not null)
        {
            var paged = await Paging.ApplyAsync(query, page.Value, pageSize);
            return Ok(new PagedResult<CompraDto>(paged.Items.Select(ToDto).ToList(), paged.Total, paged.Page, paged.PageSize));
        }

        var compras = await query.ToListAsync();
        return Ok(compras.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CompraDto>> GetById(int id)
    {
        var compra = await _db.Compras.Include(c => c.Items).AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        if (compra is null) return NotFound();
        return Ok(ToDto(compra));
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<CompraDto>> UpdateStatus(int id, CompraStatusUpdateDto input)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();

        var compra = await _db.Compras.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id);
        if (compra is null) return NotFound();

        if (!ValidTransitions[compra.Status].Contains(input.Status))
            return BadRequest(new { error = $"Transición inválida de {compra.Status} a {input.Status}" });

        var wasReceived = compra.Status == CompraStatus.Received;

        // Transición atómica guardada por el estado leído recién — mismo patrón que
        // SalesController.UpdateStatus: si otra request ya cambió el estado entre el SELECT
        // de arriba y este UPDATE, acá da 0 filas y evitamos aplicar los efectos dos veces.
        var updatedRows = await _db.Compras
            .Where(c => c.Id == id && c.Status == compra.Status)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, input.Status));

        if (updatedRows == 0)
        {
            await tx.RollbackAsync();
            return Conflict(new { error = "La compra ya fue actualizada por otra operación. Recargá e intentá de nuevo." });
        }

        compra.Status = input.Status;

        if (input.Status == CompraStatus.Received)
        {
            await ApplyReceivedEffectsAsync(compra);
        }
        else if (input.Status == CompraStatus.Cancelled && wasReceived)
        {
            // Revertir stock de una compra ya recibida — si algún producto ya no tiene
            // stock suficiente (se vendió después), se aborta toda la cancelación en vez
            // de dejar stock negativo. El costo NO se revierte: es ambiguo si hubo
            // compras posteriores que ya lo pisaron.
            foreach (var item in compra.Items)
            {
                var reverted = await _stock.TryDecrementAsync(item.ProductId, item.Quantity);
                if (!reverted)
                {
                    await tx.RollbackAsync();
                    return BadRequest(new { error = $"No se puede cancelar: el stock de '{item.ProductName}' ya se movió y no alcanza para revertir la recepción. Ajustá el stock manualmente antes de cancelar." });
                }
            }
        }

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDto(compra));
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetPdf(int id)
    {
        var compra = await _db.Compras.Include(c => c.Items).AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        if (compra is null) return NotFound();

        var company = await _db.CompanySettings.AsNoTracking().FirstOrDefaultAsync() ?? new CompanySettings();

        var netAmount = compra.Subtotal - compra.DiscountAmount;
        var receipt = new ReceiptData(
            "COMPRA", compra.Number, compra.CreatedAt, null,
            compra.SupplierName, null, null, null,
            compra.Items.Select(i => new ReceiptItemData(
                i.ProductId, i.ProductName, i.Quantity, i.UnitCost, 0,
                i.Quantity * i.UnitCost, compra.TaxRatePercent,
                i.Quantity * i.UnitCost * (1 + compra.TaxRatePercent / 100m))).ToList(),
            compra.Subtotal, compra.DiscountPercent, compra.DiscountAmount,
            compra.TaxRatePercent, compra.TaxAmount, netAmount, compra.Total,
            new List<ReceiptPaymentData>(), 0m);

        var bytes = _pdf.Generate(receipt, company);
        return File(bytes, "application/pdf", $"compra-{compra.Number}.pdf");
    }

    // Efectos de marcar una compra como recibida: entra stock real y se actualiza el costo
    // del producto (deja de ser puramente informativo, ver comentario en Product.cs). Si hay
    // varias líneas o compras sucesivas del mismo producto, CostPrice queda con el último
    // costo aplicado — no se promedia.
    private async Task ApplyReceivedEffectsAsync(Compra compra)
    {
        foreach (var item in compra.Items)
        {
            await _stock.IncrementAsync(item.ProductId, item.Quantity);
            await _db.Products.Where(p => p.Id == item.ProductId)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.CostPrice, item.UnitCost));
        }
        compra.ReceivedAt = DateTime.UtcNow;
    }

    private async Task<decimal> BuildItemsAsync(List<CompraItem> items, List<CompraItemInput> inputs)
    {
        decimal subtotal = 0;

        var productIds = inputs.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        foreach (var itemInput in inputs)
        {
            if (itemInput.Quantity <= 0)
                throw new ItemValidationException("La cantidad debe ser mayor a 0");

            if (itemInput.UnitCost <= 0)
                throw new ItemValidationException("El costo unitario debe ser mayor a 0");

            if (!products.TryGetValue(itemInput.ProductId, out var product))
                throw new ItemValidationException($"Producto '{itemInput.ProductId}' no existe");

            subtotal += itemInput.UnitCost * itemInput.Quantity;

            items.Add(new CompraItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = itemInput.Quantity,
                UnitCost = itemInput.UnitCost,
            });
        }

        return subtotal;
    }

    private static CompraDto ToDto(Compra c) => new(
        c.Id, c.Number, c.SupplierId, c.SupplierName, c.Status, c.PaymentMethod,
        c.Subtotal, c.DiscountType, c.DiscountPercent, c.DiscountFixedAmount, c.DiscountAmount,
        c.TaxRatePercent, c.TaxAmount, c.Total, c.Note,
        c.CreatedAt, c.ReceivedAt,
        c.Items.Select(i => new CompraItemDto(i.ProductId, i.ProductName, i.Quantity, i.UnitCost)).ToList());
}
