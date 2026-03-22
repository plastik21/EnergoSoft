using EnergoSoft.Server;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var dbConnString = builder.Configuration.GetConnectionString("DefaultConnection");

// Add services to the container.
builder.Services.AddDbContext<EnergoSoftDbContext>(options => options.UseNpgsql(dbConnString));
builder.Services.AddControllers();
builder.Services.AddOpenApi(); // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi

if (builder.Environment.IsDevelopment())
{
    // Настройка CORS
    var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();

    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {            
            policy.WithOrigins(allowedOrigins ?? [])
            .AllowAnyHeader()
            .AllowAnyMethod();
        });
    });
}

var app = builder.Build();

if (app.Environment.IsProduction())
{
    // Применение миграции
    using var scope = app.Services.CreateScope();

    var context = scope.ServiceProvider.GetRequiredService<EnergoSoftDbContext>();

    context.Database.Migrate();
}

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseDeveloperExceptionPage();    
    app.UseHttpsRedirection();
    app.UseCors();
}

app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("/index.html");

app.Run();
