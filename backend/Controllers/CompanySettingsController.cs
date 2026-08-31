using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/company-settings")]
public class CompanySettingsController : ControllerBase
{
    private readonly AppDbContext _db;

    public CompanySettingsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [RequireAdminKey]
    public async Task<ActionResult<CompanySettingsDto>> Get()
    {
        var settings = await _db.CompanySettings.AsNoTracking().FirstOrDefaultAsync();
        return Ok(new CompanySettingsDto(settings?.Phone));
    }

    [HttpPut]
    [RequireAdminKey]
    public async Task<ActionResult<CompanySettingsDto>> Update(CompanySettingsDto input)
    {
        var settings = await _db.CompanySettings.FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new CompanySettings { Id = 1 };
            _db.CompanySettings.Add(settings);
        }

        settings.Phone = input.Phone;
        await _db.SaveChangesAsync();

        return Ok(new CompanySettingsDto(settings.Phone));
    }
}
