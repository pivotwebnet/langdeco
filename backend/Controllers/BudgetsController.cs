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
        budget.Subtotal = totals.Subtotal;
        budget.DiscountAmount = totals.DiscountAmount;
        budget.TaxAmount = totals.TaxAmount;
        budget.Total = totals.Total;

        await _db.SaveChangesAsync();

        return Ok(ToDto(budget));
    }

    [HttpGet]
    public async Task<ActionResult<List<BudgetDto>>> GetAll(
        [FromQuery] BudgetStatus? status = null,
        [FromQuery] ClientType? clientType = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var query = _db.Budgets.Include(b => b.Items).AsQueryable();

        if (clientType is not null) query = query.Where(b => b.ClientType == clientType);
        if (from is not null) query = query.Where(b => b.CreatedAt >= from);
        if (to is not null) query = query.Where(b => b.CreatedAt <= to);

        var budgets = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();
        await _lifecycle.ExpireIfNeededAsync(budgets);

        var result = status is not null ? budgets.Where(b => b.Status == status) : budgets;
        return Ok(result.Select(ToDto));
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

        budget.Status = BudgetStatus.Converted;
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

        var netExempt = budget.TaxRatePercent == 0 ? budget.Subtotal - budget.DiscountAmount : 0;
        var receipt = new Dtos.ReceiptData(
            "PRESUPUESTO", budget.Number, budget.CreatedAt, budget.ValidUntil,
            budget.Customer.Name, budget.Customer.TaxId, budget.Customer.Address, budget.Customer.Contact,
            budget.Items.Select(i => new Dtos.ReceiptItemData(
                i.ProductId, i.ProductName, i.Quantity, i.UnitPrice, 0,
                i.Quantity * i.UnitPrice, budget.TaxRatePercent,
                i.Quantity * i.UnitPrice * (1 + budget.TaxRatePercent / 100m))).ToList(),
            budget.Subtotal, budget.DiscountPercent, budget.DiscountAmount,
            budget.TaxRatePercent, budget.TaxAmount, netExempt, budget.Total);

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

        foreach (var itemInput in inputs)
        {
            if (itemInput.Quantity <= 0)
                throw new ItemValidationException("La cantidad debe ser mayor a 0");

            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == itemInput.ProductId && p.Active);
            if (product is null)
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
