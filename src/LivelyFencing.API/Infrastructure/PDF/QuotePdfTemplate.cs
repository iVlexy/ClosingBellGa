using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using LivelyFencing.API.Domain.Entities;

namespace LivelyFencing.API.Infrastructure.PDF;

public class QuotePdfDocument : IDocument
{
    private readonly Quote _quote;
    private readonly string _portalBaseUrl;

    public QuotePdfDocument(Quote quote, string portalBaseUrl)
    {
        _quote = quote;
        _portalBaseUrl = portalBaseUrl;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(40);
            page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));
            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });
    }

    private void ComposeHeader(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().DefaultTextStyle(x => x.FontSize(22).Bold().FontColor("#1B4D2E")).Text("CLOSING BELL REAL ESTATE");
                    c.Item().DefaultTextStyle(x => x.FontSize(11).FontColor("#555555")).Text("Real Estate Services");
                    c.Item().PaddingTop(4).DefaultTextStyle(x => x.FontSize(9).FontColor("#666666")).Text("closingbellga.com");
                });
                row.ConstantItem(160).Column(c =>
                {
                    c.Item().AlignRight().DefaultTextStyle(x => x.FontSize(28).Bold().FontColor("#1B5E20")).Text("QUOTE");
                    c.Item().AlignRight().DefaultTextStyle(x => x.FontSize(11).FontColor("#555555")).Text($"#{_quote.Id.ToString()[..8].ToUpper()}");
                    c.Item().AlignRight().PaddingTop(4).DefaultTextStyle(x => x.FontSize(9)).Text($"Date: {DateTime.UtcNow:MMMM d, yyyy}");
                    c.Item().AlignRight().DefaultTextStyle(x => x.FontSize(9)).Text($"Valid Until: {_quote.ValidUntil:MMMM d, yyyy}");
                });
            });
            col.Item().PaddingTop(8).LineHorizontal(2).LineColor("#2E7D32");
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.PaddingTop(16).Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().DefaultTextStyle(x => x.Bold().FontSize(9).FontColor("#666666")).Text("BILL TO");
                    c.Item().DefaultTextStyle(x => x.Bold()).Text(_quote.Customer.Name);
                    if (!string.IsNullOrEmpty(_quote.Customer.Company))
                        c.Item().Text(_quote.Customer.Company);
                    c.Item().Text(_quote.Customer.Email);
                    if (!string.IsNullOrEmpty(_quote.Customer.Phone))
                        c.Item().Text(_quote.Customer.Phone);
                });
                row.RelativeItem().Column(c =>
                {
                    c.Item().DefaultTextStyle(x => x.Bold().FontSize(9).FontColor("#666666")).Text("JOB DETAILS");
                    c.Item().DefaultTextStyle(x => x.Bold()).Text(_quote.Job.Title);
                    c.Item().Text($"Type: {_quote.Job.FencingType}");
                    if (_quote.Job.LinearFeet.HasValue)
                        c.Item().Text($"Linear Feet: {_quote.Job.LinearFeet:F0} ft");
                    if (_quote.Job.Height.HasValue)
                        c.Item().Text($"Height: {_quote.Job.Height:F0} ft");
                    if (_quote.Job.Gates.HasValue)
                        c.Item().Text($"Gates: {_quote.Job.Gates}");
                    if (!string.IsNullOrEmpty(_quote.Job.Location))
                        c.Item().Text($"Location: {_quote.Job.Location}");
                });
            });
            col.Item().PaddingVertical(16).LineHorizontal(1).LineColor("#CCCCCC");
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.ConstantColumn(80);
                    cols.RelativeColumn();
                    cols.ConstantColumn(60);
                    cols.ConstantColumn(80);
                    cols.ConstantColumn(80);
                });
                table.Header(header =>
                {
                    header.Cell().Background("#2E7D32").Padding(6).DefaultTextStyle(x => x.Bold().FontColor("#FFFFFF").FontSize(9)).Text("Category");
                    header.Cell().Background("#2E7D32").Padding(6).DefaultTextStyle(x => x.Bold().FontColor("#FFFFFF").FontSize(9)).Text("Description");
                    header.Cell().Background("#2E7D32").Padding(6).AlignRight().DefaultTextStyle(x => x.Bold().FontColor("#FFFFFF").FontSize(9)).Text("Qty");
                    header.Cell().Background("#2E7D32").Padding(6).AlignRight().DefaultTextStyle(x => x.Bold().FontColor("#FFFFFF").FontSize(9)).Text("Unit Price");
                    header.Cell().Background("#2E7D32").Padding(6).AlignRight().DefaultTextStyle(x => x.Bold().FontColor("#FFFFFF").FontSize(9)).Text("Total");
                });
                var items = _quote.LineItems.OrderBy(li => li.SortOrder).ThenBy(li => li.Category.ToString()).ToList();
                for (int i = 0; i < items.Count; i++)
                {
                    var li = items[i];
                    var bg = i % 2 == 0 ? "#FFFFFF" : "#F5F5F5";
                    table.Cell().Background(bg).Padding(6).DefaultTextStyle(x => x.FontSize(9)).Text(li.Category.ToString());
                    table.Cell().Background(bg).Padding(6).DefaultTextStyle(x => x.FontSize(9)).Text(li.Description);
                    table.Cell().Background(bg).Padding(6).AlignRight().DefaultTextStyle(x => x.FontSize(9)).Text($"{li.Quantity:F2}");
                    table.Cell().Background(bg).Padding(6).AlignRight().DefaultTextStyle(x => x.FontSize(9)).Text($"${li.UnitPrice:F2}");
                    table.Cell().Background(bg).Padding(6).AlignRight().DefaultTextStyle(x => x.FontSize(9)).Text($"${li.Total:F2}");
                }
            });
            col.Item().PaddingTop(8).AlignRight().Column(c =>
            {
                c.Item().Row(row =>
                {
                    row.ConstantItem(160).DefaultTextStyle(x => x.Bold().FontSize(14)).Text("TOTAL");
                    row.ConstantItem(100).AlignRight().DefaultTextStyle(x => x.Bold().FontSize(14).FontColor("#2E7D32")).Text($"${_quote.TotalAmount:F2}");
                });
            });
            if (!string.IsNullOrEmpty(_quote.AdminNotes))
            {
                col.Item().PaddingTop(16).Column(c =>
                {
                    c.Item().DefaultTextStyle(x => x.Bold().FontSize(9).FontColor("#666666")).Text("NOTES");
                    c.Item().Text(_quote.AdminNotes);
                });
            }
            var portalUrl = $"{_portalBaseUrl}/portal/quotes/{_quote.PortalToken}";
            col.Item().PaddingTop(24).Background("#E8F5E9").Padding(16).Column(c =>
            {
                c.Item().DefaultTextStyle(x => x.Bold().FontColor("#1B5E20")).Text("ACCEPT THIS QUOTE ONLINE");
                c.Item().PaddingTop(4).DefaultTextStyle(x => x.FontSize(9).FontColor("#555555")).Text("Review and accept this quote at:");
                c.Item().DefaultTextStyle(x => x.FontSize(9).FontColor("#1565C0")).Text(portalUrl);
            });
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().LineHorizontal(1).LineColor("#CCCCCC");
            col.Item().PaddingTop(4).Row(row =>
            {
                row.RelativeItem().DefaultTextStyle(x => x.FontSize(8).FontColor("#888888"))
                    .Text("This quote is valid for 30 days. Prices subject to site assessment.");
                row.ConstantItem(80).AlignRight().DefaultTextStyle(x => x.FontSize(8).FontColor("#888888")).Text(x =>
                {
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
        });
    }
}
