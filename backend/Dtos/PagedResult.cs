namespace backend.Dtos;

// Paginación opt-in: si el caller no manda `page`, los endpoints de listado siguen devolviendo
// el array plano de siempre (compat con el catálogo público y clientes existentes).
public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);
