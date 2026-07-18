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
}
