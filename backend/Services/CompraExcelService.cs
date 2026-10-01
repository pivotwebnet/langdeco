using System.Globalization;
using System.Linq;
using ClosedXML.Excel;
using backend.Dtos;

namespace backend.Services;

// Mismo criterio que ProductExcelService: formato fijo por posición de columna, se cae a la
// primera hoja del archivo si no hay ninguna llamada "Compras". Cada fila es una compra de un
// solo producto (a diferencia de Compra/CompraItem en el modelo, que admite varias líneas) —
// simplifica la plantilla de carga; si el negocio necesita compras multi-línea las sigue cargando
// a mano desde el formulario. Columnas, en orden:
//   1 Fecha, 2 Proveedor, 3 Producto, 4 Cantidad, 5 Costo Unitario,
//   6 Medio de Pago (opcional), 7 Estado (opcional: Pendiente/Recibida, default Pendiente),
//   8 Nota (opcional).
public class CompraExcelService
{
    public List<CompraImportRow> ParseImport(Stream fileStream)
    {
        using var workbook = new XLWorkbook(fileStream);
        var sheet = workbook.Worksheets.FirstOrDefault(w => w.Name.Equals("Compras", StringComparison.OrdinalIgnoreCase))
            ?? workbook.Worksheets.FirstOrDefault()
            ?? throw new InvalidOperationException("El archivo no tiene ninguna hoja con datos");

        var rows = new List<CompraImportRow>();
        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;

        for (var r = 2; r <= lastRow; r++)
        {
            var xlRow = sheet.Row(r);
            if (xlRow.IsEmpty()) continue;

            string? S(int col) => xlRow.Cell(col).GetString() is { Length: > 0 } s ? s.Trim() : null;
            decimal D(int col) => xlRow.Cell(col).TryGetValue(out decimal d) ? d : 0m;
            int I(int col) => xlRow.Cell(col).TryGetValue(out int i) ? i : (int)D(col);

            var supplierName = S(2);
            var productName = S(3);
            if (supplierName is null || productName is null) continue;

            rows.Add(new CompraImportRow(
                RowNumber: r,
                Date: ParseDate(xlRow.Cell(1)),
                SupplierName: supplierName,
                ProductName: productName,
                Quantity: I(4),
                UnitCost: D(5),
                PaymentMethodRaw: S(6),
                StatusRaw: S(7),
                Note: S(8)));
        }

        return rows;
    }

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
