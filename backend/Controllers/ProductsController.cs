using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public ProductsController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetAll(
        [FromQuery] bool includeInactive = false, [FromQuery] string? category = null,
        [FromQuery] bool? featured = null)
    {
        if (includeInactive && !IsAdmin())
            return Unauthorized(new { error = "Invalid or missing X-Admin-Key" });

        var query = _db.Products
            .Include(p => p.Category)
            .Include(p => p.Specs)
            .Include(p => p.Images)
            .AsNoTracking()
            .AsQueryable();

        if (!includeInactive) query = query.Where(p => p.Active);
        if (!string.IsNullOrEmpty(category)) query = query.Where(p => p.CategoryId == category);
        if (featured is not null) query = query.Where(p => p.Featured == featured);

        var products = await query.OrderBy(p => p.Name).ToListAsync();
        return Ok(products.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(string id)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Specs)
            .Include(p => p.Images)
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
            Tag = input.Tag,
            Material = input.Material,
            Origin = input.Origin,
            Price = input.Price,
            OriginalPrice = input.OriginalPrice,
            WholesalePrice = input.WholesalePrice,
            Stock = input.Stock,
            Note = input.Note,
            Aspect = input.Aspect,
            Featured = input.Featured,
            Active = true,
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
        product.Tag = input.Tag;
        product.Material = input.Material;
        product.Origin = input.Origin;
        product.Price = input.Price;
        product.OriginalPrice = input.OriginalPrice;
        product.WholesalePrice = input.WholesalePrice;
        product.Stock = input.Stock;
        product.Note = input.Note;
        product.Aspect = input.Aspect;
        product.Featured = input.Featured;

        _db.ProductSpecs.RemoveRange(product.Specs);
        _db.ProductImages.RemoveRange(product.Images);
        product.Specs.Clear();
        product.Images.Clear();
        ApplySpecsAndImages(product, input);

        await _db.SaveChangesAsync();

        return Ok(await ReloadDto(product.Id));
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

    [HttpDelete("{id}")]
    [RequireAdminKey]
    public async Task<IActionResult> Delete(string id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product is null) return NotFound();

        var hasSales = await _db.SaleItems.AnyAsync(i => i.ProductId == id);
        if (hasSales)
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

        if (!await _db.Categories.AnyAsync(c => c.Id == input.CategoryId))
            return "La categoría indicada no existe";

        if (input.Price < 0 || input.Stock < 0)
            return "El precio y el stock no pueden ser negativos";

        if (input.OriginalPrice is not null && input.OriginalPrice <= input.Price)
            return "El precio original (tachado) debe ser mayor que el precio";

        if (input.WholesalePrice is not null && input.WholesalePrice >= input.Price)
            return "El precio mayorista debe ser menor que el precio";

        if (input.Images.Count > 6)
            return "Máximo 6 fotos por producto";

        if (input.Images.Any(string.IsNullOrWhiteSpace))
            return "No puede haber fotos vacías";

        return null;
    }

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
            .AsNoTracking()
            .FirstAsync(p => p.Id == id);

        return ToDto(product);
    }

    private static ProductDto ToDto(Product p) => new(
        p.Id, p.Name, p.CategoryId, p.Category?.Name ?? p.CategoryId, p.Tag,
        p.Material, p.Origin, p.Price, p.OriginalPrice, p.WholesalePrice, p.Stock,
        p.Note, p.Aspect, p.Active, p.Featured,
        p.Specs.OrderBy(s => s.Order).Select(s => new ProductSpecDto(s.Label, s.Value)).ToList(),
        p.Images.OrderBy(i => i.Order).Select(i => i.Url).ToList());

    private bool IsAdmin()
    {
        var configuredKey = _config["AdminApiKey"];
        if (string.IsNullOrEmpty(configuredKey)) return true;
        return Request.Headers["X-Admin-Key"].ToString() == configuredKey;
    }
}
