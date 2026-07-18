using backend.Models;

namespace backend.Services;

public class PricingException : Exception
{
    public PricingException(string message) : base(message) { }
}

public static class PricingService
{
    public static decimal ResolveUnitPrice(Product product, ClientType priceType)
    {
        if (priceType == ClientType.Wholesale)
        {
            if (product.WholesalePrice is null)
                throw new PricingException($"El producto '{product.Id}' no tiene precio mayorista");
            return product.WholesalePrice.Value;
        }

        return product.Price;
    }
}
