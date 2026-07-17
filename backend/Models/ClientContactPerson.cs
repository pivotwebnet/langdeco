namespace backend.Models;

public class ClientContactPerson
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string? Cell { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public int Order { get; set; }
}
