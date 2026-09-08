namespace backend.Models;

public class CompraItem
{
    public int Id { get; set; }
    public int CompraId { get; set; }
    public Compra? Compra { get; set; }

    public string ProductId { get; set; } = string.Empty;
    public Product? Product { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
}
