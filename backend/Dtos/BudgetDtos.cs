using backend.Models;

namespace backend.Dtos;

public record BudgetItemInput(string ProductId, int Quantity, ClientType PriceType = ClientType.Retail);

public record BudgetCreateDto(
    int? ClientId, CustomerInput Customer, ClientType ClientType,
    DateTime? ValidUntil,
    DiscountType DiscountType, decimal DiscountPercent, decimal DiscountFixedAmount, decimal TaxRatePercent,
    List<BudgetItemInput> Items);

public record BudgetUpdateDto(
    int? ClientId, CustomerInput Customer, DateTime? ValidUntil,
    DiscountType DiscountType, decimal DiscountPercent, decimal DiscountFixedAmount, decimal TaxRatePercent,
    List<BudgetItemInput> Items);

public record BudgetItemDto(string ProductId, string ProductName, int Quantity, decimal UnitPrice, ClientType PriceType);

public record BudgetDto(
    int Id, int Number, int? ClientId, CustomerDto Customer, ClientType ClientType,
    BudgetStatus Status, DateTime? ValidUntil,
    decimal Subtotal, DiscountType DiscountType, decimal DiscountPercent, decimal DiscountFixedAmount, decimal DiscountAmount,
    decimal TaxRatePercent, decimal TaxAmount, decimal Total,
    DateTime CreatedAt, int? ConvertedSaleId, DateTime? ConvertedAt,
    List<BudgetItemDto> Items);

public record BudgetStatusUpdateDto(BudgetStatus Status);

public record BudgetConvertDto(PaymentMethod PaymentMethod);
