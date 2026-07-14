namespace backend.Models;

public class ProductImage
{
    public int Id { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public Product? Product { get; set; }

    public string Url { get; set; } = string.Empty;
    public int Order { get; set; }
}
