using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/inquiries")]
public partial class InquiriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public InquiriesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<ActionResult<InquiryDto>> Create(InquiryCreateDto input)
    {
        if (string.IsNullOrWhiteSpace(input.ClientName) || input.ClientName.Length > 200)
            return BadRequest(new { error = "El nombre es obligatorio (máximo 200 caracteres)" });

        if (string.IsNullOrWhiteSpace(input.Email) || input.Email.Length > 200 || !EmailRegex().IsMatch(input.Email))
            return BadRequest(new { error = "El correo no es válido" });

        if (string.IsNullOrWhiteSpace(input.Message) || input.Message.Length > 2000)
            return BadRequest(new { error = "El mensaje es obligatorio (máximo 2000 caracteres)" });

        var inquiry = new Inquiry
        {
            ClientName = input.ClientName.Trim(),
            Email = input.Email.Trim(),
            Message = input.Message.Trim(),
            Status = InquiryStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Inquiries.Add(inquiry);
        await _db.SaveChangesAsync();

        return Ok(ToDto(inquiry));
    }

    [HttpGet]
    [RequireAdminKey]
    public async Task<ActionResult<List<InquiryDto>>> GetAll([FromQuery] InquiryStatus? status = null)
    {
        var query = _db.Inquiries.AsNoTracking().AsQueryable();
        if (status is not null) query = query.Where(i => i.Status == status);

        var inquiries = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();
        return Ok(inquiries.Select(ToDto));
    }

    [HttpPatch("{id}/status")]
    [RequireAdminKey]
    public async Task<ActionResult<InquiryDto>> UpdateStatus(int id, InquiryStatusUpdateDto input)
    {
        var inquiry = await _db.Inquiries.FindAsync(id);
        if (inquiry is null) return NotFound();

        inquiry.Status = input.Status;
        await _db.SaveChangesAsync();

        return Ok(ToDto(inquiry));
    }

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial Regex EmailRegex();

    private static InquiryDto ToDto(Inquiry i) => new(i.Id, i.ClientName, i.Email, i.Message, i.Status, i.CreatedAt);
}
