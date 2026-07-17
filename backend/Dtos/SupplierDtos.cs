using backend.Models;

namespace backend.Dtos;

public record SupplierUpsertDto(
    string CompanyOrFullName, string? FirstName, string? LastName, string? Cell, string? Phone,
    string? Email, string? WebPage, string? Address, string? Province, string? PostalCode,
    string? Locality, string? Note, decimal InitialBalance,
    string? PurchasesCategory, decimal PurchasesDiscountPercent, string? NoteInternal,
    string BillingCompanyOrFullName, string? TaxId, IvaCondition IvaCondition, DefaultReceiptType DefaultReceiptType,
    string? BillingPhone, string? BillingCell, string? FiscalAddress, string? FiscalLocality,
    string? FiscalProvince, string? FiscalPostalCode,
    List<ContactPersonInput> ContactPersons, List<CustomFieldInput> CustomFields);

public record SupplierDto(
    int Id, string CompanyOrFullName, string? FirstName, string? LastName, string? Cell, string? Phone,
    string? Email, string? WebPage, string? Address, string? Province, string? PostalCode,
    string? Locality, string? Note, decimal InitialBalance,
    string? PurchasesCategory, decimal PurchasesDiscountPercent, string? NoteInternal,
    string BillingCompanyOrFullName, string? TaxId, IvaCondition IvaCondition, DefaultReceiptType DefaultReceiptType,
    string? BillingPhone, string? BillingCell, string? FiscalAddress, string? FiscalLocality,
    string? FiscalProvince, string? FiscalPostalCode, bool Active,
    List<ContactPersonDto> ContactPersons, List<CustomFieldDto> CustomFields);
