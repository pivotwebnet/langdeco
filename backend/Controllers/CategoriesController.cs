using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public CategoriesController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll([FromQuery] bool includeInactive = false)
    {
        if (includeInactive && !IsAdmin())
            return Unauthorized(new { error = "Invalid or missing X-Admin-Key" });

        var query = _db.Categories.AsNoTracking().AsQueryable();
        if (!includeInactive) query = query.Where(c => c.Active);

        var categories = await query
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Active))
            .ToListAsync();

        return Ok(categories);
    }

    [HttpPost]
    [RequireAdminKey]
    public async Task<ActionResult<CategoryDto>> Create(CategoryUpsertDto input)
    {
        if (!Validation.IsValidSlug(input.Id))
            return BadRequest(new { error = "El id debe ser un slug (minúsculas-números-guiones)" });

        if (await _db.Categories.AnyAsync(c => c.Id == input.Id))
            return BadRequest(new { error = "Ya existe una categoría con ese id" });

        var category = new Category { Id = input.Id, Name = input.Name, Active = true };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return Ok(new CategoryDto(category.Id, category.Name, category.Active));
    }

    [HttpPut("{id}")]
    [RequireAdminKey]
    public async Task<ActionResult<CategoryDto>> Update(string id, CategoryUpsertDto input)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return NotFound();

        category.Name = input.Name;
        await _db.SaveChangesAsync();

        return Ok(new CategoryDto(category.Id, category.Name, category.Active));
    }

    [HttpPost("{id}/activate")]
    [RequireAdminKey]
    public async Task<IActionResult> Activate(string id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return NotFound();

        category.Active = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [RequireAdminKey]
    public async Task<IActionResult> Delete(string id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return NotFound();

        var hasProducts = await _db.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts)
            return BadRequest(new { error = "No se puede eliminar una categoría con productos asociados" });

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private bool IsAdmin()
    {
        var configuredKey = _config["AdminApiKey"];
        if (string.IsNullOrEmpty(configuredKey)) return true;
        return Request.Headers["X-Admin-Key"].ToString() == configuredKey;
    }
}
