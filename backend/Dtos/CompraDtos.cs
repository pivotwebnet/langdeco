using backend.Models;

namespace backend.Dtos;

public record CompraItemInput(string ProductId, int Quantity, decimal UnitCost);

public record CompraCreateDto(
    int SupplierId, PaymentMethod PaymentMethod, CompraStatus? Status, string? Note,
    DiscountType DiscountType, decimal DiscountPercent, decimal DiscountFixedAmount, decimal TaxRatePercent,
    List<CompraItemInput> Items);

public record CompraUpdateDto(
    int SupplierId, PaymentMethod PaymentMethod, string? Note,
    DiscountType DiscountType, decimal DiscountPercent, decimal DiscountFixedAmount, decimal TaxRatePercent,
    List<CompraItemInput> Items);

public record CompraItemDto(string ProductId, string ProductName, int Quantity, decimal UnitCost);

public record CompraDto(
    int Id, int Number, int SupplierId, string SupplierName, CompraStatus Status, PaymentMethod PaymentMethod,
    decimal Subtotal, DiscountType DiscountType, decimal DiscountPercent, decimal DiscountFixedAmount, decimal DiscountAmount,
    decimal TaxRatePercent, decimal TaxAmount, decimal Total, string? Note,
    DateTime CreatedAt, DateTime? ReceivedAt,
    List<CompraItemDto> Items);

public record CompraStatusUpdateDto(CompraStatus Status);
