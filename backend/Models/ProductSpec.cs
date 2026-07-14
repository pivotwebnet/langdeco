namespace backend.Models;

public class ProductSpec
{
    public int Id { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public Product? Product { get; set; }

    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public int Order { get; set; }
}
