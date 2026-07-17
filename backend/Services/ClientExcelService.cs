using ClosedXML.Excel;
using backend.Dtos;
using backend.Models;

namespace backend.Services;

public class ClientExcelService
{
    private static readonly string[] Headers =
    {
        "Id", "CompanyOrFullName", "FirstName", "LastName", "Cell", "Phone", "Email", "WebPage",
        "Address", "Province", "PostalCode", "Locality", "Note", "InitialBalance",
        "NicknameML", "SalesCategory", "SalesDiscountPercent", "NoteForClient",
        "BillingCompanyOrFullName", "TaxId", "IvaCondition", "DefaultReceiptType",
        "BillingPhone", "BillingCell", "FiscalAddress", "FiscalLocality", "FiscalProvince", "FiscalPostalCode",
        "ContactoPrincipal_Nombre", "ContactoPrincipal_Cargo", "ContactoPrincipal_Cel", "ContactoPrincipal_Telefono", "ContactoPrincipal_Email",
        "Active",
    };

    public byte[] Export(List<Client> clients)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Clientes");

        for (var i = 0; i < Headers.Length; i++)
            sheet.Cell(1, i + 1).Value = Headers[i];

        var row = 2;
        foreach (var c in clients)
        {
            var contact = c.ContactPersons.OrderBy(cp => cp.Order).FirstOrDefault();
            var col = 1;
            sheet.Cell(row, col++).Value = c.Id;
            sheet.Cell(row, col++).Value = c.CompanyOrFullName;
            sheet.Cell(row, col++).Value = c.FirstName;
            sheet.Cell(row, col++).Value = c.LastName;
            sheet.Cell(row, col++).Value = c.Cell;
            sheet.Cell(row, col++).Value = c.Phone;
            sheet.Cell(row, col++).Value = c.Email;
            sheet.Cell(row, col++).Value = c.WebPage;
            sheet.Cell(row, col++).Value = c.Address;
            sheet.Cell(row, col++).Value = c.Province;
            sheet.Cell(row, col++).Value = c.PostalCode;
            sheet.Cell(row, col++).Value = c.Locality;
            sheet.Cell(row, col++).Value = c.Note;
            sheet.Cell(row, col++).Value = c.InitialBalance;
            sheet.Cell(row, col++).Value = c.NicknameML;
            sheet.Cell(row, col++).Value = c.SalesCategory;
            sheet.Cell(row, col++).Value = c.SalesDiscountPercent;
            sheet.Cell(row, col++).Value = c.NoteForClient;
            sheet.Cell(row, col++).Value = c.BillingCompanyOrFullName;
            sheet.Cell(row, col++).Value = c.TaxId;
            sheet.Cell(row, col++).Value = c.IvaCondition.ToString();
            sheet.Cell(row, col++).Value = c.DefaultReceiptType.ToString();
            sheet.Cell(row, col++).Value = c.BillingPhone;
            sheet.Cell(row, col++).Value = c.BillingCell;
            sheet.Cell(row, col++).Value = c.FiscalAddress;
            sheet.Cell(row, col++).Value = c.FiscalLocality;
            sheet.Cell(row, col++).Value = c.FiscalProvince;
            sheet.Cell(row, col++).Value = c.FiscalPostalCode;
            sheet.Cell(row, col++).Value = contact?.Name;
            sheet.Cell(row, col++).Value = contact?.Role;
            sheet.Cell(row, col++).Value = contact?.Cell;
            sheet.Cell(row, col++).Value = contact?.Phone;
            sheet.Cell(row, col++).Value = contact?.Email;
            sheet.Cell(row, col++).Value = c.Active;
            row++;
        }

        sheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public List<ClientImportRow> ParseImport(Stream fileStream)
    {
        using var workbook = new XLWorkbook(fileStream);
        var sheet = workbook.Worksheets.First();
        var rows = new List<ClientImportRow>();

        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;
        for (var r = 2; r <= lastRow; r++)
        {
            var xlRow = sheet.Row(r);
            if (xlRow.IsEmpty()) continue;

            string? S(int col) => xlRow.Cell(col).GetString() is { Length: > 0 } s ? s : null;
            decimal D(int col) => xlRow.Cell(col).TryGetValue(out decimal d) ? d : 0m;
            bool B(int col) => xlRow.Cell(col).TryGetValue(out bool b) ? b : (S(col)?.Trim().ToLowerInvariant() != "false");

            rows.Add(new ClientImportRow(
                RowNumber: r,
                CompanyOrFullName: S(2) ?? string.Empty,
                FirstName: S(3), LastName: S(4), Cell: S(5), Phone: S(6),
                Email: S(7), WebPage: S(8), Address: S(9), Province: S(10), PostalCode: S(11),
                Locality: S(12), Note: S(13), InitialBalance: D(14),
                NicknameML: S(15), SalesCategory: S(16), SalesDiscountPercent: D(17), NoteForClient: S(18),
                BillingCompanyOrFullName: S(19) ?? S(2) ?? string.Empty, TaxId: S(20), IvaCondition: S(21), DefaultReceiptType: S(22),
                BillingPhone: S(23), BillingCell: S(24), FiscalAddress: S(25), FiscalLocality: S(26),
                FiscalProvince: S(27), FiscalPostalCode: S(28),
                ContactName: S(29), ContactRole: S(30), ContactCell: S(31), ContactPhone: S(32), ContactEmail: S(33),
                Active: B(34)));
        }

        return rows;
    }
}
