namespace backend.Models;

// Catálogo administrable de medios de cobro para Cobranza (Banco Galicia, Banco Santander,
// Mercado Pago, Caja General, + lo que el admin agregue) — independiente del enum PaymentMethod
// (Transfer/Cash/Other) que ya usan Sale/Gasto para su propio campo de "medio de pago" simple.
public class PaymentMethodOption
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Active { get; set; } = true;
}
