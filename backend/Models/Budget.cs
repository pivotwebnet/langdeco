namespace backend.Models;

public enum BudgetStatus
{
    Open,
    Converted,
    Expired,
    Cancelled
}

public class Budget
{
    public int Id { get; set; }
    public int Number { get; set; }
    public int? ClientId { get; set; }
    public Client? Client { get; set; }
    public CustomerInfo Customer { get; set; } = new();
    public ClientType ClientType { get; set; }
    public BudgetStatus Status { get; set; } = BudgetStatus.Open;

    public decimal Subtotal { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxRatePercent { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ValidUntil { get; set; }

    public List<BudgetItem> Items { get; set; } = new();
}
