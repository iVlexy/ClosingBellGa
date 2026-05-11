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


    public async Task SendContactNotificationAsync(string name, string email, string phone, string message)
    {
        var apiKey = _config["SendGrid:ApiKey"]!;
        var fromEmail = _config["SendGrid:FromEmail"] ?? "noreply@closingbellga.com";
        var fromName = _config["SendGrid:FromName"] ?? "Closing Bell Real Estate";
        var adminEmail = _config["App:AdminEmail"] ?? fromEmail;

        var client = new SendGridClient(apiKey);
        var msg = new SendGridMessage
        {
            From = new EmailAddress(fromEmail, fromName),
            Subject = $"New Consultation Request from {name}"
        };
        msg.AddTo(new EmailAddress(adminEmail, "Closing Bell Real Estate"));
        msg.HtmlContent = $"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <div style="background: #2E7D32; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0;">New Consultation Request</h1>
    <p style="color: #C8E6C9; margin: 4px 0 0;">Submitted via closingbellga.com</p>
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

    public async Task SendTemplateEmailAsync(string toEmail, string toName, string subject, string body)
    {
        var apiKey    = _config["SendGrid:ApiKey"]!;
        var fromEmail = _config["SendGrid:FromEmail"] ?? "noreply@closingbellga.com";
        var fromName  = _config["SendGrid:FromName"]  ?? "Closing Bell GA";

        var client = new SendGridClient(apiKey);
        var msg = new SendGridMessage
        {
            From    = new EmailAddress(fromEmail, fromName),
            Subject = subject
        };
        msg.AddTo(new EmailAddress(toEmail, toName));

        // Convert plain-text body to HTML, preserving line breaks
        var htmlBody = System.Net.WebUtility.HtmlEncode(body)
            .Replace("\r\n", "<br/>")
            .Replace("\n",   "<br/>")
            .Replace("\r",   "<br/>");

        msg.HtmlContent = $"""
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#1B4D2E;padding:24px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:22px;">Closing Bell Real Estate</h1>
    <p style="color:#C8E6C9;margin:4px 0 0;font-size:13px;">Real Estate Services</p>
  </div>
  <div style="padding:32px;line-height:1.7;font-size:15px;">
    {htmlBody}
  </div>

  <div style="margin:32px 32px 0;border-top:2px solid #eee;padding-top:24px;">
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;width:100%;max-width:540px;">
      <tr>
        <td style="background:#1B4D2E;padding:20px 24px;vertical-align:middle;border-radius:6px 0 0 6px;width:160px;text-align:center;">
          <img src="https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/724ccf55-fb6b-46ff-37f4-70f364eb5c00/public" alt="Brandon Bell" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #A5D6A7;display:block;margin:0 auto 10px;"/>
          <div style="color:white;font-size:22px;font-weight:bold;letter-spacing:1px;line-height:1.2;">BRANDON<br/><span style="font-style:italic;font-size:26px;">Bell</span></div>
          <div style="color:#A5D6A7;font-size:9px;letter-spacing:2px;margin-top:4px;text-transform:uppercase;">Real Estate Professional</div>
          <div style="margin-top:10px;font-size:28px;">🔔</div>
        </td>
        <td style="background:#F8FBF8;padding:16px 20px;vertical-align:middle;border:1px solid #E0EDE0;border-radius:0 6px 6px 0;">
          <table style="border-collapse:collapse;font-size:13px;color:#333;">
            <tr>
              <td style="padding:3px 10px 3px 0;color:#666;font-size:11px;white-space:nowrap;">&#128222; Direct</td>
              <td style="padding:3px 0;font-weight:600;"><a href="tel:6784774786" style="color:#1B4D2E;text-decoration:none;">678.477.4786</a></td>
            </tr>
            <tr>
              <td style="padding:3px 10px 3px 0;color:#666;font-size:11px;white-space:nowrap;">&#128222; Office</td>
              <td style="padding:3px 0;font-weight:600;"><a href="tel:6782066389" style="color:#1B4D2E;text-decoration:none;">678.206.6389</a></td>
            </tr>
            <tr>
              <td style="padding:3px 10px 3px 0;color:#666;font-size:11px;white-space:nowrap;">&#9993; Email</td>
              <td style="padding:3px 0;font-weight:600;"><a href="mailto:brandon@closingbellga.com" style="color:#1B4D2E;text-decoration:none;">brandon@closingbellga.com</a></td>
            </tr>
            <tr>
              <td style="padding:3px 10px 3px 0;color:#666;font-size:11px;white-space:nowrap;">&#127968; Address</td>
              <td style="padding:3px 0;color:#555;">22 Thayer Ridge Dr, Dawsonville, GA 30534</td>
            </tr>
            <tr>
              <td style="padding:3px 10px 3px 0;color:#666;font-size:11px;white-space:nowrap;">&#127758; Web</td>
              <td style="padding:3px 0;"><a href="https://www.closingbellga.com" style="color:#1B4D2E;text-decoration:none;font-weight:600;">www.ClosingBellGa.com</a></td>
            </tr>
          </table>
          <div style="margin-top:10px;font-size:10px;color:#999;letter-spacing:1px;text-transform:uppercase;">Willow Bend Properties</div>
        </td>
      </tr>
    </table>
  </div>
  <div style="background:#1B4D2E;padding:16px 32px;font-size:11px;color:#A5D6A7;text-align:center;margin-top:0;">
    &copy; 2026 Closing Bell Real Estate &nbsp;|&nbsp; Willow Bend Properties &nbsp;|&nbsp; Dawsonville, GA
  </div>
</body>
</html>
""";

        var response = await client.SendEmailAsync(msg);
        if (!response.IsSuccessStatusCode)
        {
            var respBody = await response.Body.ReadAsStringAsync();
            _logger.LogError("SendGrid template email failed: {Status} {Body}", response.StatusCode, respBody);
            throw new Exception($"Failed to send email: {response.StatusCode}");
        }
        _logger.LogInformation("Template email sent to {Email} (subject: {Subject})", toEmail, subject);
    }
    public async Task SendTcParseWarningAsync(
        string address,
        string buyerName,
        string buyerEmail,
        List<string> missingFields,
        Guid transactionId)
    {
        var apiKey    = _config["SendGrid:ApiKey"]!;
        var fromEmail = _config["SendGrid:FromEmail"] ?? "noreply@closingbellga.com";
        var fromName  = _config["SendGrid:FromName"]  ?? "Closing Bell Real Estate";
        var adminEmail = _config["App:AdminEmail"] ?? "brandon@closingbellga.com";

        var missingRows = string.Join("", missingFields.Select(f =>
            $"<tr><td style=\"padding:8px 12px;border-bottom:1px solid #fce4e4;\">⚠️ {f}</td></tr>"));

        var client = new SendGridClient(apiKey);
        var msg = new SendGridMessage
        {
            From    = new EmailAddress(fromEmail, fromName),
            Subject = $"⚠️ TC Email Parsed — Missing Fields: {address}"
        };
        msg.AddTo(new EmailAddress(adminEmail, "Brandon Bell"));
        msg.HtmlContent = $"""
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#B71C1C;padding:20px 24px;">
    <h1 style="color:white;margin:0;font-size:20px;">⚠️ TC Email — Missing Fields</h1>
    <p style="color:#FFCDD2;margin:6px 0 0;font-size:13px;">A new transaction was auto-imported but some fields could not be read.</p>
  </div>
  <div style="padding:24px;">
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr style="background:#F5F5F5;">
        <td style="padding:8px 12px;font-weight:600;color:#555;width:140px;">Property</td>
        <td style="padding:8px 12px;">{address}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#555;">Buyer</td>
        <td style="padding:8px 12px;">{buyerName} &lt;{buyerEmail}&gt;</td>
      </tr>
      <tr style="background:#F5F5F5;">
        <td style="padding:8px 12px;font-weight:600;color:#555;">Transaction ID</td>
        <td style="padding:8px 12px;">#{transactionId}</td>
      </tr>
    </table>

    <h3 style="color:#B71C1C;margin:0 0 8px;">Fields That Could Not Be Parsed</h3>
    <table style="width:100%;border-collapse:collapse;background:#FFF8F8;border:1px solid #FFCDD2;border-radius:4px;">
      {missingRows}
    </table>

    <p style="margin-top:20px;font-size:14px;color:#555;">
      Please open the transaction and fill in the missing dates/details manually.
    </p>
    <div style="margin-top:16px;">
      <a href="https://closingbellga.com/transactions"
         style="background:#1B4D2E;color:white;padding:10px 24px;text-decoration:none;border-radius:4px;font-weight:bold;font-size:14px;">
        Open Pipeline →
      </a>
    </div>
  </div>
  <div style="background:#1B4D2E;padding:14px 24px;font-size:11px;color:#A5D6A7;text-align:center;">
    &copy; 2026 Closing Bell Real Estate — automated notification
  </div>
</body>
</html>
""";

        var response = await client.SendEmailAsync(msg);
        if (!response.IsSuccessStatusCode)
        {
            var respBody = await response.Body.ReadAsStringAsync();
            _logger.LogError("SendTcParseWarning failed: {Status} {Body}", response.StatusCode, respBody);
        }
        else
        {
            _logger.LogInformation("TC parse warning email sent for transaction #{TransactionId}", transactionId);
        }
    }

}
