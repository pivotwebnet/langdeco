namespace backend.Models;

// Un cobro parcial o total registrado sobre una Sale, vía la ventana "Cobranza" del admin.
// Una Sale puede tener varios, combinando medios de pago distintos y en momentos distintos.
public class SalePayment
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public Sale Sale { get; set; } = null!;
    public decimal Amount { get; set; }
    public int PaymentMethodOptionId { get; set; }
    public PaymentMethodOption PaymentMethodOption { get; set; } = null!;
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
}
