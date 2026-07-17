using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/clients")]
[RequireAdminKey]
public class ClientsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ClientExcelService _excel;

    public ClientsController(AppDbContext db, ClientExcelService excel)
    {
        _db = db;
        _excel = excel;
    }

    [HttpGet]
    public async Task<ActionResult<List<ClientDto>>> GetAll(
        [FromQuery] bool includeInactive = false, [FromQuery] string? search = null)
    {
        var query = _db.Clients
            .Include(c => c.ContactPersons)
            .Include(c => c.CustomFields)
            .AsNoTracking()
            .AsQueryable();

        if (!includeInactive) query = query.Where(c => c.Active);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c => c.CompanyOrFullName.ToLower().Contains(s) || (c.TaxId != null && c.TaxId.Contains(s)));
        }

        var clients = await query.OrderBy(c => c.CompanyOrFullName).ToListAsync();
        return Ok(clients.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClientDto>> GetById(int id)
    {
        var client = await _db.Clients
            .Include(c => c.ContactPersons)
            .Include(c => c.CustomFields)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (client is null) return NotFound();
        return Ok(ToDto(client));
    }

    [HttpPost]
    public async Task<ActionResult<ClientDto>> Create(ClientUpsertDto input)
    {
        var error = ValidateInput(input);
        if (error is not null) return BadRequest(new { error });

        var client = new Client();
        ApplyFields(client, input);
        ApplyContactsAndFields(client, input);

        _db.Clients.Add(client);
        await _db.SaveChangesAsync();

        return Ok(await ReloadDto(client.Id));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ClientDto>> Update(int id, ClientUpsertDto input)
    {
        var client = await _db.Clients
            .Include(c => c.ContactPersons)
            .Include(c => c.CustomFields)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (client is null) return NotFound();

        var error = ValidateInput(input);
        if (error is not null) return BadRequest(new { error });

        ApplyFields(client, input);

        _db.ClientContactPersons.RemoveRange(client.ContactPersons);
        _db.ClientCustomFields.RemoveRange(client.CustomFields);
        client.ContactPersons.Clear();
        client.CustomFields.Clear();
        ApplyContactsAndFields(client, input);

        await _db.SaveChangesAsync();

        return Ok(await ReloadDto(client.Id));
    }

    [HttpPost("{id}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        var client = await _db.Clients.FindAsync(id);
        if (client is null) return NotFound();

        client.Active = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var client = await _db.Clients.FindAsync(id);
        if (client is null) return NotFound();

        var isReferenced = await _db.Sales.AnyAsync(s => s.ClientId == id) || await _db.Budgets.AnyAsync(b => b.ClientId == id);
        if (isReferenced)
        {
            client.Active = false;
            await _db.SaveChangesAsync();
            return Ok(new { deactivated = true });
        }

        _db.Clients.Remove(client);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        var clients = await _db.Clients
            .Include(c => c.ContactPersons)
            .AsNoTracking()
            .OrderBy(c => c.CompanyOrFullName)
            .ToListAsync();

        var bytes = _excel.Export(clients);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "clientes.xlsx");
    }

    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ImportResultDto>> Import(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Archivo vacío" });

        List<ClientImportRow> rows;
        using (var stream = file.OpenReadStream())
            rows = _excel.ParseImport(stream);

        var created = 0;
        var updated = 0;
        var errors = new List<ImportRowError>();

        foreach (var row in rows)
        {
            if (string.IsNullOrWhiteSpace(row.CompanyOrFullName))
            {
                errors.Add(new ImportRowError(row.RowNumber, "Falta el nombre"));
                continue;
            }

            if (!string.IsNullOrWhiteSpace(row.TaxId) && !Validation.IsValidCuit(row.TaxId))
            {
                errors.Add(new ImportRowError(row.RowNumber, "CUIT inválido"));
                continue;
            }

            Client? client = null;
            if (!string.IsNullOrWhiteSpace(row.TaxId))
                client = await _db.Clients.Include(c => c.ContactPersons).FirstOrDefaultAsync(c => c.TaxId == row.TaxId);
            if (client is null)
                client = await _db.Clients.Include(c => c.ContactPersons)
                    .FirstOrDefaultAsync(c => c.CompanyOrFullName.ToLower() == row.CompanyOrFullName.ToLower());

            var isNew = client is null;
            client ??= new Client();

            client.CompanyOrFullName = row.CompanyOrFullName;
            client.FirstName = row.FirstName;
            client.LastName = row.LastName;
            client.Cell = row.Cell;
            client.Phone = row.Phone;
            client.Email = row.Email;
            client.WebPage = row.WebPage;
            client.Address = row.Address;
            client.Province = row.Province;
            client.PostalCode = row.PostalCode;
            client.Locality = row.Locality;
            client.Note = row.Note;
            client.InitialBalance = row.InitialBalance;
            client.NicknameML = row.NicknameML;
            client.SalesCategory = row.SalesCategory;
            client.SalesDiscountPercent = row.SalesDiscountPercent;
            client.NoteForClient = row.NoteForClient;
            client.BillingCompanyOrFullName = row.BillingCompanyOrFullName;
            client.TaxId = row.TaxId;
            client.IvaCondition = Enum.TryParse<IvaCondition>(row.IvaCondition, out var iva) ? iva : IvaCondition.ConsumidorFinal;
            client.DefaultReceiptType = Enum.TryParse<DefaultReceiptType>(row.DefaultReceiptType, out var drt) ? drt : DefaultReceiptType.FacturaB;
            client.BillingPhone = row.BillingPhone;
            client.BillingCell = row.BillingCell;
            client.FiscalAddress = row.FiscalAddress;
            client.FiscalLocality = row.FiscalLocality;
            client.FiscalProvince = row.FiscalProvince;
            client.FiscalPostalCode = row.FiscalPostalCode;
            client.Active = row.Active;

            if (!string.IsNullOrWhiteSpace(row.ContactName))
            {
                _db.ClientContactPersons.RemoveRange(client.ContactPersons);
                client.ContactPersons.Clear();
                client.ContactPersons.Add(new ClientContactPerson
                {
                    Name = row.ContactName, Role = row.ContactRole, Cell = row.ContactCell,
                    Phone = row.ContactPhone, Email = row.ContactEmail, Order = 0,
                });
            }

            if (isNew) { _db.Clients.Add(client); created++; }
            else updated++;
        }

        await _db.SaveChangesAsync();
        return Ok(new ImportResultDto(created, updated, errors));
    }

    private string? ValidateInput(ClientUpsertDto input)
    {
        if (string.IsNullOrWhiteSpace(input.CompanyOrFullName))
            return "El nombre es obligatorio";
        if (!string.IsNullOrWhiteSpace(input.TaxId) && !Validation.IsValidCuit(input.TaxId))
            return "El CUIT ingresado no es válido";
        if (input.SalesDiscountPercent < 0 || input.SalesDiscountPercent > 100)
            return "El descuento general debe estar entre 0 y 100";
        return null;
    }

    private static void ApplyFields(Client client, ClientUpsertDto input)
    {
        client.CompanyOrFullName = input.CompanyOrFullName;
        client.FirstName = input.FirstName;
        client.LastName = input.LastName;
        client.Cell = input.Cell;
        client.Phone = input.Phone;
        client.Email = input.Email;
        client.WebPage = input.WebPage;
        client.Address = input.Address;
        client.Province = input.Province;
        client.PostalCode = input.PostalCode;
        client.Locality = input.Locality;
        client.Note = input.Note;
        client.InitialBalance = input.InitialBalance;
        client.NicknameML = input.NicknameML;
        client.SalesCategory = input.SalesCategory;
        client.SalesDiscountPercent = input.SalesDiscountPercent;
        client.NoteForClient = input.NoteForClient;
        client.BillingCompanyOrFullName = input.BillingCompanyOrFullName;
        client.TaxId = input.TaxId;
        client.IvaCondition = input.IvaCondition;
        client.DefaultReceiptType = input.DefaultReceiptType;
        client.BillingPhone = input.BillingPhone;
        client.BillingCell = input.BillingCell;
        client.FiscalAddress = input.FiscalAddress;
        client.FiscalLocality = input.FiscalLocality;
        client.FiscalProvince = input.FiscalProvince;
        client.FiscalPostalCode = input.FiscalPostalCode;
    }

    private static void ApplyContactsAndFields(Client client, ClientUpsertDto input)
    {
        for (var i = 0; i < input.ContactPersons.Count; i++)
        {
            var cp = input.ContactPersons[i];
            client.ContactPersons.Add(new ClientContactPerson { Name = cp.Name, Role = cp.Role, Cell = cp.Cell, Phone = cp.Phone, Email = cp.Email, Order = i });
        }

        for (var i = 0; i < input.CustomFields.Count; i++)
        {
            var cf = input.CustomFields[i];
            client.CustomFields.Add(new ClientCustomField { Label = cf.Label, Value = cf.Value, Order = i });
        }
    }

    private async Task<ClientDto> ReloadDto(int id)
    {
        var client = await _db.Clients
            .Include(c => c.ContactPersons)
            .Include(c => c.CustomFields)
            .AsNoTracking()
            .FirstAsync(c => c.Id == id);

        return ToDto(client);
    }

    private static ClientDto ToDto(Client c) => new(
        c.Id, c.CompanyOrFullName, c.FirstName, c.LastName, c.Cell, c.Phone,
        c.Email, c.WebPage, c.Address, c.Province, c.PostalCode,
        c.Locality, c.Note, c.InitialBalance,
        c.NicknameML, c.SalesCategory, c.SalesDiscountPercent, c.NoteForClient,
        c.BillingCompanyOrFullName, c.TaxId, c.IvaCondition, c.DefaultReceiptType,
        c.BillingPhone, c.BillingCell, c.FiscalAddress, c.FiscalLocality,
        c.FiscalProvince, c.FiscalPostalCode, c.Active,
        c.ContactPersons.OrderBy(cp => cp.Order).Select(cp => new ContactPersonDto(cp.Name, cp.Role, cp.Cell, cp.Phone, cp.Email)).ToList(),
        c.CustomFields.OrderBy(cf => cf.Order).Select(cf => new CustomFieldDto(cf.Label, cf.Value)).ToList());
}
