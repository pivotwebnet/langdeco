using backend.Models;

namespace backend.Dtos;

public record CustomerInput(string Name, string? Contact, string? TaxId, string? Address);

public record CustomerDto(string Name, string? Contact, string? TaxId, string? Address);

public record SaleItemInput(string ProductId, int Quantity);

public record SaleCreateDto(
    int? ClientId, CustomerInput Customer, ClientType ClientType,
    PaymentMethod PaymentMethod, SaleStatus? Status,
    decimal DiscountPercent, decimal TaxRatePercent,
    List<SaleItemInput> Items);

public record SaleUpdateDto(
    int? ClientId, CustomerInput Customer, decimal DiscountPercent, decimal TaxRatePercent,
    List<SaleItemInput> Items);

public record SaleItemDto(string ProductId, string ProductName, int Quantity, decimal UnitPrice);

public record SaleDto(
    int Id, int Number, int? ClientId, CustomerDto Customer, ClientType ClientType,
    SaleStatus Status, PaymentMethod PaymentMethod,
    decimal Subtotal, decimal DiscountPercent, decimal DiscountAmount,
    decimal TaxRatePercent, decimal TaxAmount, decimal Total,
    DateTime CreatedAt,
    List<SaleItemDto> Items);

public record SaleStatusUpdateDto(SaleStatus Status);

public record ProductRankingDto(string ProductId, string ProductName, int QuantitySold, decimal Revenue);

public record LowStockDto(string ProductId, string ProductName, int Stock);

public record SalesSummaryDto(
    decimal Revenue, decimal AverageTicket, int SalesCount,
    decimal RetailRevenue, decimal WholesaleRevenue,
    List<ProductRankingDto> Ranking, List<LowStockDto> LowStock);
