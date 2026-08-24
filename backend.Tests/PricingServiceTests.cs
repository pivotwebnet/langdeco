using backend.Models;
using backend.Services;

namespace backend.Tests;

public class PricingServiceTests
{
    private static Product MakeProduct(decimal price, decimal? wholesalePrice) => new()
    {
        Id = "p1",
        Name = "Sofá",
        Material = "Lino",
        Price = price,
        WholesalePrice = wholesalePrice,
    };

    [Fact]
    public void Retail_UsesRegularPrice_EvenIfWholesaleExists()
    {
        var product = MakeProduct(price: 100_000m, wholesalePrice: 70_000m);

        var result = PricingService.ResolveUnitPrice(product, ClientType.Retail);

        Assert.Equal(100_000m, result);
    }

    [Fact]
    public void Wholesale_UsesWholesalePrice_WhenSet()
    {
        var product = MakeProduct(price: 100_000m, wholesalePrice: 70_000m);

        var result = PricingService.ResolveUnitPrice(product, ClientType.Wholesale);

        Assert.Equal(70_000m, result);
    }

    [Fact]
    public void Wholesale_Throws_WhenProductHasNoWholesalePrice()
    {
        var product = MakeProduct(price: 100_000m, wholesalePrice: null);

        var ex = Assert.Throws<PricingException>(() => PricingService.ResolveUnitPrice(product, ClientType.Wholesale));
        Assert.Contains(product.Id, ex.Message);
    }
}
