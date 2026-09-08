namespace backend.Models;

public class Product
{
    public string Id { get; set; } = string.Empty;
    // A diferencia de Id (slug interno, autogenerado, nunca lo edita el admin), este es
    // el código/SKU que el admin elige libremente, sin restricción de formato. Único si
    // se completa (ver índice en AppDbContext), pero puede quedar vacío.
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public Category? Category { get; set; }

    // Opcional — el alta manual la sigue pidiendo por convención, pero la importación
    // masiva desde Excel no trae este dato y no puede bloquear la carga.
    public string? Material { get; set; }
    public List<string> RoomTags { get; set; } = new();

    public decimal Price { get; set; }
    public decimal? CardPrice { get; set; }
    public decimal? OriginalPrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public int Stock { get; set; }

    // Datos de compra — informativos, no participan del cálculo de precio de venta.
    public decimal? CostPrice { get; set; }
    public decimal? IvaPercent { get; set; }
    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }

    // Cantidad de cuotas sin interés para el badge del sitio público — null/0 lo oculta.
    public int? Installments { get; set; }

    public string? Note { get; set; }
    public bool Active { get; set; } = true;
    public bool Featured { get; set; }

    public List<ProductSpec> Specs { get; set; } = new();
    public List<ProductImage> Images { get; set; } = new();

    // Recorte sin fondo (PNG con canal alfa) — la única imagen que usa el Visualizador
    // de espacios para superponer el producto sobre la foto del ambiente.
    public string? CutoutImageUrl { get; set; }
}
