namespace backend.Models;

public class BudgetItem
{
    public int Id { get; set; }
    public int BudgetId { get; set; }
    public Budget? Budget { get; set; }

    public string ProductId { get; set; } = string.Empty;
    public Product? Product { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
