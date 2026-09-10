using System.Globalization;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using backend.Dtos;
using backend.Models;

namespace backend.Services;

// Importa el "Listado de Ventas" exportado del sistema anterior del cliente. A diferencia de
// ProductExcelService (que lee por posición fija asumiendo un único formato conocido), acá cada
// columna se resuelve por su nombre de header — el export trae ~46 columnas, de las que solo un
// puñado nos interesan, y el orden podría variar entre distintas exportaciones del mismo sistema.
//
// La columna "Productos" viene como un único string con los nombres concatenados separados por
// " -" (ej. "  -MESA RATONA -FLORERO 20CM"), sin cantidad ni precio por línea — el export no
// distingue "vendí 2 de X" de "vendí X e Y", y no da precio unitario. El import reparte el
// subtotal de la venta en partes iguales entre los productos listados (ver SalesController.Import).
public class SaleExcelService
{
    public List<SaleImportRow> ParseImport(Stream fileStream)
    {
        using var workbook = new XLWorkbook(fileStream);
        var sheet = workbook.Worksheets.First();

        var headerRow = sheet.Row(1);
        var columns = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var lastHeaderCol = headerRow.LastCellUsed()?.Address.ColumnNumber ?? 0;
        for (var c = 1; c <= lastHeaderCol; c++)
        {
            var name = headerRow.Cell(c).GetString().Trim();
            if (name.Length > 0) columns.TryAdd(name, c);
        }

        int Col(string name) => columns.TryGetValue(name, out var c)
            ? c
            : throw new InvalidOperationException($"Falta la columna '{name}' en el Excel — ¿es el archivo correcto?");

        var idCol = Col("Id");
        var dateCol = Col("Emisión");
        var clientCol = Col("Cliente");
        var phoneCol = Col("Teléfono");
        var cellCol = Col("Celular");
        var addressCol = Col("Dirección");
        var subtotalCol = Col("Subtotal Sin Descuento");
        var discountCol = Col("Descuento en $");
        var totalCol = Col("Total Venta");
        var paymentCol = Col("Medio de Cobro");
        var estadoCol = Col("Estado");
        var productsCol = Col("Productos");

        var rows = new List<SaleImportRow>();
        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;

        for (var r = 2; r <= lastRow; r++)
        {
            var xlRow = sheet.Row(r);
            if (xlRow.IsEmpty()) continue;

            string? S(int col) => xlRow.Cell(col).GetString() is { Length: > 0 } s ? s.Trim() : null;
            decimal D(int col) => xlRow.Cell(col).TryGetValue(out decimal d) ? d : 0m;

            var idRaw = S(idCol);
            var clientName = S(clientCol);
            if (idRaw is null || clientName is null) continue;
            if (!int.TryParse(idRaw, out var originalNumber)) continue;

            var date = ParseDate(xlRow.Cell(dateCol));

            var productNames = SplitProducts(S(productsCol));

            rows.Add(new SaleImportRow(
                RowNumber: r,
                OriginalNumber: originalNumber,
                Date: date,
                ClientName: clientName,
                Phone: S(phoneCol),
                Cell: S(cellCol),
                Address: S(addressCol),
                SubtotalBeforeDiscount: D(subtotalCol),
                DiscountAmount: D(discountCol),
                Total: D(totalCol),
                PaymentMethodRaw: S(paymentCol),
                Status: S(estadoCol) == "Cobrado" ? SaleStatus.Paid : SaleStatus.Pending,
                ProductNames: productNames));
        }

        return rows;
    }

    // La celda de fecha suele venir como valor de fecha nativo de Excel (no como texto), así
    // que hay que leerla como tal antes de intentar parsear un string — si se lee como texto
    // con GetString() y se le aplica un formato fijo que no coincide con cómo Excel la
    // serializa, el parseo exacto falla silenciosamente y cae al valor de hoy.
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

    // Los nombres vienen separados por " -" (espacio + guion), nunca por un guion pegado al
    // texto — así que partir por ese patrón (en vez de por "-" a secas) no rompe nombres de
    // producto que legítimamente contengan un guion (ej. códigos de proveedor). ClosedXML
    // no preserva los espacios de apertura de la celda (a diferencia de otros lectores de
    // xlsx), así que el primer item pierde el espacio que precede a su guion — se lo
    // quitamos a mano antes de partir, si no el primer producto de cada venta queda con un
    // "-" pegado adelante y no matchea contra el catálogo.
    private static readonly Regex ProductSeparator = new(@"\s+-\s*", RegexOptions.Compiled);

    internal static List<string> SplitProducts(string? cell)
    {
        var text = (cell ?? "").Trim();
        if (text.StartsWith('-')) text = text[1..].TrimStart();

        return ProductSeparator.Split(text)
            .Select(s => s.Trim())
            .Where(s => s.Length > 0)
            .ToList();
    }
}
