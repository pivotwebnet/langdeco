namespace backend.Models;

public class Supplier : PartyBase
{
    public string? PurchasesCategory { get; set; }
    public decimal PurchasesDiscountPercent { get; set; }
    public string? NoteInternal { get; set; }

    public List<SupplierContactPerson> ContactPersons { get; set; } = new();
    public List<SupplierCustomField> CustomFields { get; set; } = new();
}
