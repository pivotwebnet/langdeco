using backend.Models;

namespace backend.Dtos;

public record ContactPersonInput(string Name, string? Role, string? Cell, string? Phone, string? Email);

public record ContactPersonDto(string Name, string? Role, string? Cell, string? Phone, string? Email);

public record CustomFieldInput(string Label, string Value);

public record CustomFieldDto(string Label, string Value);

public record ClientUpsertDto(
    string CompanyOrFullName, string? FirstName, string? LastName, string? Cell, string? Phone,
    string? Email, string? WebPage, string? Address, string? Province, string? PostalCode,
    string? Locality, string? Note, decimal InitialBalance,
    string? NicknameML, string? SalesCategory, decimal SalesDiscountPercent, string? NoteForClient,
    string BillingCompanyOrFullName, string? TaxId, IvaCondition IvaCondition, DefaultReceiptType DefaultReceiptType,
    string? BillingPhone, string? BillingCell, string? FiscalAddress, string? FiscalLocality,
    string? FiscalProvince, string? FiscalPostalCode,
    List<ContactPersonInput> ContactPersons, List<CustomFieldInput> CustomFields);

public record ClientDto(
    int Id, string CompanyOrFullName, string? FirstName, string? LastName, string? Cell, string? Phone,
    string? Email, string? WebPage, string? Address, string? Province, string? PostalCode,
    string? Locality, string? Note, decimal InitialBalance,
    string? NicknameML, string? SalesCategory, decimal SalesDiscountPercent, string? NoteForClient,
    string BillingCompanyOrFullName, string? TaxId, IvaCondition IvaCondition, DefaultReceiptType DefaultReceiptType,
    string? BillingPhone, string? BillingCell, string? FiscalAddress, string? FiscalLocality,
    string? FiscalProvince, string? FiscalPostalCode, bool Active,
    List<ContactPersonDto> ContactPersons, List<CustomFieldDto> CustomFields);
