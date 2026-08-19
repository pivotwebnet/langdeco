using backend.Models;

namespace backend.Dtos;

public record CategoryDto(string Id, string Name, CategoryGroup Group, bool Active);

public record CategoryUpsertDto(string Id, string Name, CategoryGroup Group);
