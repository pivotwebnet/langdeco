namespace backend.Dtos;

public record ImportRowError(int Row, string Error);

public record ImportResultDto(int Created, int Updated, List<ImportRowError> Errors);

public record ClientImportRow(
    int RowNumber,
    string CompanyOrFullName, string? FirstName, string? LastName, string? Cell, string? Phone,
    string? Email, string? WebPage, string? Address, string? Province, string? PostalCode,
    string? Locality, string? Note, decimal InitialBalance,
    string? NicknameML, string? SalesCategory, decimal SalesDiscountPercent, string? NoteForClient,
    string BillingCompanyOrFullName, string? TaxId, string? IvaCondition, string? DefaultReceiptType,
    string? BillingPhone, string? BillingCell, string? FiscalAddress, string? FiscalLocality,
    string? FiscalProvince, string? FiscalPostalCode,
    string? ContactName, string? ContactRole, string? ContactCell, string? ContactPhone, string? ContactEmail,
    bool Active);

public record SupplierImportRow(
    int RowNumber,
    string CompanyOrFullName, string? FirstName, string? LastName, string? Cell, string? Phone,
    string? Email, string? WebPage, string? Address, string? Province, string? PostalCode,
    string? Locality, string? Note, decimal InitialBalance,
    string? PurchasesCategory, decimal PurchasesDiscountPercent, string? NoteInternal,
    string BillingCompanyOrFullName, string? TaxId, string? IvaCondition, string? DefaultReceiptType,
    string? BillingPhone, string? BillingCell, string? FiscalAddress, string? FiscalLocality,
    string? FiscalProvince, string? FiscalPostalCode,
    string? ContactName, string? ContactRole, string? ContactCell, string? ContactPhone, string? ContactEmail,
    bool Active);
