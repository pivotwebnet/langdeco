using System.Globalization;
using System.Linq;
using ClosedXML.Excel;
using backend.Dtos;

namespace backend.Services;

// Mismo criterio que ProductExcelService: formato fijo por posición de columna (no por nombre
// de header, a diferencia de SaleExcelService), y se cae a la primera hoja del archivo si no hay
// ninguna llamada "Gastos" — la plantilla de carga no obliga a nombrar la hoja de una forma
// particular. Columnas, en orden:
//   1 Fecha, 2 Categoría, 3 Descripción, 4 Monto, 5 Medio de Pago, 6 Proveedor (opcional).
public class GastoExcelService
{
    public List<GastoImportRow> ParseImport(Stream fileStream)
    {
        using var workbook = new XLWorkbook(fileStream);
        var sheet = workbook.Worksheets.FirstOrDefault(w => w.Name.Equals("Gastos", StringComparison.OrdinalIgnoreCase))
            ?? workbook.Worksheets.FirstOrDefault()
            ?? throw new InvalidOperationException("El archivo no tiene ninguna hoja con datos");

        var rows = new List<GastoImportRow>();
        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;

        for (var r = 2; r <= lastRow; r++)
        {
            var xlRow = sheet.Row(r);
            if (xlRow.IsEmpty()) continue;

            string? S(int col) => xlRow.Cell(col).GetString() is { Length: > 0 } s ? s.Trim() : null;
            decimal D(int col) => xlRow.Cell(col).TryGetValue(out decimal d) ? d : 0m;

            var description = S(3);
            if (description is null) continue;

            rows.Add(new GastoImportRow(
                RowNumber: r,
                Date: ParseDate(xlRow.Cell(1)),
                CategoryRaw: S(2) ?? "Otro",
                Description: description,
                Amount: D(4),
                PaymentMethodRaw: S(5),
                SupplierName: S(6)));
        }

        return rows;
    }

    // Misma lógica de lectura de fecha que SaleExcelService.ParseDate: Excel suele guardar la
    // celda como fecha nativa, no como texto, así que hay que leer ese tipo antes de intentar
    // parsear un string.
    private static DateTime ParseDate(IXLCell cell)
    {
        if (cell.DataType == XLDataType.DateTime)
            return cell.GetDateTime().Date;

        var raw = cell.GetString().Trim();
        if (DateTime.TryParseExact(raw, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var exact))
            return exact;
        if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out var flexible))
            return flexible.Date;

        return DateTime.UtcNow.Date;
    }
}
