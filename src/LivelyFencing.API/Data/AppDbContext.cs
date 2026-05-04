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
    public DbSet<Quote> Quotes => Set<Quote>();
    public DbSet<QuoteLineItem> QuoteLineItems => Set<QuoteLineItem>();
    public DbSet<Contractor> Contractors => Set<Contractor>();
    public DbSet<ContractorPayment> ContractorPayments => Set<ContractorPayment>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<BudgetLineItem> BudgetLineItems => Set<BudgetLineItem>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Income> Incomes => Set<Income>();
    public DbSet<ContactRequest> ContactRequests => Set<ContactRequest>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<SiteSettings> SiteSettings => Set<SiteSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Soft delete global filters – automatically excluded from all queries
        modelBuilder.Entity<Customer>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Job>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Quote>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Contractor>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<ContractorPayment>().HasQueryFilter(x => !x.IsDeleted);
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
            e.HasMany(x => x.Quotes).WithOne(q => q.Customer).HasForeignKey(q => q.CustomerId).OnDelete(DeleteBehavior.Restrict);
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

        // Quote
        modelBuilder.Entity<Quote>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.PortalToken).IsUnique();
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.TotalAmount).HasColumnType("numeric(12,2)");
            e.Property(x => x.AIContextSnapshot).HasColumnType("jsonb");
        });

        // QuoteLineItem
        modelBuilder.Entity<QuoteLineItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Category).HasConversion<string>();
            e.Property(x => x.Quantity).HasColumnType("numeric(10,2)");
            e.Property(x => x.UnitPrice).HasColumnType("numeric(10,2)");
            e.Ignore(x => x.Total); // computed, not stored
        });

        // Contractor
        modelBuilder.Entity<Contractor>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.TaxIdType).HasConversion<string>();
        });

        // ContractorPayment
        modelBuilder.Entity<ContractorPayment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Amount).HasColumnType("numeric(12,2)");
            e.HasOne(x => x.Contractor).WithMany(c => c.Payments).HasForeignKey(x => x.ContractorId).OnDelete(DeleteBehavior.Restrict);
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
            e.HasOne(x => x.Quote).WithMany().HasForeignKey(x => x.QuoteId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
