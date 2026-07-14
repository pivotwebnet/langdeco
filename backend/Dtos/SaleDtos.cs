using backend.Models;

namespace backend.Dtos;

public record SaleItemInput(string ProductId, int Quantity);

public record SaleCreateDto(
    string ClientName, string? ClientContact, ClientType ClientType,
    PaymentMethod PaymentMethod, SaleStatus? Status, List<SaleItemInput> Items);

public record SaleItemDto(string ProductId, string ProductName, int Quantity, decimal UnitPrice);

public record SaleDto(
    int Id, string ClientName, string? ClientContact, ClientType ClientType,
    SaleStatus Status, PaymentMethod PaymentMethod, decimal Total, DateTime CreatedAt,
    List<SaleItemDto> Items);

public record SaleStatusUpdateDto(SaleStatus Status);

public record ProductRankingDto(string ProductId, string ProductName, int QuantitySold, decimal Revenue);

public record LowStockDto(string ProductId, string ProductName, int Stock);

public record SalesSummaryDto(
    decimal Revenue, decimal AverageTicket, int SalesCount,
    decimal RetailRevenue, decimal WholesaleRevenue,
    List<ProductRankingDto> Ranking, List<LowStockDto> LowStock);
