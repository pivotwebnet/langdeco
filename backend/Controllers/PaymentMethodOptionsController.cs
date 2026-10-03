using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;

namespace backend.Controllers;

// Catálogo administrable de medios de cobro para Cobranza (ver SalePayment) — mismo esqueleto
// liviano que CategoriesController, sin Group porque acá no aplica.
[ApiController]
[Route("api/payment-method-options")]
[RequireAdminKey]
public class PaymentMethodOptionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public PaymentMethodOptionsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<PaymentMethodOptionDto>>> GetAll([FromQuery] bool includeInactive = false)
    {
        var query = _db.PaymentMethodOptions.AsNoTracking().AsQueryable();
        if (!includeInactive) query = query.Where(p => p.Active);

        var options = await query.OrderBy(p => p.Name)
            .Select(p => new PaymentMethodOptionDto(p.Id, p.Name, p.Active))
            .ToListAsync();

        return Ok(options);
    }

    [HttpPost]
    public async Task<ActionResult<PaymentMethodOptionDto>> Create(PaymentMethodOptionUpsertDto input)
    {
        var name = input.Name.Trim();
        if (name.Length == 0)
            return BadRequest(new { error = "El nombre es obligatorio" });

        if (await _db.PaymentMethodOptions.AnyAsync(p => p.Name.ToLower() == name.ToLower()))
            return BadRequest(new { error = "Ya existe un medio de pago con ese nombre" });

        var option = new PaymentMethodOption { Name = name, Active = input.Active };
        _db.PaymentMethodOptions.Add(option);
        await _db.SaveChangesAsync();

        return Ok(new PaymentMethodOptionDto(option.Id, option.Name, option.Active));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PaymentMethodOptionDto>> Update(int id, PaymentMethodOptionUpsertDto input)
    {
        var option = await _db.PaymentMethodOptions.FindAsync(id);
        if (option is null) return NotFound();

        var name = input.Name.Trim();
        if (name.Length == 0)
            return BadRequest(new { error = "El nombre es obligatorio" });

        if (await _db.PaymentMethodOptions.AnyAsync(p => p.Id != id && p.Name.ToLower() == name.ToLower()))
            return BadRequest(new { error = "Ya existe un medio de pago con ese nombre" });

        option.Name = name;
        option.Active = input.Active;
        await _db.SaveChangesAsync();

        return Ok(new PaymentMethodOptionDto(option.Id, option.Name, option.Active));
    }

    [HttpPost("{id}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        var option = await _db.PaymentMethodOptions.FindAsync(id);
        if (option is null) return NotFound();

        option.Active = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var option = await _db.PaymentMethodOptions.FindAsync(id);
        if (option is null) return NotFound();

        option.Active = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
