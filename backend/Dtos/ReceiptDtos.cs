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

public record ReceiptPaymentData(string Method, DateTime PaidAt, decimal Amount);

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
    decimal NetAmount,
    decimal Total,
    List<ReceiptPaymentData> Payments,
    decimal AmountDue);
