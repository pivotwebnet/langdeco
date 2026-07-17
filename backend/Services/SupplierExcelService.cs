using ClosedXML.Excel;
using backend.Dtos;
using backend.Models;

namespace backend.Services;

public class SupplierExcelService
{
    private static readonly string[] Headers =
    {
        "Id", "CompanyOrFullName", "FirstName", "LastName", "Cell", "Phone", "Email", "WebPage",
        "Address", "Province", "PostalCode", "Locality", "Note", "InitialBalance",
        "PurchasesCategory", "PurchasesDiscountPercent", "NoteInternal",
        "BillingCompanyOrFullName", "TaxId", "IvaCondition", "DefaultReceiptType",
        "BillingPhone", "BillingCell", "FiscalAddress", "FiscalLocality", "FiscalProvince", "FiscalPostalCode",
        "ContactoPrincipal_Nombre", "ContactoPrincipal_Cargo", "ContactoPrincipal_Cel", "ContactoPrincipal_Telefono", "ContactoPrincipal_Email",
        "Active",
    };

    public byte[] Export(List<Supplier> suppliers)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Proveedores");

        for (var i = 0; i < Headers.Length; i++)
            sheet.Cell(1, i + 1).Value = Headers[i];

        var row = 2;
        foreach (var s in suppliers)
        {
            var contact = s.ContactPersons.OrderBy(cp => cp.Order).FirstOrDefault();
            var col = 1;
            sheet.Cell(row, col++).Value = s.Id;
            sheet.Cell(row, col++).Value = s.CompanyOrFullName;
            sheet.Cell(row, col++).Value = s.FirstName;
            sheet.Cell(row, col++).Value = s.LastName;
            sheet.Cell(row, col++).Value = s.Cell;
            sheet.Cell(row, col++).Value = s.Phone;
            sheet.Cell(row, col++).Value = s.Email;
            sheet.Cell(row, col++).Value = s.WebPage;
            sheet.Cell(row, col++).Value = s.Address;
            sheet.Cell(row, col++).Value = s.Province;
            sheet.Cell(row, col++).Value = s.PostalCode;
            sheet.Cell(row, col++).Value = s.Locality;
            sheet.Cell(row, col++).Value = s.Note;
            sheet.Cell(row, col++).Value = s.InitialBalance;
            sheet.Cell(row, col++).Value = s.PurchasesCategory;
            sheet.Cell(row, col++).Value = s.PurchasesDiscountPercent;
            sheet.Cell(row, col++).Value = s.NoteInternal;
            sheet.Cell(row, col++).Value = s.BillingCompanyOrFullName;
            sheet.Cell(row, col++).Value = s.TaxId;
            sheet.Cell(row, col++).Value = s.IvaCondition.ToString();
            sheet.Cell(row, col++).Value = s.DefaultReceiptType.ToString();
            sheet.Cell(row, col++).Value = s.BillingPhone;
            sheet.Cell(row, col++).Value = s.BillingCell;
            sheet.Cell(row, col++).Value = s.FiscalAddress;
            sheet.Cell(row, col++).Value = s.FiscalLocality;
            sheet.Cell(row, col++).Value = s.FiscalProvince;
            sheet.Cell(row, col++).Value = s.FiscalPostalCode;
            sheet.Cell(row, col++).Value = contact?.Name;
            sheet.Cell(row, col++).Value = contact?.Role;
            sheet.Cell(row, col++).Value = contact?.Cell;
            sheet.Cell(row, col++).Value = contact?.Phone;
            sheet.Cell(row, col++).Value = contact?.Email;
            sheet.Cell(row, col++).Value = s.Active;
            row++;
        }

        sheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public List<SupplierImportRow> ParseImport(Stream fileStream)
    {
        using var workbook = new XLWorkbook(fileStream);
        var sheet = workbook.Worksheets.First();
        var rows = new List<SupplierImportRow>();

        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;
        for (var r = 2; r <= lastRow; r++)
        {
            var xlRow = sheet.Row(r);
            if (xlRow.IsEmpty()) continue;

            string? S(int col) => xlRow.Cell(col).GetString() is { Length: > 0 } s ? s : null;
            decimal D(int col) => xlRow.Cell(col).TryGetValue(out decimal d) ? d : 0m;
            bool B(int col) => xlRow.Cell(col).TryGetValue(out bool b) ? b : (S(col)?.Trim().ToLowerInvariant() != "false");

            rows.Add(new SupplierImportRow(
                RowNumber: r,
                CompanyOrFullName: S(2) ?? string.Empty,
                FirstName: S(3), LastName: S(4), Cell: S(5), Phone: S(6),
                Email: S(7), WebPage: S(8), Address: S(9), Province: S(10), PostalCode: S(11),
                Locality: S(12), Note: S(13), InitialBalance: D(14),
                PurchasesCategory: S(15), PurchasesDiscountPercent: D(16), NoteInternal: S(17),
                BillingCompanyOrFullName: S(18) ?? S(2) ?? string.Empty, TaxId: S(19), IvaCondition: S(20), DefaultReceiptType: S(21),
                BillingPhone: S(22), BillingCell: S(23), FiscalAddress: S(24), FiscalLocality: S(25),
                FiscalProvince: S(26), FiscalPostalCode: S(27),
                ContactName: S(28), ContactRole: S(29), ContactCell: S(30), ContactPhone: S(31), ContactEmail: S(32),
                Active: B(33)));
        }

        return rows;
    }
}
