namespace backend.Models;

public enum DocumentType
{
    Sale,
    Budget
}

public class DocumentCounter
{
    public DocumentType Type { get; set; }
    public int LastNumber { get; set; }
}
