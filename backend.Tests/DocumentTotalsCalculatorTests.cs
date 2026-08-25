using backend.Models;
using backend.Services;

namespace backend.Tests;

public class DocumentTotalsCalculatorTests
{
    [Fact]
    public void PercentDiscount_ComputesDiscountAndNetAmount()
    {
        var totals = DocumentTotalsCalculator.Compute(
            subtotal: 100_000m, discountType: DiscountType.Percent, discountPercent: 10m, discountFixedAmount: 0m, taxRatePercent: 0m);

        Assert.Equal(100_000m, totals.Subtotal);
        Assert.Equal(10_000m, totals.DiscountAmount);
        Assert.Equal(90_000m, totals.NetAmount);
        Assert.Equal(0m, totals.TaxAmount);
        Assert.Equal(90_000m, totals.Total);
    }

    [Fact]
    public void FixedDiscount_IgnoresPercent_UsesFixedAmountDirectly()
    {
        var totals = DocumentTotalsCalculator.Compute(
            subtotal: 100_000m, discountType: DiscountType.Fixed, discountPercent: 50m, discountFixedAmount: 5_000m, taxRatePercent: 0m);

        // El % no se usa en absoluto cuando el tipo es Fixed — si esto rompiera,
        // se estaría cobrando de más/menos sin que el monto fijo cargado importe.
        Assert.Equal(5_000m, totals.DiscountAmount);
        Assert.Equal(95_000m, totals.NetAmount);
    }

    [Fact]
    public void NegativeFixedAmount_ActsAsRecargo_IncreasesNetAmount()
    {
        var totals = DocumentTotalsCalculator.Compute(
            subtotal: 100_000m, discountType: DiscountType.Fixed, discountPercent: 0m, discountFixedAmount: -5_000m, taxRatePercent: 0m);

        Assert.Equal(-5_000m, totals.DiscountAmount);
        Assert.Equal(105_000m, totals.NetAmount);
    }

    [Fact]
    public void Tax_AppliesOnNetAmount_AfterDiscount()
    {
        var totals = DocumentTotalsCalculator.Compute(
            subtotal: 100_000m, discountType: DiscountType.Percent, discountPercent: 10m, discountFixedAmount: 0m, taxRatePercent: 21m);

        Assert.Equal(90_000m, totals.NetAmount);
        Assert.Equal(18_900m, totals.TaxAmount); // 21% de 90.000, no de 100.000
        Assert.Equal(108_900m, totals.Total);
    }

    [Fact]
    public void ZeroDiscount_TotalEqualsSubtotal()
    {
        var totals = DocumentTotalsCalculator.Compute(
            subtotal: 42_000m, discountType: DiscountType.Percent, discountPercent: 0m, discountFixedAmount: 0m, taxRatePercent: 0m);

        Assert.Equal(42_000m, totals.Total);
    }

    [Fact]
    public void Validate_RejectsFixedDiscountLargerThanSubtotal_NegativeNetAmount()
    {
        var totals = DocumentTotalsCalculator.Compute(
            subtotal: 100m, discountType: DiscountType.Fixed, discountPercent: 0m, discountFixedAmount: 500m, taxRatePercent: 21m);

        var error = DocumentTotalsCalculator.Validate(DiscountType.Fixed, 0m, 21m, totals);

        Assert.NotNull(error);
    }

    [Fact]
    public void Validate_RejectsDiscountPercentOver100()
    {
        var totals = DocumentTotalsCalculator.Compute(
            subtotal: 100_000m, discountType: DiscountType.Percent, discountPercent: 150m, discountFixedAmount: 0m, taxRatePercent: 21m);

        var error = DocumentTotalsCalculator.Validate(DiscountType.Percent, 150m, 21m, totals);

        Assert.NotNull(error);
    }

    [Fact]
    public void Validate_RejectsTaxRateOver100()
    {
        var totals = DocumentTotalsCalculator.Compute(
            subtotal: 100_000m, discountType: DiscountType.Percent, discountPercent: 0m, discountFixedAmount: 0m, taxRatePercent: 500m);

        var error = DocumentTotalsCalculator.Validate(DiscountType.Percent, 0m, 500m, totals);

        Assert.NotNull(error);
    }

    [Fact]
    public void Validate_AllowsNegativePercent_AsRecargoWithinRange()
    {
        var totals = DocumentTotalsCalculator.Compute(
            subtotal: 100_000m, discountType: DiscountType.Percent, discountPercent: -20m, discountFixedAmount: 0m, taxRatePercent: 21m);

        var error = DocumentTotalsCalculator.Validate(DiscountType.Percent, -20m, 21m, totals);

        Assert.Null(error);
    }

    [Fact]
    public void Validate_AcceptsNormalSale()
    {
        var totals = DocumentTotalsCalculator.Compute(
            subtotal: 100_000m, discountType: DiscountType.Percent, discountPercent: 10m, discountFixedAmount: 0m, taxRatePercent: 21m);

        var error = DocumentTotalsCalculator.Validate(DiscountType.Percent, 10m, 21m, totals);

        Assert.Null(error);
    }
}
