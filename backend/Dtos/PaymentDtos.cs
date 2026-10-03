namespace backend.Dtos;

public record PaymentMethodOptionDto(int Id, string Name, bool Active);

public record PaymentMethodOptionUpsertDto(string Name, bool Active = true);

public record SalePaymentDto(int Id, decimal Amount, int PaymentMethodOptionId, string PaymentMethodOptionName, DateTime PaidAt);

public record SalePaymentCreateDto(decimal Amount, int PaymentMethodOptionId);
