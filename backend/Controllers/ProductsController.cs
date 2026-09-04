using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ProductExcelService _excel;

    public ProductsController(AppDbContext db, IConfiguration config, ProductExcelService excel)
    {
        _db = db;
        _config = config;
        _excel = excel;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] bool includeInactive = false, [FromQuery] string? category = null,
        [FromQuery] bool? featured = null, [FromQuery] string? search = null,
        [FromQuery] int? page = null, [FromQuery] int? pageSize = null)
    {
        if (includeInactive && !IsAdmin())
            return Unauthorized(new { error = "Invalid or missing X-Admin-Key" });

        var query = _db.Products
            .Include(p => p.Category)
            .Include(p => p.Specs)
            .Include(p => p.Images)
            .Include(p => p.Supplier)
            .AsNoTracking()
            .AsQueryable();

        if (!includeInactive) query = query.Where(p => p.Active);
        if (!string.IsNullOrEmpty(category)) query = query.Where(p => p.CategoryId == category);
        if (featured is not null) query = query.Where(p => p.Featured == featured);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || (p.Material ?? "").ToLower().Contains(s));
        }

        query = query.OrderBy(p => p.Name);

        if (page is not null)
        {
            var paged = await Paging.ApplyAsync(query, page.Value, pageSize);
            return Ok(new PagedResult<ProductDto>(paged.Items.Select(ToDto).ToList(), paged.Total, paged.Page, paged.PageSize));
        }

        var products = await query.ToListAsync();
        return Ok(products.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(string id)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Specs)
            .Include(p => p.Images)
            .Include(p => p.Supplier)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product is null || (!product.Active && !IsAdmin())) return NotFound();

        return Ok(ToDto(product));
    }

    [HttpPost]
    [RequireAdminKey]
    public async Task<ActionResult<ProductDto>> Create(ProductUpsertDto input)
    {
        var error = await ValidateInput(input, isCreate: true);
        if (error is not null) return BadRequest(new { error });

        var product = new Product
        {
            Id = input.Id,
            Name = input.Name,
            CategoryId = input.CategoryId,
            Material = input.Material,
            RoomTags = NormalizeRoomTags(input.RoomTags),
            Price = input.Price,
            CardPrice = input.CardPrice,
            OriginalPrice = input.OriginalPrice,
            WholesalePrice = input.WholesalePrice,
            Stock = input.Stock,
            Installments = input.Installments,
            Note = input.Note,
            Featured = input.Featured,
            Active = input.Active,
            CutoutImageUrl = input.CutoutImageUrl,
            CostPrice = input.CostPrice,
            IvaPercent = input.IvaPercent,
            SupplierId = input.SupplierId,
        };
        ApplySpecsAndImages(product, input);

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        return Ok(await ReloadDto(product.Id));
    }

    [HttpPut("{id}")]
    [RequireAdminKey]
    public async Task<ActionResult<ProductDto>> Update(string id, ProductUpsertDto input)
    {
        var product = await _db.Products
            .Include(p => p.Specs)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product is null) return NotFound();

        var error = await ValidateInput(input, isCreate: false);
        if (error is not null) return BadRequest(new { error });

        product.Name = input.Name;
        product.CategoryId = input.CategoryId;
        product.Material = input.Material;
        product.RoomTags = NormalizeRoomTags(input.RoomTags);
        product.Price = input.Price;
        product.CardPrice = input.CardPrice;
        product.OriginalPrice = input.OriginalPrice;
        product.WholesalePrice = input.WholesalePrice;
        product.Stock = input.Stock;
        product.Installments = input.Installments;
        product.Note = input.Note;
        product.Featured = input.Featured;
        product.Active = input.Active;
        product.CutoutImageUrl = input.CutoutImageUrl;
        product.CostPrice = input.CostPrice;
        product.IvaPercent = input.IvaPercent;
        product.SupplierId = input.SupplierId;

        _db.ProductSpecs.RemoveRange(product.Specs);
        _db.ProductImages.RemoveRange(product.Images);
        product.Specs.Clear();
        product.Images.Clear();
        ApplySpecsAndImages(product, input);

        await _db.SaveChangesAsync();

        return Ok(await ReloadDto(product.Id));
    }

    // Endpoint liviano para el wizard de categorización post-importación — evita que
    // asignar una sola categoría tenga que reenviar el ProductUpsertDto completo.
    [HttpPost("{id}/category")]
    [RequireAdminKey]
    public async Task<IActionResult> SetCategory(string id, SetCategoryDto input)
    {
        var product = await _db.Products.FindAsync(id);
        if (product is null) return NotFound();

        if (!await _db.Categories.AnyAsync(c => c.Id == input.CategoryId))
            return BadRequest(new { error = "La categoría indicada no existe" });

        product.CategoryId = input.CategoryId;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Categoría placeholder (ver migración SeedSinCategoria) donde caen los productos
    // importados por Excel — el Excel de origen no trae categoría. Oculta del sitio
    // público (Category.Active = false); el admin las reasigna con el wizard de
    // categorización, que consulta /products?category=sin-categoria.
    public const string PendingCategoryId = "sin-categoria";

    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [RequireAdminKey]
    public async Task<ActionResult<ProductImportResultDto>> Import(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Archivo vacío" });

        if (!await _db.Categories.AnyAsync(c => c.Id == PendingCategoryId))
            return BadRequest(new { error = "Falta la categoría 'Sin categoría' — faltan aplicar migraciones" });

        List<ProductImportRow> rows;
        using (var stream = file.OpenReadStream())
            rows = _excel.ParseImport(stream);

        var existingIds = (await _db.Products.Select(p => p.Id).ToListAsync()).ToHashSet();

        var supplierLookup = await PartyImportMatcher.PrefetchAsync(
            _db.Suppliers,
            rows.Where(r => !string.IsNullOrWhiteSpace(r.ProveedorName)).Select(r => ((string?)null, r.ProveedorName!)));

        var errors = new List<ImportRowError>();
        var created = 0;
        var suppliersCreated = 0;
        var forcedInactive = 0;
        var stockCorrected = 0;

        await using var tx = await _db.Database.BeginTransactionAsync();

        foreach (var row in rows)
        {
            if (string.IsNullOrWhiteSpace(row.Name))
            {
                errors.Add(new ImportRowError(row.RowNumber, "Falta el nombre"));
                continue;
            }

            var slug = Validation.Slugify(row.Name);
            var candidate = slug;
            var suffix = 2;
            while (!existingIds.Add(candidate))
                candidate = $"{slug}-{suffix++}";

            var stock = ProductExcelService.ParseStock(row.StockRaw);
            if (stock < 0)
            {
                stock = 0;
                stockCorrected++;
            }

            decimal price;
            bool active;
            string? note = null;
            if (row.SalePrice <= 0)
            {
                price = 1m;
                active = false;
                note = "Precio a revisar (importado en $0)";
                forcedInactive++;
            }
            else
            {
                price = row.SalePrice;
                active = true;
            }

            Supplier? supplier = null;
            if (!string.IsNullOrWhiteSpace(row.ProveedorName))
            {
                supplier = supplierLookup.Find(null, row.ProveedorName);
                if (supplier is null)
                {
                    supplier = new Supplier
                    {
                        CompanyOrFullName = row.ProveedorName.Trim(),
                        BillingCompanyOrFullName = row.ProveedorName.Trim(),
                    };
                    _db.Suppliers.Add(supplier);
                    supplierLookup.Register(supplier);
                    suppliersCreated++;
                }
            }

            _db.Products.Add(new Product
            {
                Id = candidate,
                Name = row.Name,
                CategoryId = PendingCategoryId,
                Material = null,
                Price = price,
                Stock = stock,
                // Costo/IVA en 0 en el Excel viejo suele significar "sin cargar", no "gratis".
                CostPrice = row.CostPrice > 0 ? row.CostPrice : null,
                IvaPercent = row.IvaPercent,
                Active = active,
                Note = note,
                Supplier = supplier,
            });
            created++;
        }

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new ProductImportResultDto(created, suppliersCreated, forcedInactive, stockCorrected, errors));
    }

    [HttpPost("{id}/activate")]
    [RequireAdminKey]
    public async Task<IActionResult> Activate(string id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product is null) return NotFound();

        product.Active = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/deactivate")]
    [RequireAdminKey]
    public async Task<IActionResult> Deactivate(string id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product is null) return NotFound();

        product.Active = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("bulk-activate")]
    [RequireAdminKey]
    public async Task<ActionResult<BulkResultDto>> BulkActivate(BulkIdsDto input)
    {
        var updated = await _db.Products.Where(p => input.Ids.Contains(p.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Active, true));
        return Ok(new BulkResultDto(updated, new List<string>()));
    }

    [HttpPost("bulk-deactivate")]
    [RequireAdminKey]
    public async Task<ActionResult<BulkResultDto>> BulkDeactivate(BulkIdsDto input)
    {
        var updated = await _db.Products.Where(p => input.Ids.Contains(p.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Active, false));
        return Ok(new BulkResultDto(updated, new List<string>()));
    }

    // Escalar Price/OriginalPrice/WholesalePrice por el mismo factor preserva
    // OriginalPrice > Price > WholesalePrice automáticamente (multiplicar tres
    // positivos ordenados por el mismo factor positivo no cambia el orden) —
    // no hace falta revalidar esa relación, solo que Price no quede en cero o negativo.
    [HttpPost("bulk-price-adjust")]
    [RequireAdminKey]
    public async Task<ActionResult<BulkResultDto>> BulkPriceAdjust(BulkPriceAdjustDto input)
    {
        var factor = 1 + input.Percent / 100m;
        var products = await _db.Products.Where(p => input.Ids.Contains(p.Id)).ToListAsync();
        var skipped = new List<string>();

        foreach (var product in products)
        {
            var newPrice = Math.Round(product.Price * factor, 2);
            if (newPrice <= 0)
            {
                skipped.Add(product.Id);
                continue;
            }

            product.Price = newPrice;
            if (product.CardPrice is not null) product.CardPrice = Math.Round(product.CardPrice.Value * factor, 2);
            if (product.OriginalPrice is not null) product.OriginalPrice = Math.Round(product.OriginalPrice.Value * factor, 2);
            if (product.WholesalePrice is not null) product.WholesalePrice = Math.Round(product.WholesalePrice.Value * factor, 2);
        }

        await _db.SaveChangesAsync();
        return Ok(new BulkResultDto(products.Count - skipped.Count, skipped));
    }

    [HttpDelete("{id}")]
    [RequireAdminKey]
    public async Task<IActionResult> Delete(string id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product is null) return NotFound();

        var isReferenced = await _db.SaleItems.AnyAsync(i => i.ProductId == id)
            || await _db.BudgetItems.AnyAsync(i => i.ProductId == id);
        if (isReferenced)
        {
            product.Active = false;
            await _db.SaveChangesAsync();
            return Ok(new { deactivated = true });
        }

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string?> ValidateInput(ProductUpsertDto input, bool isCreate)
    {
        if (isCreate)
        {
            if (!Validation.IsValidSlug(input.Id))
                return "El id debe ser un slug (minúsculas-números-guiones)";
            if (await _db.Products.AnyAsync(p => p.Id == input.Id))
                return "Ya existe un producto con ese id";
        }

        if (string.IsNullOrWhiteSpace(input.Name))
            return "El nombre es obligatorio";

        if (input.Name.Length > 200)
            return "El nombre no puede superar los 200 caracteres";

        if (input.Material is { Length: > 200 })
            return "El material no puede superar los 200 caracteres";

        if (!await _db.Categories.AnyAsync(c => c.Id == input.CategoryId))
            return "La categoría indicada no existe";

        if (input.SupplierId is not null && !await _db.Suppliers.AnyAsync(s => s.Id == input.SupplierId))
            return "El proveedor indicado no existe";

        if (input.Price <= 0)
            return "El precio debe ser mayor a cero";

        if (input.Stock < 0)
            return "El stock no puede ser negativo";

        if (input.OriginalPrice is not null && input.OriginalPrice <= input.Price)
            return "El precio original (tachado) debe ser mayor que el precio";

        if (input.WholesalePrice is not null && input.WholesalePrice >= input.Price)
            return "El precio mayorista debe ser menor que el precio";

        if (input.Images.Count > 6)
            return "Máximo 6 fotos por producto";

        if (input.Images.Any(string.IsNullOrWhiteSpace))
            return "No puede haber fotos vacías";

        if ((input.RoomTags?.Count ?? 0) > 6)
            return "Máximo 6 ambientes por producto";

        return null;
    }

    private static List<string> NormalizeRoomTags(List<string>? tags) =>
        (tags ?? new())
            .Select(t => t.Trim())
            .Where(t => t.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    private static void ApplySpecsAndImages(Product product, ProductUpsertDto input)
    {
        for (int i = 0; i < input.Specs.Count; i++)
            product.Specs.Add(new ProductSpec { Label = input.Specs[i].Label, Value = input.Specs[i].Value, Order = i });

        for (int i = 0; i < input.Images.Count; i++)
            product.Images.Add(new ProductImage { Url = input.Images[i], Order = i });
    }

    private async Task<ProductDto> ReloadDto(string id)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Specs)
            .Include(p => p.Images)
            .Include(p => p.Supplier)
            .AsNoTracking()
            .FirstAsync(p => p.Id == id);

        return ToDto(product);
    }

    private static ProductDto ToDto(Product p) => new(
        p.Id, p.Name, p.CategoryId, p.Category?.Name ?? p.CategoryId,
        p.Material, p.RoomTags, p.Price, p.CardPrice, p.OriginalPrice, p.WholesalePrice, p.Stock, p.Installments,
        p.Note, p.Active, p.Featured,
        p.Specs.OrderBy(s => s.Order).Select(s => new ProductSpecDto(s.Label, s.Value)).ToList(),
        p.Images.OrderBy(i => i.Order).Select(i => i.Url).ToList(), p.CutoutImageUrl,
        p.CostPrice, p.IvaPercent, p.SupplierId, p.Supplier?.CompanyOrFullName);

    private bool IsAdmin() =>
        AdminKeyComparer.Matches(Request.Headers["X-Admin-Key"].ToString(), _config["AdminApiKey"]);
}
