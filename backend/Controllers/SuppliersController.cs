using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Attributes;
using backend.Data;
using backend.Dtos;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/suppliers")]
[RequireAdminKey]
public class SuppliersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly SupplierExcelService _excel;

    public SuppliersController(AppDbContext db, SupplierExcelService excel)
    {
        _db = db;
        _excel = excel;
    }

    [HttpGet]
    public async Task<ActionResult<List<SupplierDto>>> GetAll(
        [FromQuery] bool includeInactive = false, [FromQuery] string? search = null)
    {
        var query = _db.Suppliers
            .Include(s => s.ContactPersons)
            .Include(s => s.CustomFields)
            .AsNoTracking()
            .AsQueryable();

        if (!includeInactive) query = query.Where(s => s.Active);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(s => s.CompanyOrFullName.ToLower().Contains(q) || (s.TaxId != null && s.TaxId.Contains(q)));
        }

        var suppliers = await query.OrderBy(s => s.CompanyOrFullName).ToListAsync();
        return Ok(suppliers.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SupplierDto>> GetById(int id)
    {
        var supplier = await _db.Suppliers
            .Include(s => s.ContactPersons)
            .Include(s => s.CustomFields)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        if (supplier is null) return NotFound();
        return Ok(ToDto(supplier));
    }

    [HttpPost]
    public async Task<ActionResult<SupplierDto>> Create(SupplierUpsertDto input)
    {
        var error = ValidateInput(input);
        if (error is not null) return BadRequest(new { error });

        var supplier = new Supplier();
        ApplyFields(supplier, input);
        ApplyContactsAndFields(supplier, input);

        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();

        return Ok(await ReloadDto(supplier.Id));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SupplierDto>> Update(int id, SupplierUpsertDto input)
    {
        var supplier = await _db.Suppliers
            .Include(s => s.ContactPersons)
            .Include(s => s.CustomFields)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (supplier is null) return NotFound();

        var error = ValidateInput(input);
        if (error is not null) return BadRequest(new { error });

        ApplyFields(supplier, input);

        _db.SupplierContactPersons.RemoveRange(supplier.ContactPersons);
        _db.SupplierCustomFields.RemoveRange(supplier.CustomFields);
        supplier.ContactPersons.Clear();
        supplier.CustomFields.Clear();
        ApplyContactsAndFields(supplier, input);

        await _db.SaveChangesAsync();

        return Ok(await ReloadDto(supplier.Id));
    }

    [HttpPost("{id}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier is null) return NotFound();

        supplier.Active = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier is null) return NotFound();

        _db.Suppliers.Remove(supplier);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        var suppliers = await _db.Suppliers
            .Include(s => s.ContactPersons)
            .AsNoTracking()
            .OrderBy(s => s.CompanyOrFullName)
            .ToListAsync();

        var bytes = _excel.Export(suppliers);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "proveedores.xlsx");
    }

    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ImportResultDto>> Import(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Archivo vacío" });

        List<SupplierImportRow> rows;
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

            Supplier? supplier = null;
            if (!string.IsNullOrWhiteSpace(row.TaxId))
                supplier = await _db.Suppliers.Include(s => s.ContactPersons).FirstOrDefaultAsync(s => s.TaxId == row.TaxId);
            if (supplier is null)
                supplier = await _db.Suppliers.Include(s => s.ContactPersons)
                    .FirstOrDefaultAsync(s => s.CompanyOrFullName.ToLower() == row.CompanyOrFullName.ToLower());

            var isNew = supplier is null;
            supplier ??= new Supplier();

            supplier.CompanyOrFullName = row.CompanyOrFullName;
            supplier.FirstName = row.FirstName;
            supplier.LastName = row.LastName;
            supplier.Cell = row.Cell;
            supplier.Phone = row.Phone;
            supplier.Email = row.Email;
            supplier.WebPage = row.WebPage;
            supplier.Address = row.Address;
            supplier.Province = row.Province;
            supplier.PostalCode = row.PostalCode;
            supplier.Locality = row.Locality;
            supplier.Note = row.Note;
            supplier.InitialBalance = row.InitialBalance;
            supplier.PurchasesCategory = row.PurchasesCategory;
            supplier.PurchasesDiscountPercent = row.PurchasesDiscountPercent;
            supplier.NoteInternal = row.NoteInternal;
            supplier.BillingCompanyOrFullName = row.BillingCompanyOrFullName;
            supplier.TaxId = row.TaxId;
            supplier.IvaCondition = Enum.TryParse<IvaCondition>(row.IvaCondition, out var iva) ? iva : IvaCondition.ConsumidorFinal;
            supplier.DefaultReceiptType = Enum.TryParse<DefaultReceiptType>(row.DefaultReceiptType, out var drt) ? drt : DefaultReceiptType.FacturaB;
            supplier.BillingPhone = row.BillingPhone;
            supplier.BillingCell = row.BillingCell;
            supplier.FiscalAddress = row.FiscalAddress;
            supplier.FiscalLocality = row.FiscalLocality;
            supplier.FiscalProvince = row.FiscalProvince;
            supplier.FiscalPostalCode = row.FiscalPostalCode;
            supplier.Active = row.Active;

            if (!string.IsNullOrWhiteSpace(row.ContactName))
            {
                _db.SupplierContactPersons.RemoveRange(supplier.ContactPersons);
                supplier.ContactPersons.Clear();
                supplier.ContactPersons.Add(new SupplierContactPerson
                {
                    Name = row.ContactName, Role = row.ContactRole, Cell = row.ContactCell,
                    Phone = row.ContactPhone, Email = row.ContactEmail, Order = 0,
                });
            }

            if (isNew) { _db.Suppliers.Add(supplier); created++; }
            else updated++;
        }

        await _db.SaveChangesAsync();
        return Ok(new ImportResultDto(created, updated, errors));
    }

    private string? ValidateInput(SupplierUpsertDto input)
    {
        if (string.IsNullOrWhiteSpace(input.CompanyOrFullName))
            return "El nombre es obligatorio";
        if (!string.IsNullOrWhiteSpace(input.TaxId) && !Validation.IsValidCuit(input.TaxId))
            return "El CUIT ingresado no es válido";
        if (input.PurchasesDiscountPercent < 0 || input.PurchasesDiscountPercent > 100)
            return "El descuento general debe estar entre 0 y 100";
        return null;
    }

    private static void ApplyFields(Supplier supplier, SupplierUpsertDto input)
    {
        supplier.CompanyOrFullName = input.CompanyOrFullName;
        supplier.FirstName = input.FirstName;
        supplier.LastName = input.LastName;
        supplier.Cell = input.Cell;
        supplier.Phone = input.Phone;
        supplier.Email = input.Email;
        supplier.WebPage = input.WebPage;
        supplier.Address = input.Address;
        supplier.Province = input.Province;
        supplier.PostalCode = input.PostalCode;
        supplier.Locality = input.Locality;
        supplier.Note = input.Note;
        supplier.InitialBalance = input.InitialBalance;
        supplier.PurchasesCategory = input.PurchasesCategory;
        supplier.PurchasesDiscountPercent = input.PurchasesDiscountPercent;
        supplier.NoteInternal = input.NoteInternal;
        supplier.BillingCompanyOrFullName = input.BillingCompanyOrFullName;
        supplier.TaxId = input.TaxId;
        supplier.IvaCondition = input.IvaCondition;
        supplier.DefaultReceiptType = input.DefaultReceiptType;
        supplier.BillingPhone = input.BillingPhone;
        supplier.BillingCell = input.BillingCell;
        supplier.FiscalAddress = input.FiscalAddress;
        supplier.FiscalLocality = input.FiscalLocality;
        supplier.FiscalProvince = input.FiscalProvince;
        supplier.FiscalPostalCode = input.FiscalPostalCode;
    }

    private static void ApplyContactsAndFields(Supplier supplier, SupplierUpsertDto input)
    {
        for (var i = 0; i < input.ContactPersons.Count; i++)
        {
            var cp = input.ContactPersons[i];
            supplier.ContactPersons.Add(new SupplierContactPerson { Name = cp.Name, Role = cp.Role, Cell = cp.Cell, Phone = cp.Phone, Email = cp.Email, Order = i });
        }

        for (var i = 0; i < input.CustomFields.Count; i++)
        {
            var cf = input.CustomFields[i];
            supplier.CustomFields.Add(new SupplierCustomField { Label = cf.Label, Value = cf.Value, Order = i });
        }
    }

    private async Task<SupplierDto> ReloadDto(int id)
    {
        var supplier = await _db.Suppliers
            .Include(s => s.ContactPersons)
            .Include(s => s.CustomFields)
            .AsNoTracking()
            .FirstAsync(s => s.Id == id);

        return ToDto(supplier);
    }

    private static SupplierDto ToDto(Supplier s) => new(
        s.Id, s.CompanyOrFullName, s.FirstName, s.LastName, s.Cell, s.Phone,
        s.Email, s.WebPage, s.Address, s.Province, s.PostalCode,
        s.Locality, s.Note, s.InitialBalance,
        s.PurchasesCategory, s.PurchasesDiscountPercent, s.NoteInternal,
        s.BillingCompanyOrFullName, s.TaxId, s.IvaCondition, s.DefaultReceiptType,
        s.BillingPhone, s.BillingCell, s.FiscalAddress, s.FiscalLocality,
        s.FiscalProvince, s.FiscalPostalCode, s.Active,
        s.ContactPersons.OrderBy(cp => cp.Order).Select(cp => new ContactPersonDto(cp.Name, cp.Role, cp.Cell, cp.Phone, cp.Email)).ToList(),
        s.CustomFields.OrderBy(cf => cf.Order).Select(cf => new CustomFieldDto(cf.Label, cf.Value)).ToList());
}
