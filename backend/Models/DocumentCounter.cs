namespace backend.Models;

public enum DocumentType
{
    Sale,
    Budget,
    Compra,
    Gasto
}

public class DocumentCounter
{
    public DocumentType Type { get; set; }
    public int LastNumber { get; set; }
}
