using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductSpec> ProductSpecs => Set<ProductSpec>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<BudgetItem> BudgetItems => Set<BudgetItem>();
    public DbSet<DocumentCounter> DocumentCounters => Set<DocumentCounter>();
    public DbSet<CompanySettings> CompanySettings => Set<CompanySettings>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<ClientContactPerson> ClientContactPersons => Set<ClientContactPerson>();
    public DbSet<ClientCustomField> ClientCustomFields => Set<ClientCustomField>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<SupplierContactPerson> SupplierContactPersons => Set<SupplierContactPerson>();
    public DbSet<SupplierCustomField> SupplierCustomFields => Set<SupplierCustomField>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasMaxLength(80);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(120);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Id).HasMaxLength(80);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
            entity.Property(p => p.Material).IsRequired().HasMaxLength(200);
            entity.Property(p => p.Price).HasPrecision(12, 2);
            entity.Property(p => p.OriginalPrice).HasPrecision(12, 2);
            entity.Property(p => p.WholesalePrice).HasPrecision(12, 2);

            entity.HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(p => p.Specs)
                .WithOne(s => s.Product)
                .HasForeignKey(s => s.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(p => p.Images)
                .WithOne(i => i.Product)
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Sale>(entity =>
        {
            entity.Property(s => s.Subtotal).HasPrecision(12, 2);
            entity.Property(s => s.DiscountType).HasConversion<string>().HasMaxLength(20);
            entity.Property(s => s.DiscountPercent).HasPrecision(5, 2);
            entity.Property(s => s.DiscountFixedAmount).HasPrecision(12, 2);
            entity.Property(s => s.DiscountAmount).HasPrecision(12, 2);
            entity.Property(s => s.TaxRatePercent).HasPrecision(5, 2);
            entity.Property(s => s.TaxAmount).HasPrecision(12, 2);
            entity.Property(s => s.Total).HasPrecision(12, 2);
            entity.Property(s => s.ClientType).HasConversion<string>().HasMaxLength(20);
            entity.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(s => s.PaymentMethod).HasConversion<string>().HasMaxLength(20);
            entity.HasIndex(s => s.Number).IsUnique();

            entity.OwnsOne(s => s.Customer, customer =>
            {
                customer.Property(c => c.Name).IsRequired().HasMaxLength(200).HasColumnName("Customer_Name");
                customer.Property(c => c.Contact).HasMaxLength(200).HasColumnName("Customer_Contact");
                customer.Property(c => c.TaxId).HasMaxLength(20).HasColumnName("Customer_TaxId");
                customer.Property(c => c.Address).HasMaxLength(300).HasColumnName("Customer_Address");
            });

            entity.HasMany(s => s.Items)
                .WithOne(i => i.Sale)
                .HasForeignKey(i => i.SaleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(s => s.Client)
                .WithMany()
                .HasForeignKey(s => s.ClientId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(s => s.Budget)
                .WithMany()
                .HasForeignKey(s => s.BudgetId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SaleItem>(entity =>
        {
            entity.Property(i => i.UnitPrice).HasPrecision(12, 2);
            entity.Property(i => i.PriceType).HasConversion<string>().HasMaxLength(20);

            entity.HasOne(i => i.Product)
                .WithMany()
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Budget>(entity =>
        {
            entity.Property(b => b.Subtotal).HasPrecision(12, 2);
            entity.Property(b => b.DiscountType).HasConversion<string>().HasMaxLength(20);
            entity.Property(b => b.DiscountPercent).HasPrecision(5, 2);
            entity.Property(b => b.DiscountFixedAmount).HasPrecision(12, 2);
            entity.Property(b => b.DiscountAmount).HasPrecision(12, 2);
            entity.Property(b => b.TaxRatePercent).HasPrecision(5, 2);
            entity.Property(b => b.TaxAmount).HasPrecision(12, 2);
            entity.Property(b => b.Total).HasPrecision(12, 2);
            entity.Property(b => b.ClientType).HasConversion<string>().HasMaxLength(20);
            entity.Property(b => b.Status).HasConversion<string>().HasMaxLength(20);
            entity.HasIndex(b => b.Number).IsUnique();

            entity.OwnsOne(b => b.Customer, customer =>
            {
                customer.Property(c => c.Name).IsRequired().HasMaxLength(200).HasColumnName("Customer_Name");
                customer.Property(c => c.Contact).HasMaxLength(200).HasColumnName("Customer_Contact");
                customer.Property(c => c.TaxId).HasMaxLength(20).HasColumnName("Customer_TaxId");
                customer.Property(c => c.Address).HasMaxLength(300).HasColumnName("Customer_Address");
            });

            entity.HasMany(b => b.Items)
                .WithOne(i => i.Budget)
                .HasForeignKey(i => i.BudgetId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.Client)
                .WithMany()
                .HasForeignKey(b => b.ClientId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(b => b.ConvertedSale)
                .WithMany()
                .HasForeignKey(b => b.ConvertedSaleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<BudgetItem>(entity =>
        {
            entity.Property(i => i.UnitPrice).HasPrecision(12, 2);
            entity.Property(i => i.PriceType).HasConversion<string>().HasMaxLength(20);

            entity.HasOne(i => i.Product)
                .WithMany()
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DocumentCounter>(entity =>
        {
            entity.HasKey(c => c.Type);
            entity.Property(c => c.Type).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<CompanySettings>(entity =>
        {
            entity.Property(c => c.Name).IsRequired().HasMaxLength(200);
            entity.Property(c => c.Phone).HasMaxLength(50);
            entity.Property(c => c.LogoPath).HasMaxLength(300);
        });

        modelBuilder.Entity<Client>(entity =>
        {
            ConfigureParty(entity);
            entity.Property(c => c.NicknameML).HasMaxLength(100);
            entity.Property(c => c.SalesCategory).HasMaxLength(120);
            entity.Property(c => c.SalesDiscountPercent).HasPrecision(5, 2);
            entity.Property(c => c.NoteForClient).HasMaxLength(2000);

            entity.HasMany(c => c.ContactPersons)
                .WithOne(cp => cp.Client)
                .HasForeignKey(cp => cp.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(c => c.CustomFields)
                .WithOne(cf => cf.Client)
                .HasForeignKey(cf => cf.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ClientContactPerson>(entity =>
        {
            entity.Property(cp => cp.Name).IsRequired().HasMaxLength(200);
            entity.Property(cp => cp.Role).HasMaxLength(120);
            entity.Property(cp => cp.Cell).HasMaxLength(30);
            entity.Property(cp => cp.Phone).HasMaxLength(30);
            entity.Property(cp => cp.Email).HasMaxLength(200);
        });

        modelBuilder.Entity<ClientCustomField>(entity =>
        {
            entity.Property(cf => cf.Label).IsRequired().HasMaxLength(120);
            entity.Property(cf => cf.Value).IsRequired().HasMaxLength(500);
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            ConfigureParty(entity);
            entity.Property(s => s.PurchasesCategory).HasMaxLength(120);
            entity.Property(s => s.PurchasesDiscountPercent).HasPrecision(5, 2);
            entity.Property(s => s.NoteInternal).HasMaxLength(2000);

            entity.HasMany(s => s.ContactPersons)
                .WithOne(cp => cp.Supplier)
                .HasForeignKey(cp => cp.SupplierId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(s => s.CustomFields)
                .WithOne(cf => cf.Supplier)
                .HasForeignKey(cf => cf.SupplierId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SupplierContactPerson>(entity =>
        {
            entity.Property(cp => cp.Name).IsRequired().HasMaxLength(200);
            entity.Property(cp => cp.Role).HasMaxLength(120);
            entity.Property(cp => cp.Cell).HasMaxLength(30);
            entity.Property(cp => cp.Phone).HasMaxLength(30);
            entity.Property(cp => cp.Email).HasMaxLength(200);
        });

        modelBuilder.Entity<SupplierCustomField>(entity =>
        {
            entity.Property(cf => cf.Label).IsRequired().HasMaxLength(120);
            entity.Property(cf => cf.Value).IsRequired().HasMaxLength(500);
        });
    }

    private static void ConfigureParty<T>(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<T> entity) where T : PartyBase
    {
        entity.Property(p => p.CompanyOrFullName).IsRequired().HasMaxLength(200);
        entity.Property(p => p.FirstName).HasMaxLength(100);
        entity.Property(p => p.LastName).HasMaxLength(100);
        entity.Property(p => p.Cell).HasMaxLength(30);
        entity.Property(p => p.Phone).HasMaxLength(30);
        entity.Property(p => p.Email).HasMaxLength(200);
        entity.Property(p => p.WebPage).HasMaxLength(300);
        entity.Property(p => p.Address).HasMaxLength(300);
        entity.Property(p => p.Province).HasMaxLength(100);
        entity.Property(p => p.PostalCode).HasMaxLength(20);
        entity.Property(p => p.Locality).HasMaxLength(100);
        entity.Property(p => p.Note).HasMaxLength(2000);
        entity.Property(p => p.InitialBalance).HasPrecision(12, 2);

        entity.Property(p => p.BillingCompanyOrFullName).IsRequired().HasMaxLength(200);
        entity.Property(p => p.TaxId).HasMaxLength(20);
        entity.Property(p => p.IvaCondition).HasConversion<string>().HasMaxLength(30);
        entity.Property(p => p.DefaultReceiptType).HasConversion<string>().HasMaxLength(20);
        entity.Property(p => p.BillingPhone).HasMaxLength(30);
        entity.Property(p => p.BillingCell).HasMaxLength(30);
        entity.Property(p => p.FiscalAddress).HasMaxLength(300);
        entity.Property(p => p.FiscalLocality).HasMaxLength(100);
        entity.Property(p => p.FiscalProvince).HasMaxLength(100);
        entity.Property(p => p.FiscalPostalCode).HasMaxLength(20);

        entity.HasIndex(p => p.TaxId);
    }
}
