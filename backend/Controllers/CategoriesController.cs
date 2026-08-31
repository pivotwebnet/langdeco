using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;
using backend.Services;

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
    public async Task<ActionResult<List<CategoryDto>>> GetAll(
        [FromQuery] bool includeInactive = false, [FromQuery] string? search = null,
        [FromQuery] CategoryGroup? group = null)
    {
        if (includeInactive && !IsAdmin())
            return Unauthorized(new { error = "Invalid or missing X-Admin-Key" });

        var query = _db.Categories.AsNoTracking().AsQueryable();
        if (!includeInactive) query = query.Where(c => c.Active);
        if (group is not null) query = query.Where(c => c.Group == group);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(s));
        }

        var categories = await query
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Group, c.Active))
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

        var category = new Category { Id = input.Id, Name = input.Name, Group = input.Group, Active = true };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return Ok(new CategoryDto(category.Id, category.Name, category.Group, category.Active));
    }

    [HttpPut("{id}")]
    [RequireAdminKey]
    public async Task<ActionResult<CategoryDto>> Update(string id, CategoryUpsertDto input)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return NotFound();

        category.Name = input.Name;
        category.Group = input.Group;
        await _db.SaveChangesAsync();

        return Ok(new CategoryDto(category.Id, category.Name, category.Group, category.Active));
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

    [HttpPost("{id}/deactivate")]
    [RequireAdminKey]
    public async Task<IActionResult> Deactivate(string id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return NotFound();

        category.Active = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("bulk-activate")]
    [RequireAdminKey]
    public async Task<ActionResult<BulkResultDto>> BulkActivate(BulkIdsDto input)
    {
        var updated = await _db.Categories.Where(c => input.Ids.Contains(c.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.Active, true));
        return Ok(new BulkResultDto(updated, new List<string>()));
    }

    [HttpPost("bulk-deactivate")]
    [RequireAdminKey]
    public async Task<ActionResult<BulkResultDto>> BulkDeactivate(BulkIdsDto input)
    {
        var updated = await _db.Categories.Where(c => input.Ids.Contains(c.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.Active, false));
        return Ok(new BulkResultDto(updated, new List<string>()));
    }

    [HttpDelete("{id}")]
    [RequireAdminKey]
    public async Task<IActionResult> Delete(string id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return NotFound();

        var hasProducts = await _db.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts)
        {
            category.Active = false;
            await _db.SaveChangesAsync();
            return Ok(new { deactivated = true });
        }

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private bool IsAdmin() =>
        AdminKeyComparer.Matches(Request.Headers["X-Admin-Key"].ToString(), _config["AdminApiKey"]);
}
