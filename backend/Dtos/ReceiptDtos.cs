namespace backend.Dtos;

public record ReceiptItemData(
    string Code,
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal BonifPercent,
    decimal Subtotal,
    decimal TaxRatePercent,
    decimal SubtotalWithTax);

public record ReceiptData(
    string DocumentTitle,
    int Number,
    DateTime Date,
    DateTime? ValidUntil,
    string CustomerName,
    string? CustomerTaxId,
    string? CustomerAddress,
    string? CustomerContact,
    List<ReceiptItemData> Items,
    decimal Subtotal,
    decimal DiscountPercent,
    decimal DiscountAmount,
    decimal TaxRatePercent,
    decimal TaxAmount,
    decimal NetExemptAmount,
    decimal Total);
