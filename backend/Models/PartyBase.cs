namespace backend.Models;

public enum IvaCondition
{
    ResponsableInscripto,
    Monotributo,
    Exento,
    ConsumidorFinal,
    NoCategorizado
}

public enum DefaultReceiptType
{
    FacturaA,
    FacturaB,
    FacturaC,
    Recibo,
    Presupuesto
}

public abstract class PartyBase
{
    public int Id { get; set; }

    public string CompanyOrFullName { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Cell { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? WebPage { get; set; }
    public string? Address { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string? Locality { get; set; }
    public string? Note { get; set; }
    public decimal InitialBalance { get; set; }

    public string BillingCompanyOrFullName { get; set; } = string.Empty;
    public string? TaxId { get; set; }
    public IvaCondition IvaCondition { get; set; } = IvaCondition.ConsumidorFinal;
    public DefaultReceiptType DefaultReceiptType { get; set; } = DefaultReceiptType.FacturaB;
    public string? BillingPhone { get; set; }
    public string? BillingCell { get; set; }
    public string? FiscalAddress { get; set; }
    public string? FiscalLocality { get; set; }
    public string? FiscalProvince { get; set; }
    public string? FiscalPostalCode { get; set; }

    public bool Active { get; set; } = true;
}
