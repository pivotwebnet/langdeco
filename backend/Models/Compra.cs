namespace backend.Models;

public enum CompraStatus
{
    Pending,
    Received,
    Cancelled
}

public class Compra
{
    public int Id { get; set; }
    public int Number { get; set; }

    public int SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    // Snapshot al momento de crear la compra — mismo criterio que ProductName en
    // SaleItem/BudgetItem: si el proveedor se renombra después, el histórico no cambia.
    public string SupplierName { get; set; } = string.Empty;

    public CompraStatus Status { get; set; } = CompraStatus.Pending;
    public PaymentMethod PaymentMethod { get; set; }

    public decimal Subtotal { get; set; }
    public DiscountType DiscountType { get; set; } = DiscountType.Percent;
    public decimal DiscountPercent { get; set; }
    public decimal DiscountFixedAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxRatePercent { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReceivedAt { get; set; }

    public List<CompraItem> Items { get; set; } = new();
}
