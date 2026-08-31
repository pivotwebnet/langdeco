namespace backend.Dtos;

public record ProductSpecDto(string Label, string Value);

public record ProductSpecInput(string Label, string Value);

public record ProductDto(
    string Id, string Name, string CategoryId, string CategoryName,
    string Material, List<string> RoomTags,
    decimal Price, decimal? CardPrice, decimal? OriginalPrice, decimal? WholesalePrice, int Stock, int? Installments,
    string? Note, bool Active, bool Featured,
    List<ProductSpecDto> Specs, List<string> Images, string? CutoutImageUrl);

public record ProductUpsertDto(
    string Id, string Name, string CategoryId, string Material, List<string> RoomTags,
    decimal Price, decimal? CardPrice, decimal? OriginalPrice, decimal? WholesalePrice, int Stock, int? Installments, string? Note, bool Featured,
    List<ProductSpecInput> Specs, List<string> Images, string? CutoutImageUrl);
