namespace backend.Dtos;

public record CategoryDto(string Id, string Name, bool Active);

public record CategoryUpsertDto(string Id, string Name);
