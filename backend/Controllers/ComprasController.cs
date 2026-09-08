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

    public ComprasController(AppDbContext db, DocumentNumberingService numbering, ReceiptPdfService pdf, StockService stock)
    {
        _db = db;
        _numbering = numbering;
        _pdf = pdf;
        _stock = stock;
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
            compra.TaxRatePercent, compra.TaxAmount, netAmount, compra.Total);

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
