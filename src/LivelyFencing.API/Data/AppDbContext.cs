using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Domain.Enums;
using Pgvector.EntityFrameworkCore;

namespace LivelyFencing.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<JobEmbedding> JobEmbeddings => Set<JobEmbedding>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<BudgetLineItem> BudgetLineItems => Set<BudgetLineItem>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Income> Incomes => Set<Income>();
    public DbSet<ContactRequest> ContactRequests => Set<ContactRequest>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<SiteSettings> SiteSettings => Set<SiteSettings>();
    public DbSet<ListingPreference> ListingPreferences => Set<ListingPreference>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<TransactionDocument> TransactionDocuments => Set<TransactionDocument>();
    public DbSet<BuyerPreferences> BuyerPreferences => Set<BuyerPreferences>();
    public DbSet<ClientNote> ClientNotes => Set<ClientNote>();
    public DbSet<Showing> Showings => Set<Showing>();
    public DbSet<OpenHouseAttendee> OpenHouseAttendees => Set<OpenHouseAttendee>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Soft delete global filters – automatically excluded from all queries
        modelBuilder.Entity<Customer>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Job>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Budget>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Expense>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Income>().HasQueryFilter(x => !x.IsDeleted);

        // Enable pgvector
        modelBuilder.HasPostgresExtension("vector");

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Role).HasConversion<string>();
        });

        // Customer
        modelBuilder.Entity<Customer>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Email);
            e.HasMany(x => x.Jobs).WithOne(j => j.Customer).HasForeignKey(j => j.CustomerId).OnDelete(DeleteBehavior.Restrict);
        });

        // Job
        modelBuilder.Entity<Job>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.FencingType).HasConversion<string>();
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.LinearFeet).HasColumnType("numeric(10,2)");
            e.Property(x => x.Height).HasColumnType("numeric(10,2)");
        });

        // JobEmbedding
        modelBuilder.Entity<JobEmbedding>(e =>
        {
            e.HasKey(x => x.JobId);
            e.HasOne(x => x.Job).WithOne(j => j.Embedding).HasForeignKey<JobEmbedding>(x => x.JobId);
            e.Property(x => x.Embedding).HasColumnType("vector(768)");
        });

        // Budget
        modelBuilder.Entity<Budget>(e =>
        {
            e.HasKey(x => x.Id);
        });

        // BudgetLineItem
        modelBuilder.Entity<BudgetLineItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Category).HasConversion<string>();
            e.Property(x => x.PlannedAmount).HasColumnType("numeric(12,2)");
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Action).HasConversion<string>();
            e.Property(x => x.Details).HasColumnType("jsonb");
            e.HasIndex(x => new { x.EntityType, x.EntityId });
            e.HasIndex(x => x.Timestamp);
        });

        // Expense
        modelBuilder.Entity<Expense>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Category).HasConversion<string>();
            e.Property(x => x.Amount).HasColumnType("numeric(12,2)");
            e.HasOne(x => x.Job).WithMany().HasForeignKey(x => x.JobId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        });

        // Income
        modelBuilder.Entity<Income>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Category).HasConversion<string>();
            e.Property(x => x.Amount).HasColumnType("numeric(12,2)");
            e.HasOne(x => x.Job).WithMany().HasForeignKey(x => x.JobId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        });

        // ListingPreference
        modelBuilder.Entity<ListingPreference>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasQueryFilter(x => !x.IsDeleted);
            e.Property(x => x.Reaction).HasConversion<string>();
            e.Property(x => x.ListingPrice).HasColumnType("numeric(12,2)");
            e.HasOne(x => x.Customer).WithMany().HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.CustomerId, x.ListingKey });
        });

        // Transaction
        modelBuilder.Entity<Transaction>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasQueryFilter(x => !x.IsDeleted);
            e.Property(x => x.Type).HasConversion<string>();
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.SalePrice).HasColumnType("numeric(12,2)");
            e.Property(x => x.CommissionRate).HasColumnType("numeric(7,5)");
            e.Property(x => x.CommissionExpected).HasColumnType("numeric(12,2)");
            e.Property(x => x.CommissionReceived).HasColumnType("numeric(12,2)");
            e.HasOne(x => x.Client).WithMany().HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Restrict);
        });

        // TransactionDocument
        modelBuilder.Entity<TransactionDocument>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
            e.HasOne(x => x.Transaction).WithMany(t => t.Documents)
                .HasForeignKey(x => x.TransactionId).OnDelete(DeleteBehavior.Cascade);
        });

        // BuyerPreferences
        modelBuilder.Entity<BuyerPreferences>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.MinPrice).HasColumnType("numeric(12,2)");
            e.Property(x => x.MaxPrice).HasColumnType("numeric(12,2)");
            e.Property(x => x.MinBaths).HasColumnType("numeric(3,1)");
            e.Property(x => x.MaxBaths).HasColumnType("numeric(3,1)");
            e.HasOne(x => x.Client).WithMany().HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.ClientId).IsUnique();
        });

        // ClientNote
        modelBuilder.Entity<ClientNote>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasQueryFilter(x => !x.IsDeleted);
            e.HasOne(x => x.Client).WithMany().HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.ClientId);
        });

        // Showing
        modelBuilder.Entity<Showing>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasQueryFilter(x => !x.IsDeleted);
            e.HasOne(x => x.Client).WithMany().HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.ClientId);
        });

        // OpenHouseAttendee
        modelBuilder.Entity<OpenHouseAttendee>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasQueryFilter(x => !x.IsDeleted);
            e.HasIndex(x => x.EventDate);
        });

        // EmailTemplate
        modelBuilder.Entity<EmailTemplate>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasQueryFilter(x => !x.IsDeleted);
        });
    }
}