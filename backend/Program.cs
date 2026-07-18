using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Filters;
using backend.Services;
using QuestPDF.Infrastructure;

QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<RequireAdminKeyFilter>();
builder.Services.AddScoped<DocumentNumberingService>();
builder.Services.AddScoped<ReceiptPdfService>();
builder.Services.AddScoped<ClientExcelService>();
builder.Services.AddScoped<SupplierExcelService>();
builder.Services.AddScoped<StockService>();
builder.Services.AddScoped<BudgetLifecycleService>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
using (var migrationScope = app.Services.CreateScope())
{
    var db = migrationScope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();

    using var seedScope = app.Services.CreateScope();
    await backend.Data.DbSeeder.SeedAsync(seedScope.ServiceProvider.GetRequiredService<AppDbContext>());
}

app.UseCors("Frontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
