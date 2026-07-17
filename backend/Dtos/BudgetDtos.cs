using backend.Models;

namespace backend.Dtos;

public record BudgetItemInput(string ProductId, int Quantity);

public record BudgetCreateDto(
    int? ClientId, CustomerInput Customer, ClientType ClientType,
    DateTime? ValidUntil,
    decimal DiscountPercent, decimal TaxRatePercent,
    List<BudgetItemInput> Items);

public record BudgetUpdateDto(
    int? ClientId, CustomerInput Customer, DateTime? ValidUntil,
    decimal DiscountPercent, decimal TaxRatePercent,
    List<BudgetItemInput> Items);

public record BudgetItemDto(string ProductId, string ProductName, int Quantity, decimal UnitPrice);

public record BudgetDto(
    int Id, int Number, int? ClientId, CustomerDto Customer, ClientType ClientType,
    BudgetStatus Status, DateTime? ValidUntil,
    decimal Subtotal, decimal DiscountPercent, decimal DiscountAmount,
    decimal TaxRatePercent, decimal TaxAmount, decimal Total,
    DateTime CreatedAt,
    List<BudgetItemDto> Items);

public record BudgetStatusUpdateDto(BudgetStatus Status);
