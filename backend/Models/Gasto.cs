namespace backend.Models;

public enum GastoCategory
{
    Alquiler,
    Servicios,
    Sueldos,
    Impuestos,
    Mantenimiento,
    Insumos,
    Otro
}

public class Gasto
{
    public int Id { get; set; }
    public int Number { get; set; }

    public DateTime Date { get; set; }
    public GastoCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }

    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
