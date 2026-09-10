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
    private readonly SaleExcelService _excel;

    public SalesController(
        AppDbContext db, DocumentNumberingService numbering, ReceiptPdfService pdf,
        StockService stock, BudgetLifecycleService lifecycle, SaleExcelService excel)
    {
        _db = db;
        _numbering = numbering;
        _pdf = pdf;
        _stock = stock;
        _lifecycle = lifecycle;
        _excel = excel;
    }

    // Importa el "Listado de Ventas" exportado del sistema anterior — ver SaleExcelService para
    // el formato. A diferencia de Create(), esto NO pasa por BuildItemsAsync: son ventas que ya
    // ocurrieron, así que no se descuenta stock (el stock actual del catálogo ya es el real, y
    // restarlo de nuevo lo duplicaría) y el Status/Number se toman tal cual del Excel en vez de
    // calcularse. El Number original del sistema viejo se conserva (evita perder la referencia
    // que el cliente ya usa en sus propios registros) y al final se avanza el contador de
    // numeración de Sale para que las ventas nuevas no choquen con los números importados.
    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [RequireAdminKey]
    public async Task<ActionResult<SaleImportResultDto>> Import(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Archivo vacío" });

        if (!await _db.Categories.AnyAsync(c => c.Id == ProductsController.PendingCategoryId))
            return BadRequest(new { error = "Falta la categoría 'Sin categoría' — faltan aplicar migraciones" });

        List<SaleImportRow> rows;
        try
        {
            using var stream = file.OpenReadStream();
            rows = _excel.ParseImport(stream);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        var existingNumbers = (await _db.Sales.Select(s => s.Number).ToListAsync()).ToHashSet();
        var existingProductIds = (await _db.Products.Select(p => p.Id).ToListAsync()).ToHashSet();

        var productNameLookup = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var p in await _db.Products.Select(p => new { p.Id, p.Name }).ToListAsync())
            productNameLookup.TryAdd(p.Name.Trim(), p.Id);

        var errors = new List<ImportRowError>();
        var created = 0;
        var duplicatesSkipped = 0;
        var productsCreated = 0;
        var maxNumber = 0;

        await using var tx = await _db.Database.BeginTransactionAsync();

        foreach (var row in rows)
        {
            if (existingNumbers.Contains(row.OriginalNumber))
            {
                duplicatesSkipped++;
                continue;
            }

            if (row.ProductNames.Count == 0)
            {
                errors.Add(new ImportRowError(row.RowNumber, "La venta no tiene productos listados"));
                continue;
            }

            var lineItems = new List<(string ProductId, string Name)>();
            foreach (var name in row.ProductNames)
            {
                if (!productNameLookup.TryGetValue(name, out var productId))
                {
                    var slug = Validation.Slugify(name);
                    var candidate = slug;
                    var suffix = 2;
                    while (!existingProductIds.Add(candidate))
                        candidate = $"{slug}-{suffix++}";

                    _db.Products.Add(new Product
                    {
                        Id = candidate,
                        Name = name,
                        CategoryId = ProductsController.PendingCategoryId,
                        Price = 1m,
                        Stock = 0,
                        Active = false,
                        Note = "Creado automáticamente al importar ventas — revisar precio, categoría y stock",
                    });
                    productNameLookup[name] = candidate;
                    productId = candidate;
                    productsCreated++;
                }

                lineItems.Add((productId, name));
            }

            // No hay precio ni cantidad por línea en el Excel de origen — se reparte el subtotal
            // (antes de descuento, igual que en una venta armada a mano) en partes iguales entre
            // los productos listados, con el resto de redondeo en el último ítem para que la
            // suma cierre exacto contra el subtotal real de la venta.
            var count = lineItems.Count;
            var baseShare = Math.Round(row.SubtotalBeforeDiscount / count, 2, MidpointRounding.AwayFromZero);
            var items = new List<SaleItem>();
            decimal allocated = 0;
            for (var i = 0; i < count; i++)
            {
                var (productId, name) = lineItems[i];
                var share = i == count - 1 ? row.SubtotalBeforeDiscount - allocated : baseShare;
                allocated += share;
                items.Add(new SaleItem
                {
                    ProductId = productId,
                    ProductName = name,
                    Quantity = 1,
                    UnitPrice = share,
                    PriceType = ClientType.Retail,
                });
            }

            _db.Sales.Add(new Sale
            {
                Number = row.OriginalNumber,
                ClientId = null,
                Customer = new CustomerInfo
                {
                    Name = row.ClientName,
                    Contact = row.Phone ?? row.Cell,
                    Address = row.Address,
                },
                ClientType = ClientType.Retail,
                Status = row.Status,
                PaymentMethod = MapPaymentMethod(row.PaymentMethodRaw),
                Subtotal = row.SubtotalBeforeDiscount,
                DiscountType = DiscountType.Fixed,
                DiscountFixedAmount = row.DiscountAmount,
                DiscountAmount = row.DiscountAmount,
                TaxRatePercent = 0,
                TaxAmount = 0,
                Total = row.Total,
                CreatedAt = DateTime.SpecifyKind(row.Date, DateTimeKind.Utc),
                Items = items,
            });

            existingNumbers.Add(row.OriginalNumber);
            maxNumber = Math.Max(maxNumber, row.OriginalNumber);
            created++;
        }

        await _db.SaveChangesAsync();

        if (maxNumber > 0)
        {
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE \"DocumentCounters\" SET \"LastNumber\" = GREATEST(\"LastNumber\", {maxNumber}) WHERE \"Type\" = 'Sale'");
        }

        await tx.CommitAsync();

        return Ok(new SaleImportResultDto(created, duplicatesSkipped, productsCreated, errors));
    }

    private static PaymentMethod MapPaymentMethod(string? raw)
    {
        var first = (raw ?? "").Split('-')[0].Trim();
        if (first.Contains("Banco", StringComparison.OrdinalIgnoreCase) ||
            first.Contains("Transferencia", StringComparison.OrdinalIgnoreCase) ||
            first.Contains("PYME", StringComparison.OrdinalIgnoreCase))
            return PaymentMethod.Transfer;
        if (first.Contains("Caja", StringComparison.OrdinalIgnoreCase) ||
            first.Contains("Efectivo", StringComparison.OrdinalIgnoreCase))
            return PaymentMethod.Cash;
        return PaymentMethod.Other;
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

        var validationError = DocumentTotalsCalculator.Validate(input.DiscountType, input.DiscountPercent, input.TaxRatePercent, totals);
        if (validationError is not null)
        {
            await tx.RollbackAsync();
            return BadRequest(new { error = validationError });
        }

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

        var validationError = DocumentTotalsCalculator.Validate(input.DiscountType, input.DiscountPercent, input.TaxRatePercent, totals);
        if (validationError is not null)
        {
            await tx.RollbackAsync();
            return BadRequest(new { error = validationError });
        }

        sale.Subtotal = totals.Subtotal;
        sale.DiscountAmount = totals.DiscountAmount;
        sale.TaxAmount = totals.TaxAmount;
        sale.Total = totals.Total;

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDto(sale));
    }

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] SaleStatus? status = null,
        [FromQuery] ClientType? clientType = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query = _db.Sales.Include(s => s.Items).AsNoTracking().AsQueryable();

        if (status is not null) query = query.Where(s => s.Status == status);
        if (clientType is not null) query = query.Where(s => s.ClientType == clientType);
        if (from is not null) query = query.Where(s => s.CreatedAt >= DateTime.SpecifyKind(from.Value, DateTimeKind.Utc));
        if (to is not null) query = query.Where(s => s.CreatedAt <= DateTime.SpecifyKind(to.Value, DateTimeKind.Utc));

        query = query.OrderByDescending(s => s.CreatedAt);

        if (page is not null)
        {
            var paged = await Paging.ApplyAsync(query, page.Value, pageSize);
            return Ok(new PagedResult<SaleDto>(paged.Items.Select(ToDto).ToList(), paged.Total, paged.Page, paged.PageSize));
        }

        var sales = await query.ToListAsync();
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
        await using var tx = await _db.Database.BeginTransactionAsync();

        var sale = await _db.Sales.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == id);
        if (sale is null) return NotFound();

        if (!ValidTransitions[sale.Status].Contains(input.Status))
            return BadRequest(new { error = $"Transición inválida de {sale.Status} a {input.Status}" });

        // Transición atómica guardada por el estado leído recién: si otra request ya cambió el
        // estado entre el SELECT de arriba y este UPDATE (doble click, retry), acá da 0 filas y
        // evitamos reponer stock dos veces para la misma cancelación.
        var updatedRows = await _db.Sales
            .Where(s => s.Id == id && s.Status == sale.Status)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, input.Status));

        if (updatedRows == 0)
        {
            await tx.RollbackAsync();
            return Conflict(new { error = "La venta ya fue actualizada por otra operación. Recargá e intentá de nuevo." });
        }

        if (input.Status == SaleStatus.Cancelled)
        {
            foreach (var item in sale.Items)
                await _stock.IncrementAsync(item.ProductId, item.Quantity);
        }

        sale.Status = input.Status;
        await tx.CommitAsync();

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

        var netAmount = sale.Subtotal - sale.DiscountAmount;
        var receipt = new Dtos.ReceiptData(
            "VENTA", sale.Number, sale.CreatedAt, null,
            sale.Customer.Name, sale.Customer.TaxId, sale.Customer.Address, sale.Customer.Contact,
            sale.Items.Select(i => new Dtos.ReceiptItemData(
                i.ProductId, i.ProductName, i.Quantity, i.UnitPrice, 0,
                i.Quantity * i.UnitPrice, sale.TaxRatePercent,
                i.Quantity * i.UnitPrice * (1 + sale.TaxRatePercent / 100m))).ToList(),
            sale.Subtotal, sale.DiscountPercent, sale.DiscountAmount,
            sale.TaxRatePercent, sale.TaxAmount, netAmount, sale.Total);

        var bytes = _pdf.Generate(receipt, company);
        return File(bytes, "application/pdf", $"venta-{sale.Number}.pdf");
    }

    [HttpGet("summary")]
    public async Task<ActionResult<SalesSummaryDto>> Summary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        from = from.HasValue ? DateTime.SpecifyKind(from.Value, DateTimeKind.Utc) : null;
        to = to.HasValue ? DateTime.SpecifyKind(to.Value, DateTimeKind.Utc) : null;

        var query = _db.Sales
            .Include(s => s.Items)
            .Where(s => s.Status == SaleStatus.Paid)
            .AsNoTracking()
            .AsQueryable();

        if (from.HasValue) query = query.Where(s => s.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(s => s.CreatedAt <= to.Value);

        var paidSales = await query.ToListAsync();

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

        var monthlyRevenue = paidSales
            .GroupBy(s => new DateTime(s.CreatedAt.Year, s.CreatedAt.Month, 1))
            .OrderBy(g => g.Key)
            .Select(g => new MonthlyRevenueDto(g.Key.ToString("yyyy-MM"), g.Sum(s => s.Total), g.Count()))
            .ToList();

        decimal? previousPeriodRevenue = null;
        decimal? revenueChangePercent = null;
        if (from.HasValue)
        {
            var periodEnd = to ?? DateTime.UtcNow;
            var periodLength = periodEnd - from.Value;
            if (periodLength > TimeSpan.Zero)
            {
                var previousFrom = from.Value - periodLength;
                previousPeriodRevenue = await _db.Sales
                    .Where(s => s.Status == SaleStatus.Paid && s.CreatedAt >= previousFrom && s.CreatedAt < from.Value)
                    .SumAsync(s => (decimal?)s.Total) ?? 0;

                revenueChangePercent = previousPeriodRevenue > 0
                    ? Math.Round((revenue - previousPeriodRevenue.Value) / previousPeriodRevenue.Value * 100, 1)
                    : null;
            }
        }

        return Ok(new SalesSummaryDto(
            revenue, averageTicket, paidSales.Count, retailRevenue, wholesaleRevenue, ranking, lowStock,
            monthlyRevenue, previousPeriodRevenue, revenueChangePercent));
    }

    /// <summary>
    /// Crea los SaleItem a partir del input, resolviendo el precio unitario según PriceType
    /// y descontando stock de forma atómica (400 si no alcanza).
    /// </summary>
    private async Task<decimal> BuildItemsAsync(List<SaleItem> items, List<SaleItemInput> inputs)
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
