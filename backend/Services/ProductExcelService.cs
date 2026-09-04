using System.Globalization;
using ClosedXML.Excel;
using backend.Dtos;

namespace backend.Services;

// A diferencia de ClientExcelService/SupplierExcelService (que exportan e importan su propio
// formato, así que pueden leer por posición asumiendo que coincide con lo que ellos mismos
// escribieron), este servicio solo IMPORTA: lee el formato fijo del sistema anterior del
// cliente (planilla "Listado de Productos" de su POS viejo), con columnas en este orden
// exacto — no hay un Export() propio para hacer round-trip:
//   1 Id (interno del sistema viejo, se ignora), 2 Nombre, 3 Tipo de Producto (ignorado),
//   4 Proveedor, 5 Código (ignorado), 6 Stock (texto, ej. "1.0"), 7 Costo,
//   8 IVA Compras (ignorado), 9 Precio de Venta, 10 IVA Ventas, 11 CONTADO EFECTIVO (ignorado),
//   12 PUBLICO (ignorado), 13 Descripción (ignorado — no hay campo equivalente en Product),
//   14 Activo (ignorado — el import decide el estado según el precio), 15-17 (ignorados).
public class ProductExcelService
{
    public List<ProductImportRow> ParseImport(Stream fileStream)
    {
        using var workbook = new XLWorkbook(fileStream);
        var sheet = workbook.Worksheet("Productos");
        var rows = new List<ProductImportRow>();

        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;
        for (var r = 2; r <= lastRow; r++)
        {
            var xlRow = sheet.Row(r);
            if (xlRow.IsEmpty()) continue;

            string? S(int col) => xlRow.Cell(col).GetString() is { Length: > 0 } s ? s.Trim() : null;
            decimal D(int col) => xlRow.Cell(col).TryGetValue(out decimal d) ? d : 0m;

            var name = S(2);
            if (name is null) continue;

            rows.Add(new ProductImportRow(
                RowNumber: r,
                Name: name,
                ProveedorName: S(4),
                StockRaw: S(6) ?? "0",
                CostPrice: D(7),
                SalePrice: D(9),
                IvaPercent: xlRow.Cell(10).TryGetValue(out decimal iva) ? iva : null));
        }

        return rows;
    }

    // El Stock del sistema viejo viene como texto decimal (ej. "1.0", "0", "-1"), nunca
    // fraccionario en la práctica — se trunca a entero.
    public static int ParseStock(string raw) =>
        decimal.TryParse(raw, NumberStyles.Number, CultureInfo.InvariantCulture, out var d) ? (int)d : 0;
}
