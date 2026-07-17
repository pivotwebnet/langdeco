namespace backend.Models;

public class SupplierContactPerson
{
    public int Id { get; set; }
    public int SupplierId { get; set; }
    public Supplier? Supplier { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string? Cell { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public int Order { get; set; }
}
