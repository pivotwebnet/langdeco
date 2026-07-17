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

    public BudgetsController(AppDbContext db, DocumentNumberingService numbering, ReceiptPdfService pdf)
    {
        _db = db;
        _numbering = numbering;
        _pdf = pdf;
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
            DiscountPercent = input.DiscountPercent,
            TaxRatePercent = input.TaxRatePercent,
            CreatedAt = DateTime.UtcNow,
        };

        decimal subtotal = 0;

        foreach (var itemInput in input.Items)
        {
            if (itemInput.Quantity <= 0)
                return BadRequest(new { error = "La cantidad debe ser mayor a 0" });

            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == itemInput.ProductId && p.Active);
            if (product is null)
                return BadRequest(new { error = $"Producto '{itemInput.ProductId}' no existe o está inactivo" });

            subtotal += product.Price * itemInput.Quantity;

            budget.Items.Add(new BudgetItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = itemInput.Quantity,
                UnitPrice = product.Price,
            });
        }

        var totals = DocumentTotalsCalculator.Compute(subtotal, input.DiscountPercent, input.TaxRatePercent);
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

        if (budget.Status != BudgetStatus.Open)
            return BadRequest(new { error = "Solo se pueden editar presupuestos abiertos" });

        budget.Items.Clear();
        decimal subtotal = 0;

        foreach (var itemInput in input.Items)
        {
            if (itemInput.Quantity <= 0)
                return BadRequest(new { error = "La cantidad debe ser mayor a 0" });

            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == itemInput.ProductId && p.Active);
            if (product is null)
                return BadRequest(new { error = $"Producto '{itemInput.ProductId}' no existe o está inactivo" });

            subtotal += product.Price * itemInput.Quantity;

            budget.Items.Add(new BudgetItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = itemInput.Quantity,
                UnitPrice = product.Price,
            });
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
        budget.DiscountPercent = input.DiscountPercent;
        budget.TaxRatePercent = input.TaxRatePercent;

        var totals = DocumentTotalsCalculator.Compute(subtotal, input.DiscountPercent, input.TaxRatePercent);
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
        var query = _db.Budgets.Include(b => b.Items).AsNoTracking().AsQueryable();

        if (status is not null) query = query.Where(b => b.Status == status);
        if (clientType is not null) query = query.Where(b => b.ClientType == clientType);
        if (from is not null) query = query.Where(b => b.CreatedAt >= from);
        if (to is not null) query = query.Where(b => b.CreatedAt <= to);

        var budgets = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();
        return Ok(budgets.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BudgetDto>> GetById(int id)
    {
        var budget = await _db.Budgets.Include(b => b.Items).AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
        if (budget is null) return NotFound();
        return Ok(ToDto(budget));
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<BudgetDto>> UpdateStatus(int id, BudgetStatusUpdateDto input)
    {
        var budget = await _db.Budgets.Include(b => b.Items).FirstOrDefaultAsync(b => b.Id == id);
        if (budget is null) return NotFound();

        if (!ValidTransitions[budget.Status].Contains(input.Status))
            return BadRequest(new { error = $"Transición inválida de {budget.Status} a {input.Status}" });

        budget.Status = input.Status;
        await _db.SaveChangesAsync();

        return Ok(ToDto(budget));
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

    private static BudgetDto ToDto(Budget b) => new(
        b.Id, b.Number, b.ClientId,
        new CustomerDto(b.Customer.Name, b.Customer.Contact, b.Customer.TaxId, b.Customer.Address),
        b.ClientType, b.Status, b.ValidUntil,
        b.Subtotal, b.DiscountPercent, b.DiscountAmount, b.TaxRatePercent, b.TaxAmount, b.Total,
        b.CreatedAt,
        b.Items.Select(i => new BudgetItemDto(i.ProductId, i.ProductName, i.Quantity, i.UnitPrice)).ToList());
}
