using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;

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

    public SalesController(AppDbContext db) => _db = db;

    [HttpPost]
    public async Task<ActionResult<SaleDto>> Create(SaleCreateDto input)
    {
        if (input.Items is null || input.Items.Count == 0)
            return BadRequest(new { error = "La venta debe tener al menos un producto" });

        var status = input.Status ?? SaleStatus.Pending;
        if (status != SaleStatus.Pending && status != SaleStatus.Paid)
            return BadRequest(new { error = "El estado inicial solo puede ser pending o paid" });

        await using var tx = await _db.Database.BeginTransactionAsync();

        var sale = new Sale
        {
            ClientName = input.ClientName,
            ClientContact = input.ClientContact,
            ClientType = input.ClientType,
            PaymentMethod = input.PaymentMethod,
            Status = status,
            CreatedAt = DateTime.UtcNow,
        };

        decimal total = 0;

        foreach (var itemInput in input.Items)
        {
            if (itemInput.Quantity <= 0)
                return BadRequest(new { error = "La cantidad debe ser mayor a 0" });

            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == itemInput.ProductId && p.Active);
            if (product is null)
                return BadRequest(new { error = $"Producto '{itemInput.ProductId}' no existe o está inactivo" });

            var rowsUpdated = await _db.Products
                .Where(p => p.Id == product.Id && p.Stock >= itemInput.Quantity)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock - itemInput.Quantity));

            if (rowsUpdated == 0)
                return BadRequest(new { error = $"Stock insuficiente para '{product.Name}'" });

            total += product.Price * itemInput.Quantity;

            sale.Items.Add(new SaleItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = itemInput.Quantity,
                UnitPrice = product.Price,
            });
        }

        sale.Total = total;
        _db.Sales.Add(sale);
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
            {
                await _db.Products
                    .Where(p => p.Id == item.ProductId)
                    .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock + item.Quantity));
            }
        }

        sale.Status = input.Status;
        await _db.SaveChangesAsync();

        return Ok(ToDto(sale));
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

    private static SaleDto ToDto(Sale s) => new(
        s.Id, s.ClientName, s.ClientContact, s.ClientType, s.Status, s.PaymentMethod, s.Total, s.CreatedAt,
        s.Items.Select(i => new SaleItemDto(i.ProductId, i.ProductName, i.Quantity, i.UnitPrice)).ToList());
}
