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
    public List<string> RoomTags { get; set; } = new();

    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public int Stock { get; set; }

    public string? Note { get; set; }
    public string? Aspect { get; set; }
    public bool Active { get; set; } = true;
    public bool Featured { get; set; }

    public List<ProductSpec> Specs { get; set; } = new();
    public List<ProductImage> Images { get; set; } = new();

    // Recorte sin fondo (PNG con canal alfa) — la única imagen que usa el Visualizador
    // de espacios para superponer el producto sobre la foto del ambiente.
    public string? CutoutImageUrl { get; set; }
}
