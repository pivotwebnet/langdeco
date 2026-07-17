namespace backend.Models;

public class SupplierCustomField
{
    public int Id { get; set; }
    public int SupplierId { get; set; }
    public Supplier? Supplier { get; set; }

    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public int Order { get; set; }
}
