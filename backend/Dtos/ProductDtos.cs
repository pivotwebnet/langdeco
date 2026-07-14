namespace backend.Dtos;

public record ProductSpecDto(string Label, string Value);

public record ProductSpecInput(string Label, string Value);

public record ProductDto(
    string Id, string Name, string CategoryId, string CategoryName, string? Tag,
    string Material, string? Origin, decimal Price, decimal? OriginalPrice, int Stock,
    string? Note, string? Aspect, bool Active, bool Featured,
    List<ProductSpecDto> Specs, List<string> Images);

public record ProductUpsertDto(
    string Id, string Name, string CategoryId, string? Tag, string Material, string? Origin,
    decimal Price, decimal? OriginalPrice, int Stock, string? Note, string? Aspect, bool Featured,
    List<ProductSpecInput> Specs, List<string> Images);
