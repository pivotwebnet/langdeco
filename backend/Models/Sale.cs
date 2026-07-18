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
    public int Number { get; set; }
    public int? ClientId { get; set; }
    public Client? Client { get; set; }
    public CustomerInfo Customer { get; set; } = new();
    public ClientType ClientType { get; set; }
    public SaleStatus Status { get; set; } = SaleStatus.Pending;
    public PaymentMethod PaymentMethod { get; set; }

    public decimal Subtotal { get; set; }
    public DiscountType DiscountType { get; set; } = DiscountType.Percent;
    public decimal DiscountPercent { get; set; }
    public decimal DiscountFixedAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxRatePercent { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? BudgetId { get; set; }
    public Budget? Budget { get; set; }

    public List<SaleItem> Items { get; set; } = new();
}
