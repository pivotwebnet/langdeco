using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using backend.Dtos;
using backend.Models;

namespace backend.Services;

public class ReceiptPdfService
{
    private static readonly CultureInfo MoneyCulture = CultureInfo.GetCultureInfo("es-AR");

    public byte[] Generate(ReceiptData data, CompanySettings company)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor(Colors.Black));

                page.Header().Element(c => ComposeHeader(c, data, company));
                page.Content().Element(c => ComposeBody(c, data));
                page.Footer().AlignCenter().Text(x =>
                {
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    private static void ComposeHeader(IContainer container, ReceiptData data, CompanySettings company)
    {
        container.Column(column =>
        {
            column.Item().Row(row =>
            {
                row.RelativeItem(2).Column(col =>
                {
                    col.Item().Width(64).Height(64).Element(e => ComposeStamp(e, company.Name));
                    if (!string.IsNullOrWhiteSpace(company.Phone))
                        col.Item().PaddingTop(4).Text($"Tel: {company.Phone}");
                });

                row.RelativeItem(1).AlignCenter().AlignMiddle().Height(50)
                    .Border(1.5f).BorderColor(Colors.Black)
                    .AlignCenter().AlignMiddle().Text("X").FontSize(24).Bold();

                row.RelativeItem(2).AlignRight().Column(col =>
                {
                    col.Item().AlignRight().Text($"{data.DocumentTitle} {data.Number}").FontSize(16).Bold();
                    col.Item().PaddingTop(4).AlignRight().Row(r =>
                    {
                        r.AutoItem().Text("Fecha: ").SemiBold();
                        r.AutoItem().Text(data.Date.ToString("dd/MM/yyyy"));
                    });
                });
            });

            column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Darken1);
        });
    }

    private static void ComposeStamp(IContainer container, string companyName)
    {
        container
            .Border(1.5f)
            .BorderColor(Colors.Grey.Darken2)
            .Padding(4)
            .AlignCenter()
            .AlignMiddle()
            .Text(companyName)
            .FontSize(8)
            .Bold()
            .AlignCenter();
    }

    private static void ComposeBody(IContainer container, ReceiptData data)
    {
        container.PaddingTop(10).Column(column =>
        {
            column.Item().Row(row =>
            {
                row.RelativeItem(2).Column(col =>
                {
                    col.Item().Text(t =>
                    {
                        t.Span("Cliente: ").SemiBold();
                        t.Span(data.CustomerName);
                    });
                    col.Item().Text(t =>
                    {
                        t.Span("CUIT: ").SemiBold();
                        t.Span(data.CustomerTaxId ?? "-");
                    });
                    col.Item().Text(t =>
                    {
                        t.Span("Domicilio: ").SemiBold();
                        t.Span(data.CustomerAddress ?? "-");
                    });
                });

                if (data.ValidUntil.HasValue)
                {
                    row.RelativeItem(1).AlignRight().Column(col =>
                    {
                        col.Item().AlignRight().Text("Fecha Vto. del Presupuesto:").SemiBold();
                        col.Item().AlignRight().Text(data.ValidUntil.Value.ToString("dd/MM/yyyy"));
                    });
                }
            });

            column.Item().PaddingTop(4).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);

            column.Item().PaddingTop(14).Text("CONCEPTOS").FontSize(12).Bold();

            column.Item().PaddingTop(6).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(1.2f);
                    columns.RelativeColumn(3f);
                    columns.RelativeColumn(0.8f);
                    columns.RelativeColumn(1.4f);
                    columns.RelativeColumn(0.9f);
                    columns.RelativeColumn(1.4f);
                    columns.RelativeColumn(1.1f);
                    columns.RelativeColumn(1.5f);
                });

                table.Header(header =>
                {
                    HeaderCell(header, "Código");
                    HeaderCell(header, "Descripción");
                    HeaderCell(header, "Cant.");
                    HeaderCell(header, "Precio Unitario");
                    HeaderCell(header, "Bonif.");
                    HeaderCell(header, "Subtotal");
                    HeaderCell(header, "Alícuota IVA");
                    HeaderCell(header, "Subtotal c/IVA");
                });

                foreach (var item in data.Items)
                {
                    table.Cell().Padding(5).Text(item.Code);
                    table.Cell().Padding(5).Text(item.Description);
                    table.Cell().Padding(5).AlignRight().Text(item.Quantity.ToString());
                    table.Cell().Padding(5).AlignRight().Text(FormatMoney(item.UnitPrice));
                    table.Cell().Padding(5).AlignRight().Text($"{item.BonifPercent:0}%");
                    table.Cell().Padding(5).AlignRight().Text(FormatMoney(item.Subtotal));
                    table.Cell().Padding(5).AlignRight().Text($"{item.TaxRatePercent:0}%");
                    table.Cell().Padding(5).AlignRight().Text(FormatMoney(item.SubtotalWithTax));
                }
            });

            column.Item().PaddingTop(14).AlignRight().Width(280).Column(col =>
            {
                col.Item().Background(Colors.BlueGrey.Darken3).Padding(6).Row(r =>
                {
                    r.RelativeItem().Text(data.TaxRatePercent == 0 ? "Importe Neto Exento" : "Importe Neto").FontColor(Colors.White);
                    r.AutoItem().Text(FormatMoney(data.NetExemptAmount)).FontColor(Colors.White);
                });

                if (data.DiscountAmount > 0)
                {
                    col.Item().Background(Colors.BlueGrey.Darken2).Padding(6).Row(r =>
                    {
                        r.RelativeItem().Text("Descuento").FontColor(Colors.White);
                        r.AutoItem().Text($"-{FormatMoney(data.DiscountAmount)}").FontColor(Colors.White);
                    });
                }

                if (data.TaxAmount > 0)
                {
                    col.Item().Background(Colors.BlueGrey.Darken2).Padding(6).Row(r =>
                    {
                        r.RelativeItem().Text("IVA").FontColor(Colors.White);
                        r.AutoItem().Text(FormatMoney(data.TaxAmount)).FontColor(Colors.White);
                    });
                }

                col.Item().Background(Colors.BlueGrey.Darken4).Padding(8).Row(r =>
                {
                    r.RelativeItem().Text($"Total {TitleCase(data.DocumentTitle)}").FontColor(Colors.White).Bold();
                    r.AutoItem().Text(FormatMoney(data.Total)).FontColor(Colors.White).Bold();
                });
            });
        });
    }

    private static void HeaderCell(TableCellDescriptor header, string text)
    {
        header.Cell().Background(Colors.BlueGrey.Darken3).Padding(5)
            .AlignRight().Text(text).FontColor(Colors.White).FontSize(8).SemiBold();
    }

    private static string TitleCase(string value) =>
        value.Length == 0 ? value : char.ToUpper(value[0]) + value[1..].ToLower();

    private static string FormatMoney(decimal value) =>
        "$" + value.ToString("#,0.00", MoneyCulture);
}
