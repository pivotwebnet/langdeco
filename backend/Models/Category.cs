namespace backend.Models;

public class Category
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool Active { get; set; } = true;

    public List<Product> Products { get; set; } = new();
}
