using SendGrid;
using SendGrid.Helpers.Mail;

namespace LivelyFencing.API.Infrastructure.Email;

public class SendGridEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SendGridEmailService> _logger;

    public SendGridEmailService(IConfiguration config, ILogger<SendGridEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendQuoteAsync(
        string toEmail, string toName,
        string customerName, string jobTitle,
        byte[] pdfBytes, Guid quoteId, Guid portalToken,
        decimal totalAmount, DateTime validUntil)
    {
        var apiKey = _config["SendGrid:ApiKey"]!;
        var fromEmail = _config["SendGrid:FromEmail"] ?? "quotes@lookinlivelyexterior.com";
        var fromName = _config["SendGrid:FromName"] ?? "Lookin' Lively Exterior Solutions";
        var portalBase = _config["App:PortalBaseUrl"] ?? "https://lookinlivelyexterior.com";

        var client = new SendGridClient(apiKey);
        var msg = new SendGridMessage
        {
            From = new EmailAddress(fromEmail, fromName),
            Subject = $"Your Quote from Lookin' Lively Exterior Solutions — #{quoteId.ToString()[..8].ToUpper()}"
        };

        msg.AddTo(new EmailAddress(toEmail, toName));

        var portalUrl = $"{portalBase}/portal/quotes/{portalToken}";

        msg.HtmlContent = $"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <div style="background: #2E7D32; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0;">Lookin' Lively Exterior Solutions</h1>
    <p style="color: #C8E6C9; margin: 4px 0 0;">Professional Fencing Solutions</p>
  </div>
  <div style="padding: 32px;">
    <h2>Hi {customerName},</h2>
    <p>Thank you for your interest! Your quote for <strong>{jobTitle}</strong> is attached to this email as a PDF.</p>
    <div style="background: #F5F5F5; border-left: 4px solid #2E7D32; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">Quote Total</p>
      <p style="margin: 4px 0 0; font-size: 28px; font-weight: bold; color: #2E7D32;">${totalAmount:F2}</p>
      <p style="margin: 8px 0 0; font-size: 12px; color: #888;">Valid until {validUntil:MMMM d, yyyy}</p>
    </div>
    <p>You can review and accept this quote online:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{portalUrl}"
         style="background: #2E7D32; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
        View &amp; Accept Quote
      </a>
    </div>
    <p style="font-size: 12px; color: #888;">Or copy this link into your browser:<br/><a href="{portalUrl}">{portalUrl}</a></p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>
    <p style="font-size: 12px; color: #888;">Questions? Reply to this email or contact us at <a href="mailto:info@lookinlivelyexterior.com">info@lookinlivelyexterior.com</a></p>
  </div>
</body>
</html>
""";

        // Attach PDF
        var pdfBase64 = Convert.ToBase64String(pdfBytes);
        msg.AddAttachment($"LLES-Quote-{quoteId.ToString()[..8].ToUpper()}.pdf", pdfBase64, "application/pdf");

        var response = await client.SendEmailAsync(msg);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Body.ReadAsStringAsync();
            _logger.LogError("SendGrid failed: {Status} {Body}", response.StatusCode, body);
            throw new Exception($"Failed to send quote email: {response.StatusCode}");
        }

        _logger.LogInformation("Quote {QuoteId} emailed to {Email}", quoteId, toEmail);
    }

    public async Task SendContactNotificationAsync(string name, string email, string phone, string message)
    {
        var apiKey = _config["SendGrid:ApiKey"]!;
        var fromEmail = _config["SendGrid:FromEmail"] ?? "quotes@lookinlivelyexterior.com";
        var fromName = _config["SendGrid:FromName"] ?? "Lookin' Lively Exterior Solutions";
        var adminEmail = _config["App:AdminEmail"] ?? fromEmail;

        var client = new SendGridClient(apiKey);
        var msg = new SendGridMessage
        {
            From = new EmailAddress(fromEmail, fromName),
            Subject = $"New Quote Request from {name}"
        };
        msg.AddTo(new EmailAddress(adminEmail, "Lookin' Lively Exterior Solutions Admin"));
        msg.HtmlContent = $"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <div style="background: #2E7D32; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0;">New Quote Request</h1>
    <p style="color: #C8E6C9; margin: 4px 0 0;">Submitted via lookinlivelyexterior.com</p>
  </div>
  <div style="padding: 32px;">
    <table style="width:100%; border-collapse: collapse;">
      <tr><td style="padding:8px; font-weight:600; color:#555; width:100px;">Name</td><td style="padding:8px;">{name}</td></tr>
      <tr style="background:#F9F9F9;"><td style="padding:8px; font-weight:600; color:#555;">Email</td><td style="padding:8px;"><a href="mailto:{email}">{email}</a></td></tr>
      <tr><td style="padding:8px; font-weight:600; color:#555;">Phone</td><td style="padding:8px;">{phone}</td></tr>
      <tr style="background:#F9F9F9;"><td style="padding:8px; font-weight:600; color:#555; vertical-align:top;">Message</td><td style="padding:8px;">{message}</td></tr>
    </table>
    <div style="margin-top:24px; text-align:center;">
      <a href="mailto:{email}" style="background:#2E7D32; color:white; padding:12px 28px; text-decoration:none; border-radius:4px; font-weight:bold;">Reply to {name}</a>
    </div>
  </div>
</body>
</html>
""";
        var response = await client.SendEmailAsync(msg);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Body.ReadAsStringAsync();
            _logger.LogError("SendGrid notification failed: {Status} {Body}", response.StatusCode, body);
        }
        _logger.LogInformation("Contact notification sent for {Email}", email);
    }

}