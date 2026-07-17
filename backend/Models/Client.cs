namespace backend.Models;

public class Client : PartyBase
{
    public string? NicknameML { get; set; }
    public string? SalesCategory { get; set; }
    public decimal SalesDiscountPercent { get; set; }
    public string? NoteForClient { get; set; }

    public List<ClientContactPerson> ContactPersons { get; set; } = new();
    public List<ClientCustomField> CustomFields { get; set; } = new();
}
