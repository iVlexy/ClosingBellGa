using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using LivelyFencing.API.Domain.Entities;

namespace LivelyFencing.API.Infrastructure.PDF;

public record Form1099NecData(
    Contractor Contractor,
    string DecryptedTaxId,
    decimal TotalPayments,
    int TaxYear,
    string PayerName,
    string PayerAddress,
    string PayerTaxId
);

public class Form1099NecDocument : IDocument
{
    private readonly Form1099NecData _data;

    public Form1099NecDocument(Form1099NecData data)
    {
        _data = data;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.Letter);
            page.Margin(30);
            page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial"));

            page.Content().Element(ComposeForm);
        });
    }

    private void ComposeForm(IContainer container)
    {
        container.Column(col =>
        {
            // IRS Header
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().DefaultTextStyle(x => x.FontSize(7).FontColor("#AAAAAA")).Text($"CORRECTED");
                    c.Item().PaddingTop(2).DefaultTextStyle(x => x.FontSize(16).Bold()).Text("Form 1099-NEC");
                    c.Item().DefaultTextStyle(x => x.Bold()).Text("Nonemployee Compensation");
                    c.Item().PaddingTop(4).DefaultTextStyle(x => x.FontSize(14).Bold().FontColor("#CC0000")).Text($"Tax Year {_data.TaxYear}");
                });
                row.ConstantItem(120).Column(c =>
                {
                    c.Item().AlignRight().DefaultTextStyle(x => x.FontSize(8).FontColor("#666666")).Text("OMB No. 1545-0116");
                    c.Item().AlignRight().PaddingTop(4).DefaultTextStyle(x => x.FontSize(7).FontColor("#888888")).Text("Department of the Treasury");
                    c.Item().AlignRight().DefaultTextStyle(x => x.FontSize(7).FontColor("#888888")).Text("Internal Revenue Service");
                });
            });

            col.Item().PaddingVertical(8).LineHorizontal(1).LineColor("#000000");

            // Box layout
            col.Item().Row(row =>
            {
                // Left column — Payer & Recipient
                row.RelativeItem().Column(c =>
                {
                    c.Item().Border(1).BorderColor("#888888").Padding(8).Column(box =>
                    {
                        box.Item().DefaultTextStyle(x => x.FontSize(7).FontColor("#666666")).Text("PAYER'S name, street address, city, state, and ZIP");
                        box.Item().PaddingTop(4).DefaultTextStyle(x => x.Bold()).Text(_data.PayerName);
                        box.Item().Text(_data.PayerAddress);
                    });
                    c.Item().Border(1).BorderColor("#888888").Padding(8).Column(box =>
                    {
                        box.Item().DefaultTextStyle(x => x.FontSize(7).FontColor("#666666")).Text("PAYER'S TIN");
                        box.Item().PaddingTop(4).DefaultTextStyle(x => x.Bold()).Text(_data.PayerTaxId);
                    });
                    c.Item().Border(1).BorderColor("#888888").Padding(8).Column(box =>
                    {
                        box.Item().DefaultTextStyle(x => x.FontSize(7).FontColor("#666666")).Text("RECIPIENT'S TIN");
                        box.Item().PaddingTop(4).DefaultTextStyle(x => x.Bold()).Text(MaskTaxId(_data.DecryptedTaxId, _data.Contractor.TaxIdType));
                    });
                    c.Item().Border(1).BorderColor("#888888").Padding(8).Column(box =>
                    {
                        box.Item().DefaultTextStyle(x => x.FontSize(7).FontColor("#666666")).Text("RECIPIENT'S name");
                        box.Item().PaddingTop(4).DefaultTextStyle(x => x.Bold()).Text(_data.Contractor.Name);
                        box.Item().PaddingTop(2).DefaultTextStyle(x => x.FontSize(7).FontColor("#666666")).Text("Street address (including apt. no.)");
                        box.Item().Text(_data.Contractor.Address ?? "");
                        box.Item().PaddingTop(2).DefaultTextStyle(x => x.FontSize(7).FontColor("#666666")).Text("City, state, and ZIP");
                        box.Item().Text($"{_data.Contractor.City ?? ""}, {_data.Contractor.State ?? ""} {_data.Contractor.Zip ?? ""}");
                    });
                });

                // Right column — Boxes
                row.ConstantItem(220).Column(c =>
                {
                    c.Item().Border(1).BorderColor("#888888").Padding(8).Column(box =>
                    {
                        box.Item().DefaultTextStyle(x => x.FontSize(7).FontColor("#666666")).Text("1  Nonemployee compensation");
                        box.Item().PaddingTop(8).DefaultTextStyle(x => x.FontSize(18).Bold().FontColor("#000000")).Text($"${_data.TotalPayments:F2}");
                    });
                    c.Item().Border(1).BorderColor("#888888").Padding(8).Column(box =>
                    {
                        box.Item().DefaultTextStyle(x => x.FontSize(7).FontColor("#666666")).Text("2  Payer made direct sales totaling $5,000 or more");
                        box.Item().PaddingTop(4).DefaultTextStyle(x => x.FontSize(12)).Text("[ ]");
                    });
                    c.Item().Border(1).BorderColor("#888888").Padding(8).Column(box =>
                    {
                        box.Item().DefaultTextStyle(x => x.FontSize(7).FontColor("#666666")).Text("4  Federal income tax withheld");
                        box.Item().PaddingTop(4).DefaultTextStyle(x => x.Bold()).Text("$0.00");
                    });
                    c.Item().Border(1).BorderColor("#888888").Padding(8).Column(box =>
                    {
                        box.Item().DefaultTextStyle(x => x.FontSize(7).FontColor("#666666")).Text("ACCOUNT NUMBER");
                        box.Item().PaddingTop(4).Text(_data.Contractor.Id.ToString()[..8].ToUpper());
                    });
                });
            });

            col.Item().PaddingTop(16).Background("#FFF8E1").Padding(12).Column(c =>
            {
                c.Item().DefaultTextStyle(x => x.Bold().FontSize(9)).Text("IMPORTANT — FOR YOUR RECORDS");
                c.Item().PaddingTop(4).Text($"This document is a pre-filled 1099-NEC for tax year {_data.TaxYear}. " +
                    "Please review all information and consult a qualified tax professional before filing. " +
                    "This is NOT an official IRS filing — it is provided for recordkeeping purposes only.");
                c.Item().PaddingTop(4).DefaultTextStyle(x => x.FontSize(8).FontColor("#888888")).Text($"Generated by Closing Bell Real Estate on {DateTime.UtcNow:MMMM d, yyyy}");
            });
        });
    }

    private static string MaskTaxId(string taxId, Domain.Enums.TaxIdType type)
    {
        if (taxId.Length < 4) return "***";
        var last4 = taxId.Replace("-", "").Replace(" ", "")[^4..];
        return type == Domain.Enums.TaxIdType.SSN ? $"***-**-{last4}" : $"**-***{last4}";
    }
}
