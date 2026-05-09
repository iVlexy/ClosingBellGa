namespace LivelyFencing.API.Domain.Enums;

public enum UserRole
{
    Admin,
    Sales,
    Accountant,
    FieldWorker,
    Customer
}

public enum FencingType
{
    Wood,
    ChainLink,
    Vinyl,
    Aluminum,
    WroughtIron,
    Other
}

public enum JobStatus
{
    Active,
    Completed,
    Cancelled,
    OnHold
}


public enum LineItemCategory
{
    Material,
    Labour,
    Equipment,
    Permit,
    Disposal,
    Other
}


public enum AuditAction
{
    Created,
    Updated,
    Deleted,
    StatusChanged,
    Approved,
    Rejected,
    Sent,
    Accepted,
    Login
}

public enum ExpenseCategory
{
    Supplies,
    Equipment,
    Fuel,
    Insurance,
    Tools,
    Marketing,
    Utilities,
    Office,
    Maintenance,
    Other
}

public enum IncomeCategory
{
    JobPayment,
    ChangeOrder,
    Deposit,
    Referral,
    MaterialSale,
    Other
}

public enum ListingReaction
{
    Like,
    Dislike
}

public enum TransactionStatus
{
    Prospecting,
    OfferSubmitted,
    UnderContract,
    Inspection,
    Appraisal,
    ClearToClose,
    Closed,
    FallThrough
}

public enum TransactionType
{
    BuyerRepresentation,
    SellerRepresentation,
    Dual
}

public enum DocumentStatus
{
    Pending,
    Sent,
    Signed,
    Received,
    NotRequired
}
