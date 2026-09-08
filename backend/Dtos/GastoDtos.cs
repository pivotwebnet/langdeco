using backend.Models;

namespace backend.Dtos;

public record GastoUpsertDto(
    DateTime Date, GastoCategory Category, string Description, decimal Amount,
    PaymentMethod PaymentMethod, int? SupplierId);

public record GastoDto(
    int Id, int Number, DateTime Date, GastoCategory Category, string Description, decimal Amount,
    PaymentMethod PaymentMethod, int? SupplierId, string? SupplierName, DateTime CreatedAt);
