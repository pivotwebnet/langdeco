namespace backend.Models;

public enum ClientType
{
    Retail,
    Wholesale
}

public enum SaleStatus
{
    Pending,
    Paid,
    Cancelled
}

public enum PaymentMethod
{
    Transfer,
    Cash,
    Other
}

public class Sale
{
    public int Id { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? ClientContact { get; set; }
    public ClientType ClientType { get; set; }
    public SaleStatus Status { get; set; } = SaleStatus.Pending;
    public PaymentMethod PaymentMethod { get; set; }
    public decimal Total { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<SaleItem> Items { get; set; } = new();
}
