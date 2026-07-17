namespace backend.Models;

public class CustomerInfo
{
    public string Name { get; set; } = string.Empty;
    public string? Contact { get; set; }
    public string? TaxId { get; set; }
    public string? Address { get; set; }
}
