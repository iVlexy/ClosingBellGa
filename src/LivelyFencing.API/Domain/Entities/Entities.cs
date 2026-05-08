using LivelyFencing.API.Domain.Enums;

namespace LivelyFencing.API.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Customer;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;
}

public class Customer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? BillingAddress { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Zip { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
    public ICollection<Job> Jobs { get; set; } = new List<Job>();
    public ICollection<Quote> Quotes { get; set; } = new List<Quote>();
}

public class Job
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public FencingType FencingType { get; set; }
    public decimal? LinearFeet { get; set; }
    public decimal? Height { get; set; }
    public int? Gates { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
    public JobStatus Status { get; set; } = JobStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
    public ICollection<Quote> Quotes { get; set; } = new List<Quote>();
    public JobEmbedding? Embedding { get; set; }
}

public class JobEmbedding
{
    public Guid JobId { get; set; }
    public Job Job { get; set; } = null!;
    public Pgvector.Vector Embedding { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Quote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobId { get; set; }
    public Job Job { get; set; } = null!;
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public QuoteStatus Status { get; set; } = QuoteStatus.Draft;
    public bool AIGenerated { get; set; }
    public string? AIContextSnapshot { get; set; }
    public string? AdminNotes { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime ValidUntil { get; set; } = DateTime.UtcNow.AddDays(30);
    public Guid PortalToken { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SentAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? RejectedAt { get; set; }
    public string? CustomerRejectionReason { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
    public ICollection<QuoteLineItem> LineItems { get; set; } = new List<QuoteLineItem>();
}

public class QuoteLineItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid QuoteId { get; set; }
    public Quote Quote { get; set; } = null!;
    public LineItemCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total => Quantity * UnitPrice;
    public int SortOrder { get; set; }
}

public class Contractor
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Zip { get; set; }
    public TaxIdType TaxIdType { get; set; }
    public byte[] TaxIdEncrypted { get; set; } = Array.Empty<byte>();
    public byte[] TaxIdIV { get; set; } = Array.Empty<byte>();
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ContractorPayment> Payments { get; set; } = new List<ContractorPayment>();
}

public class ContractorPayment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContractorId { get; set; }
    public Contractor Contractor { get; set; } = null!;
    public Guid? JobId { get; set; }
    public Job? Job { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? Description { get; set; }
    public int TaxYear { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
}

public class Budget
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public Guid? JobId { get; set; }
    public Job? Job { get; set; }
    public int Year { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
    public ICollection<BudgetLineItem> LineItems { get; set; } = new List<BudgetLineItem>();
}

public class BudgetLineItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BudgetId { get; set; }
    public Budget Budget { get; set; } = null!;
    public LineItemCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal PlannedAmount { get; set; }
}

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public AuditAction Action { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Details { get; set; }
}

public class Expense
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public ExpenseCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Vendor { get; set; }
    public Guid? JobId { get; set; }
    public Job? Job { get; set; }
    public string? Notes { get; set; }
    public string CreatedByEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
}

public class ContactRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Message { get; set; } = "";
    public string Source { get; set; } = "Website";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool Contacted { get; set; } = false;
    public DateTime? ConvertedAt { get; set; }
    public Guid? ConvertedCustomerId { get; set; }
}

public class Review
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ReviewerName { get; set; } = "";
    public string? ReviewerEmail { get; set; }
    public int Rating { get; set; } // 1-5
    public string Comment { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool Approved { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
}

public class SiteSettings
{
    public int Id { get; set; }
    public string CarouselImagesJson { get; set; } = "[]";
}

public class Income
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public IncomeCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public Guid? JobId { get; set; }
    public Job? Job { get; set; }
    public Guid? QuoteId { get; set; }
    public Quote? Quote { get; set; }
    public string? Notes { get; set; }
    public string CreatedByEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
}

public class ListingPreference
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public string ListingKey { get; set; } = string.Empty;
    public string ListingAddress { get; set; } = string.Empty;
    public string? ListingCity { get; set; }
    public decimal? ListingPrice { get; set; }
    public string? ListingPhotoUrl { get; set; }
    public ListingReaction Reaction { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
}

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClientId { get; set; }
    public Customer Client { get; set; } = null!;
    public string? ListingKey { get; set; }
    public string? Address { get; set; }
    public TransactionType Type { get; set; }
    public TransactionStatus Status { get; set; } = TransactionStatus.Prospecting;
    public DateTime? OfferDate { get; set; }
    public DateTime? ContractDate { get; set; }
    public DateTime? InspectionDate { get; set; }
    public DateTime? AppraisalDate { get; set; }
    public DateTime? ClosingDate { get; set; }
    public decimal? SalePrice { get; set; }
    public decimal? CommissionRate { get; set; }
    public decimal? CommissionExpected { get; set; }
    public decimal? CommissionReceived { get; set; }
    public string? Notes { get; set; }
    public string CreatedByEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
    public ICollection<TransactionDocument> Documents { get; set; } = new List<TransactionDocument>();
}

public class TransactionDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TransactionId { get; set; }
    public Transaction Transaction { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public DocumentStatus Status { get; set; } = DocumentStatus.Pending;
    public DateTime? DueDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class BuyerPreferences
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClientId { get; set; }
    public Customer Client { get; set; } = null!;
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? MinBeds { get; set; }
    public int? MaxBeds { get; set; }
    public decimal? MinBaths { get; set; }
    public decimal? MaxBaths { get; set; }
    public string? PreferredAreas { get; set; }
    public string? PropertyTypes { get; set; }
    public string? MustHaves { get; set; }
    public string? DealBreakers { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ClientNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClientId { get; set; }
    public Customer Client { get; set; } = null!;
    public string Note { get; set; } = string.Empty;
    public string NoteType { get; set; } = "General";
    public string CreatedByEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
}

public class Showing
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClientId { get; set; }
    public Customer Client { get; set; } = null!;
    public string? ListingKey { get; set; }
    public string Address { get; set; } = string.Empty;
    public DateTime ShowingDate { get; set; }
    public int? FeedbackRating { get; set; }
    public string? FeedbackNotes { get; set; }
    public string CreatedByEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
}

public class OpenHouseAttendee
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? ListingKey { get; set; }
    public string Address { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public bool IsPreApproved { get; set; } = false;
    public string? AgentNotes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
}

public class EmailTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Stage { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByEmail { get; set; }
}
