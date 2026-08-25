using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/budgets")]
[RequireAdminKey]
public class BudgetsController : ControllerBase
{
    private static readonly Dictionary<BudgetStatus, BudgetStatus[]> ValidTransitions = new()
    {
        [BudgetStatus.Open] = new[] { BudgetStatus.Converted, BudgetStatus.Expired, BudgetStatus.Cancelled },
        [BudgetStatus.Converted] = Array.Empty<BudgetStatus>(),
        [BudgetStatus.Expired] = Array.Empty<BudgetStatus>(),
        [BudgetStatus.Cancelled] = Array.Empty<BudgetStatus>(),
    };

    private readonly AppDbContext _db;
    private readonly DocumentNumberingService _numbering;
    private readonly ReceiptPdfService _pdf;
    private readonly StockService _stock;
    private readonly BudgetLifecycleService _lifecycle;

    public BudgetsController(
        AppDbContext db, DocumentNumberingService numbering, ReceiptPdfService pdf,
        StockService stock, BudgetLifecycleService lifecycle)
    {
        _db = db;
        _numbering = numbering;
        _pdf = pdf;
        _stock = stock;
        _lifecycle = lifecycle;
    }

    [HttpPost]
    public async Task<ActionResult<BudgetDto>> Create(BudgetCreateDto input)
    {
        if (input.Items is null || input.Items.Count == 0)
            return BadRequest(new { error = "El presupuesto debe tener al menos un producto" });

        if (string.IsNullOrWhiteSpace(input.Customer?.Name))
            return BadRequest(new { error = "El nombre del cliente es obligatorio" });

        if (input.ClientId is not null && !await _db.Clients.AnyAsync(c => c.Id == input.ClientId))
            return BadRequest(new { error = "El cliente indicado no existe" });

        await using var tx = await _db.Database.BeginTransactionAsync();

        var budget = new Budget
        {
            ClientId = input.ClientId,
            Customer = new CustomerInfo
            {
                Name = input.Customer.Name,
                Contact = input.Customer.Contact,
                TaxId = input.Customer.TaxId,
                Address = input.Customer.Address,
            },
            ClientType = input.ClientType,
            Status = BudgetStatus.Open,
            ValidUntil = input.ValidUntil,
            DiscountType = input.DiscountType,
            DiscountPercent = input.DiscountPercent,
            DiscountFixedAmount = input.DiscountFixedAmount,
            TaxRatePercent = input.TaxRatePercent,
            CreatedAt = DateTime.UtcNow,
        };

        decimal subtotal;
        try
        {
            subtotal = await BuildItemsAsync(budget.Items, input.Items);
        }
        catch (PricingException ex)
        {
            return BadRequest(new { error = ex.Message });
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

        budget.Subtotal = totals.Subtotal;
        budget.DiscountAmount = totals.DiscountAmount;
        budget.TaxAmount = totals.TaxAmount;
        budget.Total = totals.Total;
        budget.Number = await _numbering.NextNumberAsync(DocumentType.Budget);

        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDto(budget));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BudgetDto>> Update(int id, BudgetUpdateDto input)
    {
        if (input.Items is null || input.Items.Count == 0)
            return BadRequest(new { error = "El presupuesto debe tener al menos un producto" });

        if (string.IsNullOrWhiteSpace(input.Customer?.Name))
            return BadRequest(new { error = "El nombre del cliente es obligatorio" });

        if (input.ClientId is not null && !await _db.Clients.AnyAsync(c => c.Id == input.ClientId))
            return BadRequest(new { error = "El cliente indicado no existe" });

        var budget = await _db.Budgets.Include(b => b.Items).FirstOrDefaultAsync(b => b.Id == id);
        if (budget is null) return NotFound();

        await _lifecycle.ExpireIfNeededAsync(budget);

        if (budget.Status != BudgetStatus.Open)
            return BadRequest(new { error = "Solo se pueden editar presupuestos abiertos" });

        budget.Items.Clear();

        decimal subtotal;
        try
        {
            subtotal = await BuildItemsAsync(budget.Items, input.Items);
        }
        catch (PricingException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ItemValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        budget.ClientId = input.ClientId;
        budget.Customer = new CustomerInfo
        {
            Name = input.Customer.Name,
            Contact = input.Customer.Contact,
            TaxId = input.Customer.TaxId,
            Address = input.Customer.Address,
        };
        budget.ValidUntil = input.ValidUntil;
        budget.DiscountType = input.DiscountType;
        budget.DiscountPercent = input.DiscountPercent;
        budget.DiscountFixedAmount = input.DiscountFixedAmount;
        budget.TaxRatePercent = input.TaxRatePercent;

        var totals = DocumentTotalsCalculator.Compute(
            subtotal, input.DiscountType, input.DiscountPercent, input.DiscountFixedAmount, input.TaxRatePercent);

        var validationError = DocumentTotalsCalculator.Validate(input.DiscountType, input.DiscountPercent, input.TaxRatePercent, totals);
        if (validationError is not null)
            return BadRequest(new { error = validationError });

        budget.Subtotal = totals.Subtotal;
        budget.DiscountAmount = totals.DiscountAmount;
        budget.TaxAmount = totals.TaxAmount;
        budget.Total = totals.Total;

        await _db.SaveChangesAsync();

        return Ok(ToDto(budget));
    }

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] BudgetStatus? status = null,
        [FromQuery] ClientType? clientType = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query = _db.Budgets.Include(b => b.Items).AsQueryable();

        if (clientType is not null) query = query.Where(b => b.ClientType == clientType);
        if (from is not null) query = query.Where(b => b.CreatedAt >= DateTime.SpecifyKind(from.Value, DateTimeKind.Utc));
        if (to is not null) query = query.Where(b => b.CreatedAt <= DateTime.SpecifyKind(to.Value, DateTimeKind.Utc));

        var budgets = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();
        await _lifecycle.ExpireIfNeededAsync(budgets);

        // El filtro de status va después de ExpireIfNeededAsync porque puede cambiar el status
        // (Open -> Expired) — por eso la paginación acá es en memoria, no via Skip/Take en SQL.
        var filtered = (status is not null ? budgets.Where(b => b.Status == status) : budgets).ToList();

        if (page is not null)
        {
            var size = Math.Clamp(pageSize ?? Paging.DefaultPageSize, 1, Paging.MaxPageSize);
            var pageNum = Math.Max(page.Value, 1);
            var pageItems = filtered.Skip((pageNum - 1) * size).Take(size).Select(ToDto).ToList();
            return Ok(new PagedResult<BudgetDto>(pageItems, filtered.Count, pageNum, size));
        }

        return Ok(filtered.Select(ToDto));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<BudgetsSummaryDto>> Summary()
    {
        var budgets = await _db.Budgets.ToListAsync();
        await _lifecycle.ExpireIfNeededAsync(budgets);

        var openBudgets = budgets.Where(b => b.Status == BudgetStatus.Open).ToList();
        var convertedCount = budgets.Count(b => b.Status == BudgetStatus.Converted);
        var expiredCount = budgets.Count(b => b.Status == BudgetStatus.Expired);
        var cancelledCount = budgets.Count(b => b.Status == BudgetStatus.Cancelled);
        var decidedCount = convertedCount + expiredCount + cancelledCount;
        var conversionRate = decidedCount > 0 ? (int)Math.Round(convertedCount * 100m / decidedCount) : 0;

        var soonThreshold = DateTime.UtcNow.AddDays(7);
        var expiringSoonAll = openBudgets
            .Where(b => b.ValidUntil is not null && b.ValidUntil <= soonThreshold)
            .OrderBy(b => b.ValidUntil)
            .ToList();
        var expiringSoon = expiringSoonAll
            .Take(10)
            .Select(b => new ExpiringBudgetDto(b.Id, b.Number, b.Customer.Name, b.ValidUntil!.Value, b.Total))
            .ToList();

        return Ok(new BudgetsSummaryDto(openBudgets.Count, expiringSoonAll.Count, convertedCount, conversionRate, expiringSoon));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BudgetDto>> GetById(int id)
    {
        var budget = await _db.Budgets.Include(b => b.Items).FirstOrDefaultAsync(b => b.Id == id);
        if (budget is null) return NotFound();

        await _lifecycle.ExpireIfNeededAsync(budget);

        return Ok(ToDto(budget));
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<BudgetDto>> UpdateStatus(int id, BudgetStatusUpdateDto input)
    {
        var budget = await _db.Budgets.Include(b => b.Items).FirstOrDefaultAsync(b => b.Id == id);
        if (budget is null) return NotFound();

        await _lifecycle.ExpireIfNeededAsync(budget);

        if (!ValidTransitions[budget.Status].Contains(input.Status))
            return BadRequest(new { error = $"Transición inválida de {budget.Status} a {input.Status}" });

        budget.Status = input.Status;
        await _db.SaveChangesAsync();

        return Ok(ToDto(budget));
    }

    [HttpPost("{id}/convert")]
    public async Task<ActionResult<SaleDto>> Convert(int id, BudgetConvertDto input)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();

        var budget = await _db.Budgets.Include(b => b.Items).FirstOrDefaultAsync(b => b.Id == id);
        if (budget is null) return NotFound();

        await _lifecycle.ExpireIfNeededAsync(budget);

        if (budget.Status != BudgetStatus.Open)
            return BadRequest(new { error = "Solo se pueden convertir presupuestos abiertos" });

        // Transición atómica guardada por estado: si otra request ya convirtió (o canceló) este
        // mismo presupuesto entre el SELECT de arriba y este UPDATE, acá da 0 filas y frenamos
        // antes de decrementar stock o crear una segunda venta para el mismo presupuesto.
        var claimedRows = await _db.Budgets
            .Where(b => b.Id == id && b.Status == BudgetStatus.Open)
            .ExecuteUpdateAsync(b => b.SetProperty(x => x.Status, BudgetStatus.Converted));

        if (claimedRows == 0)
        {
            await tx.RollbackAsync();
            return Conflict(new { error = "El presupuesto ya fue convertido o modificado por otra operación. Recargá e intentá de nuevo." });
        }

        budget.Status = BudgetStatus.Converted;

        var sale = new Sale
        {
            ClientId = budget.ClientId,
            Customer = new CustomerInfo
            {
                Name = budget.Customer.Name,
                Contact = budget.Customer.Contact,
                TaxId = budget.Customer.TaxId,
                Address = budget.Customer.Address,
            },
            ClientType = budget.ClientType,
            PaymentMethod = input.PaymentMethod,
            Status = SaleStatus.Pending,
            DiscountType = budget.DiscountType,
            DiscountPercent = budget.DiscountPercent,
            DiscountFixedAmount = budget.DiscountFixedAmount,
            TaxRatePercent = budget.TaxRatePercent,
            BudgetId = budget.Id,
            CreatedAt = DateTime.UtcNow,
        };

        foreach (var item in budget.Items)
        {
            var decremented = await _stock.TryDecrementAsync(item.ProductId, item.Quantity);
            if (!decremented)
            {
                await tx.RollbackAsync();
                return BadRequest(new { error = $"Stock insuficiente para '{item.ProductName}'" });
            }

            sale.Items.Add(new SaleItem
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                PriceType = item.PriceType,
            });
        }

        var totals = DocumentTotalsCalculator.Compute(
            budget.Subtotal, budget.DiscountType, budget.DiscountPercent, budget.DiscountFixedAmount, budget.TaxRatePercent);
        sale.Subtotal = totals.Subtotal;
        sale.DiscountAmount = totals.DiscountAmount;
        sale.TaxAmount = totals.TaxAmount;
        sale.Total = totals.Total;
        sale.Number = await _numbering.NextNumberAsync(DocumentType.Sale);

        _db.Sales.Add(sale);

        budget.ConvertedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        budget.ConvertedSaleId = sale.Id;
        await _db.SaveChangesAsync();

        await tx.CommitAsync();

        return Ok(SalesController.ToDto(sale));
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetPdf(int id)
    {
        var budget = await _db.Budgets.Include(b => b.Items).AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
        if (budget is null) return NotFound();

        var company = await _db.CompanySettings.AsNoTracking().FirstOrDefaultAsync() ?? new CompanySettings();

        var netAmount = budget.Subtotal - budget.DiscountAmount;
        var receipt = new Dtos.ReceiptData(
            "PRESUPUESTO", budget.Number, budget.CreatedAt, budget.ValidUntil,
            budget.Customer.Name, budget.Customer.TaxId, budget.Customer.Address, budget.Customer.Contact,
            budget.Items.Select(i => new Dtos.ReceiptItemData(
                i.ProductId, i.ProductName, i.Quantity, i.UnitPrice, 0,
                i.Quantity * i.UnitPrice, budget.TaxRatePercent,
                i.Quantity * i.UnitPrice * (1 + budget.TaxRatePercent / 100m))).ToList(),
            budget.Subtotal, budget.DiscountPercent, budget.DiscountAmount,
            budget.TaxRatePercent, budget.TaxAmount, netAmount, budget.Total);

        var bytes = _pdf.Generate(receipt, company);
        return File(bytes, "application/pdf", $"presupuesto-{budget.Number}.pdf");
    }

    /// <summary>
    /// Crea los BudgetItem a partir del input, resolviendo el precio unitario según PriceType
    /// (Retail = Product.Price, Wholesale = Product.WholesalePrice, 400 si no existe).
    /// </summary>
    private async Task<decimal> BuildItemsAsync(List<BudgetItem> items, List<BudgetItemInput> inputs)
    {
        decimal subtotal = 0;

        var productIds = inputs.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products.Where(p => productIds.Contains(p.Id) && p.Active).ToDictionaryAsync(p => p.Id);

        foreach (var itemInput in inputs)
        {
            if (itemInput.Quantity <= 0)
                throw new ItemValidationException("La cantidad debe ser mayor a 0");

            if (!products.TryGetValue(itemInput.ProductId, out var product))
                throw new ItemValidationException($"Producto '{itemInput.ProductId}' no existe o está inactivo");

            var unitPrice = PricingService.ResolveUnitPrice(product, itemInput.PriceType);
            subtotal += unitPrice * itemInput.Quantity;

            items.Add(new BudgetItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = itemInput.Quantity,
                UnitPrice = unitPrice,
                PriceType = itemInput.PriceType,
            });
        }

        return subtotal;
    }

    private static BudgetDto ToDto(Budget b) => new(
        b.Id, b.Number, b.ClientId,
        new CustomerDto(b.Customer.Name, b.Customer.Contact, b.Customer.TaxId, b.Customer.Address),
        b.ClientType, b.Status, b.ValidUntil,
        b.Subtotal, b.DiscountType, b.DiscountPercent, b.DiscountFixedAmount, b.DiscountAmount,
        b.TaxRatePercent, b.TaxAmount, b.Total,
        b.CreatedAt, b.ConvertedSaleId, b.ConvertedAt,
        b.Items.Select(i => new BudgetItemDto(i.ProductId, i.ProductName, i.Quantity, i.UnitPrice, i.PriceType)).ToList());
}

internal class ItemValidationException : Exception
{
    public ItemValidationException(string message) : base(message) { }
}
