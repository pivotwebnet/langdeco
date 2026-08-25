using backend.Models;

namespace backend.Services;

public record DocumentTotals(decimal Subtotal, decimal DiscountAmount, decimal NetAmount, decimal TaxAmount, decimal Total);

public static class DocumentTotalsCalculator
{
    public static DocumentTotals Compute(
        decimal subtotal, DiscountType discountType, decimal discountPercent, decimal discountFixedAmount, decimal taxRatePercent)
    {
        var discountAmount = discountType == DiscountType.Fixed
            ? discountFixedAmount
            : Math.Round(subtotal * discountPercent / 100m, 2);

        var netAmount = subtotal - discountAmount;
        var taxAmount = Math.Round(netAmount * taxRatePercent / 100m, 2);
        var total = netAmount + taxAmount;
        return new DocumentTotals(subtotal, discountAmount, netAmount, taxAmount, total);
    }

    // Validación de rango sobre los mismos inputs que Compute — evita totales negativos (ej.
    // un descuento fijo mayor al subtotal) y valores fuera del rango de precisión de las
    // columnas (precision(5,2), overflow en Postgres si se guardan sin chequear).
    public static string? Validate(DiscountType discountType, decimal discountPercent, decimal taxRatePercent, DocumentTotals totals)
    {
        if (taxRatePercent < 0 || taxRatePercent > 100)
            return "La alícuota de IVA debe estar entre 0 y 100";

        if (discountType == DiscountType.Percent && (discountPercent < -100 || discountPercent > 100))
            return "El descuento/recargo porcentual debe estar entre -100 y 100";

        if (totals.NetAmount < 0)
            return "El descuento no puede superar el subtotal";

        return null;
    }
}
