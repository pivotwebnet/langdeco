namespace backend.Dtos;

public record BulkIdsDto(List<string> Ids);

public record BulkPriceAdjustDto(List<string> Ids, decimal Percent);

public record BulkResultDto(int Updated, List<string> Skipped);
