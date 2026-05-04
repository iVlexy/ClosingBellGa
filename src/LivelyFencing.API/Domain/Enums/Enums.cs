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

public enum QuoteStatus
{
    Draft,
    PendingApproval,
    Approved,
    Sent,
    Accepted,
    Rejected,
    Expired
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

public enum TaxIdType
{
    SSN,
    EIN
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
