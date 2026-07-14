namespace backend.Models;

public class Product
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public Category? Category { get; set; }

    public string? Tag { get; set; }
    public string Material { get; set; } = string.Empty;
    public string? Origin { get; set; }

    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public int Stock { get; set; }

    public string? Note { get; set; }
    public string? Aspect { get; set; }
    public bool Active { get; set; } = true;
    public bool Featured { get; set; }

    public List<ProductSpec> Specs { get; set; } = new();
    public List<ProductImage> Images { get; set; } = new();
}
