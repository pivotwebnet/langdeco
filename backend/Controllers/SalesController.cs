using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/sales")]
[RequireAdminKey]
public class SalesController : ControllerBase
{
    private static readonly Dictionary<SaleStatus, SaleStatus[]> ValidTransitions = new()
    {
        [SaleStatus.Pending] = new[] { SaleStatus.Paid, SaleStatus.Cancelled },
        [SaleStatus.Paid] = new[] { SaleStatus.Cancelled },
        [SaleStatus.Cancelled] = Array.Empty<SaleStatus>(),
    };

    private readonly AppDbContext _db;
    private readonly DocumentNumberingService _numbering;
    private readonly ReceiptPdfService _pdf;
    private readonly StockService _stock;
    private readonly BudgetLifecycleService _lifecycle;

    public SalesController(
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
    public async Task<ActionResult<SaleDto>> Create(SaleCreateDto input)
    {
        if (input.Items is null || input.Items.Count == 0)
            return BadRequest(new { error = "La venta debe tener al menos un producto" });

        if (string.IsNullOrWhiteSpace(input.Customer?.Name))
            return BadRequest(new { error = "El nombre del cliente es obligatorio" });

        if (input.ClientId is not null && !await _db.Clients.AnyAsync(c => c.Id == input.ClientId))
            return BadRequest(new { error = "El cliente indicado no existe" });

        var status = input.Status ?? SaleStatus.Pending;
        if (status != SaleStatus.Pending && status != SaleStatus.Paid)
            return BadRequest(new { error = "El estado inicial solo puede ser pending o paid" });

        await using var tx = await _db.Database.BeginTransactionAsync();

        var sale = new Sale
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
            PaymentMethod = input.PaymentMethod,
            Status = status,
            DiscountType = input.DiscountType,
            DiscountPercent = input.DiscountPercent,
            DiscountFixedAmount = input.DiscountFixedAmount,
            TaxRatePercent = input.TaxRatePercent,
            CreatedAt = DateTime.UtcNow,
        };

        decimal subtotal;
        try
        {
            subtotal = await BuildItemsAsync(sale.Items, input.Items);
        }
        catch (PricingException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ItemValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (StockException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        var totals = DocumentTotalsCalculator.Compute(
            subtotal, input.DiscountType, input.DiscountPercent, input.DiscountFixedAmount, input.TaxRatePercent);
        sale.Subtotal = totals.Subtotal;
        sale.DiscountAmount = totals.DiscountAmount;
        sale.TaxAmount = totals.TaxAmount;
        sale.Total = totals.Total;
        sale.Number = await _numbering.NextNumberAsync(DocumentType.Sale);

        _db.Sales.Add(sale);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDto(sale));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SaleDto>> Update(int id, SaleUpdateDto input)
    {
        if (input.Items is null || input.Items.Count == 0)
            return BadRequest(new { error = "La venta debe tener al menos un producto" });

        if (string.IsNullOrWhiteSpace(input.Customer?.Name))
            return BadRequest(new { error = "El nombre del cliente es obligatorio" });

        if (input.ClientId is not null && !await _db.Clients.AnyAsync(c => c.Id == input.ClientId))
            return BadRequest(new { error = "El cliente indicado no existe" });

        await using var tx = await _db.Database.BeginTransactionAsync();

        var sale = await _db.Sales.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == id);
        if (sale is null) return NotFound();

        if (sale.Status != SaleStatus.Pending)
            return BadRequest(new { error = "Solo se pueden editar ventas pendientes" });

        foreach (var oldItem in sale.Items)
            await _stock.IncrementAsync(oldItem.ProductId, oldItem.Quantity);

        sale.Items.Clear();

        decimal subtotal;
        try
        {
            subtotal = await BuildItemsAsync(sale.Items, input.Items);
        }
        catch (PricingException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ItemValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (StockException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        sale.ClientId = input.ClientId;
        sale.Customer = new CustomerInfo
        {
            Name = input.Customer.Name,
            Contact = input.Customer.Contact,
            TaxId = input.Customer.TaxId,
            Address = input.Customer.Address,
        };
        sale.DiscountType = input.DiscountType;
        sale.DiscountPercent = input.DiscountPercent;
        sale.DiscountFixedAmount = input.DiscountFixedAmount;
        sale.TaxRatePercent = input.TaxRatePercent;

        var totals = DocumentTotalsCalculator.Compute(
            subtotal, input.DiscountType, input.DiscountPercent, input.DiscountFixedAmount, input.TaxRatePercent);
        sale.Subtotal = totals.Subtotal;
        sale.DiscountAmount = totals.DiscountAmount;
        sale.TaxAmount = totals.TaxAmount;
        sale.Total = totals.Total;

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDto(sale));
    }

    [HttpGet]
    public async Task<ActionResult<List<SaleDto>>> GetAll(
        [FromQuery] SaleStatus? status = null,
        [FromQuery] ClientType? clientType = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var query = _db.Sales.Include(s => s.Items).AsNoTracking().AsQueryable();

        if (status is not null) query = query.Where(s => s.Status == status);
        if (clientType is not null) query = query.Where(s => s.ClientType == clientType);
        if (from is not null) query = query.Where(s => s.CreatedAt >= from);
        if (to is not null) query = query.Where(s => s.CreatedAt <= to);

        var sales = await query.OrderByDescending(s => s.CreatedAt).ToListAsync();
        return Ok(sales.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SaleDto>> GetById(int id)
    {
        var sale = await _db.Sales.Include(s => s.Items).AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        if (sale is null) return NotFound();
        return Ok(ToDto(sale));
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<SaleDto>> UpdateStatus(int id, SaleStatusUpdateDto input)
    {
        var sale = await _db.Sales.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == id);
        if (sale is null) return NotFound();

        if (!ValidTransitions[sale.Status].Contains(input.Status))
            return BadRequest(new { error = $"Transición inválida de {sale.Status} a {input.Status}" });

        if (input.Status == SaleStatus.Cancelled)
        {
            foreach (var item in sale.Items)
                await _stock.IncrementAsync(item.ProductId, item.Quantity);
        }

        sale.Status = input.Status;
        await _db.SaveChangesAsync();

        if (input.Status == SaleStatus.Cancelled && sale.BudgetId is not null)
            await _lifecycle.ReopenIfConvertedAsync(sale.BudgetId.Value);

        return Ok(ToDto(sale));
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetPdf(int id)
    {
        var sale = await _db.Sales.Include(s => s.Items).AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        if (sale is null) return NotFound();

        var company = await _db.CompanySettings.AsNoTracking().FirstOrDefaultAsync() ?? new CompanySettings();

        var netExempt = sale.TaxRatePercent == 0 ? sale.Subtotal - sale.DiscountAmount : 0;
        var receipt = new Dtos.ReceiptData(
            "VENTA", sale.Number, sale.CreatedAt, null,
            sale.Customer.Name, sale.Customer.TaxId, sale.Customer.Address, sale.Customer.Contact,
            sale.Items.Select(i => new Dtos.ReceiptItemData(
                i.ProductId, i.ProductName, i.Quantity, i.UnitPrice, 0,
                i.Quantity * i.UnitPrice, sale.TaxRatePercent,
                i.Quantity * i.UnitPrice * (1 + sale.TaxRatePercent / 100m))).ToList(),
            sale.Subtotal, sale.DiscountPercent, sale.DiscountAmount,
            sale.TaxRatePercent, sale.TaxAmount, netExempt, sale.Total);

        var bytes = _pdf.Generate(receipt, company);
        return File(bytes, "application/pdf", $"venta-{sale.Number}.pdf");
    }

    [HttpGet("summary")]
    public async Task<ActionResult<SalesSummaryDto>> Summary()
    {
        var paidSales = await _db.Sales
            .Include(s => s.Items)
            .Where(s => s.Status == SaleStatus.Paid)
            .AsNoTracking()
            .ToListAsync();

        var revenue = paidSales.Sum(s => s.Total);
        var averageTicket = paidSales.Count > 0 ? revenue / paidSales.Count : 0;
        var retailRevenue = paidSales.Where(s => s.ClientType == ClientType.Retail).Sum(s => s.Total);
        var wholesaleRevenue = paidSales.Where(s => s.ClientType == ClientType.Wholesale).Sum(s => s.Total);

        var ranking = paidSales
            .SelectMany(s => s.Items)
            .GroupBy(i => new { i.ProductId, i.ProductName })
            .Select(g => new ProductRankingDto(g.Key.ProductId, g.Key.ProductName, g.Sum(i => i.Quantity), g.Sum(i => i.Quantity * i.UnitPrice)))
            .OrderByDescending(r => r.Revenue)
            .Take(10)
            .ToList();

        var lowStock = await _db.Products
            .Where(p => p.Active && p.Stock <= 3)
            .OrderBy(p => p.Stock)
            .Select(p => new LowStockDto(p.Id, p.Name, p.Stock))
            .ToListAsync();

        return Ok(new SalesSummaryDto(revenue, averageTicket, paidSales.Count, retailRevenue, wholesaleRevenue, ranking, lowStock));
    }

    /// <summary>
    /// Crea los SaleItem a partir del input, resolviendo el precio unitario según PriceType
    /// y descontando stock de forma atómica (400 si no alcanza).
    /// </summary>
    private async Task<decimal> BuildItemsAsync(List<SaleItem> items, List<SaleItemInput> inputs)
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

            var decremented = await _stock.TryDecrementAsync(product.Id, itemInput.Quantity);
            if (!decremented)
                throw new StockException($"Stock insuficiente para '{product.Name}'");

            subtotal += unitPrice * itemInput.Quantity;

            items.Add(new SaleItem
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

    internal static SaleDto ToDto(Sale s) => new(
        s.Id, s.Number, s.ClientId,
        new CustomerDto(s.Customer.Name, s.Customer.Contact, s.Customer.TaxId, s.Customer.Address),
        s.ClientType, s.Status, s.PaymentMethod,
        s.Subtotal, s.DiscountType, s.DiscountPercent, s.DiscountFixedAmount, s.DiscountAmount,
        s.TaxRatePercent, s.TaxAmount, s.Total,
        s.CreatedAt, s.BudgetId,
        s.Items.Select(i => new SaleItemDto(i.ProductId, i.ProductName, i.Quantity, i.UnitPrice, i.PriceType)).ToList());
}

internal class StockException : Exception
{
    public StockException(string message) : base(message) { }
}
