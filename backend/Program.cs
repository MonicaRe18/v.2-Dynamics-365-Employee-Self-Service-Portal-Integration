using System.Text;
using D365.Ess.Api.Middleware;
using D365.Ess.Api.Models;
using D365.Ess.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Strongly-typed Configuration & Environment Variables Binding
// Check if .env file exists in working dir or parent dir
var envFiles = new[] { ".env", "../.env", Path.Combine(Directory.GetCurrentDirectory(), ".env"), Path.Combine(AppContext.BaseDirectory, ".env") };
foreach (var envFile in envFiles)
{
    if (File.Exists(envFile))
    {
        foreach (var line in File.ReadAllLines(envFile))
        {
            var trimmed = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("#")) continue;
            var parts = trimmed.Split('=', 2);
            if (parts.Length == 2)
            {
                var k = parts[0].Trim();
                var v = parts[1].Trim().Trim('"').Trim('\'');
                if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(k)))
                {
                    Environment.SetEnvironmentVariable(k, v);
                }
            }
        }
        break;
    }
}

// Ensure JWT secret key comes exclusively from environment variables
var jwtSecretKey = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? Environment.GetEnvironmentVariable("JwtSettings__SecretKey")
    ?? Environment.GetEnvironmentVariable("JWT_SECRET_KEY");

if (string.IsNullOrWhiteSpace(jwtSecretKey))
{
    // In production, if JwtSettings__SecretKey is missing, fail application startup.
    // Do not generate an ephemeral JWT secret automatically.
    // Keep fallback generation only for Development environment if needed.
    if (!builder.Environment.IsDevelopment())
    {
        throw new InvalidOperationException("Fatal Configuration Error: JwtSettings__SecretKey (or JWT_SECRET) is missing in production environment. Application startup aborted.");
    }
    jwtSecretKey = "D365_ESS_DEV_" + Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)) + "_SECURE";
}

var jwtSettings = new JwtSettings
{
    SecretKey = jwtSecretKey,
    Issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? builder.Configuration["JwtSettings:Issuer"] ?? "D365.Ess.Api",
    Audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? builder.Configuration["JwtSettings:Audience"] ?? "D365.Ess.Client",
    ExpirationMinutes = int.TryParse(Environment.GetEnvironmentVariable("JWT_EXPIRATION_MINUTES"), out var expMin) ? expMin : 120
};

// Ensure Dynamics 365 credentials come exclusively from environment variables
var d365Settings = new D365Settings
{
    BaseUrl = Environment.GetEnvironmentVariable("D365_BASE_URL")
        ?? Environment.GetEnvironmentVariable("D365Settings__BaseUrl")
        ?? builder.Configuration["D365Settings:BaseUrl"] ?? string.Empty,
    ODataPath = Environment.GetEnvironmentVariable("D365_ODATA_PATH")
        ?? Environment.GetEnvironmentVariable("D365Settings__ODataPath")
        ?? builder.Configuration["D365Settings:ODataPath"] ?? "/data",
    TenantId = Environment.GetEnvironmentVariable("D365_TENANT_ID")
        ?? Environment.GetEnvironmentVariable("D365Settings__TenantId")
        ?? builder.Configuration["D365Settings:TenantId"] ?? string.Empty,
    ClientId = Environment.GetEnvironmentVariable("D365_CLIENT_ID")
        ?? Environment.GetEnvironmentVariable("D365Settings__ClientId")
        ?? builder.Configuration["D365Settings:ClientId"] ?? string.Empty,
    ClientSecret = Environment.GetEnvironmentVariable("D365_CLIENT_SECRET")
        ?? Environment.GetEnvironmentVariable("D365Settings__ClientSecret")
        ?? builder.Configuration["D365Settings:ClientSecret"] ?? string.Empty,
    ResourceUrl = Environment.GetEnvironmentVariable("D365_RESOURCE_URL")
        ?? Environment.GetEnvironmentVariable("D365Settings__ResourceUrl")
        ?? builder.Configuration["D365Settings:ResourceUrl"] ?? string.Empty,
    LegalEntity = Environment.GetEnvironmentVariable("D365_LEGAL_ENTITY")
        ?? Environment.GetEnvironmentVariable("D365Settings__LegalEntity")
        ?? builder.Configuration["D365Settings:LegalEntity"] ?? string.Empty,
    ReassignmentEndpointPath = Environment.GetEnvironmentVariable("D365_REASSIGNMENT_ENDPOINT_PATH")
        ?? Environment.GetEnvironmentVariable("D365Settings__ReassignmentEndpointPath")
        ?? builder.Configuration["D365Settings:ReassignmentEndpointPath"] ?? "/api/services/PAR_EssAssignmentServiceGroup/PAR_EssAssignmentService/submitAssignment",
    TimeoutSeconds = int.TryParse(Environment.GetEnvironmentVariable("D365_TIMEOUT_SECONDS"), out var timeout) ? timeout : 30
};

var employeeLoginSettings = new EmployeeLoginSettings
{
    EmployeeEntitySet = Environment.GetEnvironmentVariable("D365_EMPLOYEE_ENTITY_SET")
        ?? Environment.GetEnvironmentVariable("EmployeeLogin__EmployeeEntitySet")
        ?? builder.Configuration["EmployeeLogin:EmployeeEntitySet"] ?? "Employees",
    IdentificationEntitySet = Environment.GetEnvironmentVariable("D365_IDENTIFICATION_ENTITY_SET")
        ?? Environment.GetEnvironmentVariable("EmployeeLogin__IdentificationEntitySet")
        ?? builder.Configuration["EmployeeLogin:IdentificationEntitySet"] ?? "PersonIdentificationNumbers",
    NationalIdField = Environment.GetEnvironmentVariable("D365_NATIONAL_ID_FIELD")
        ?? Environment.GetEnvironmentVariable("EmployeeLogin__NationalIdField")
        ?? builder.Configuration["EmployeeLogin:NationalIdField"] ?? "IdentificationNumber",
    NationalIdTypeId = Environment.GetEnvironmentVariable("D365_NATIONAL_ID_TYPE_ID")
        ?? Environment.GetEnvironmentVariable("EmployeeLogin__NationalIdTypeId")
        ?? builder.Configuration["EmployeeLogin:NationalIdTypeId"] ?? "National ID"
};

builder.Services.AddSingleton(Microsoft.Extensions.Options.Options.Create(jwtSettings));
builder.Services.AddSingleton(Microsoft.Extensions.Options.Options.Create(d365Settings));
builder.Services.AddSingleton(Microsoft.Extensions.Options.Options.Create(employeeLoginSettings));

// 2. Add Core Services & Dependency Injection
builder.Services.AddSingleton<IAuditLogger, AuditLogger>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpClient<ID365Client, D365Client>();
builder.Services.AddScoped<IWorkerPortalPasswordVerifier, SqlWorkerPortalPasswordVerifier>();
builder.Services.AddScoped<ID365Service, D365Service>();

// 3. Add Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// 4. JWT Authentication
var key = Encoding.UTF8.GetBytes(jwtSettings.SecretKey);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// 5. Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireEssUser", policy => policy.RequireRole(UserRoles.EssUser));
    options.AddPolicy("RequireMssMgr", policy => policy.RequireRole(UserRoles.MssMgr));
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole(UserRoles.SystemAdmin, UserRoles.HrAdmin));
});

// 6. CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 7. Swagger / OpenAPI Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Microsoft Dynamics 365 Finance & Operations ESS Web API (.NET 8)",
        Version = "v1",
        Description = "ASP.NET Core 8 Web API for Dynamics 365 Human Resources Employee Self-Service (ESS) & Manager Self-Service (MSS) integration"
    });

    // Add JWT Bearer Security to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 8. Middleware Pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<AuditLoggingMiddleware>();

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Dynamics 365 ESS API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// Serve static frontend build if present in dist or wwwroot
var potentialPaths = new[]
{
    Path.Combine(Directory.GetCurrentDirectory(), "dist"),
    Path.Combine(Directory.GetCurrentDirectory(), "..", "dist"),
    Path.Combine(AppContext.BaseDirectory, "dist"),
    Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "dist"))
};

string? resolvedDistPath = potentialPaths.FirstOrDefault(p => Directory.Exists(p) && File.Exists(Path.Combine(p, "index.html")));

if (resolvedDistPath != null)
{
    Console.WriteLine($"[ASP.NET Core 8] Serving SPA from: {resolvedDistPath}");
    var fileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(resolvedDistPath);

    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = fileProvider
    });

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = fileProvider
    });

    app.MapControllers();

    app.MapFallbackToFile("index.html", new StaticFileOptions
    {
        FileProvider = fileProvider
    });
}
else
{
    Console.WriteLine("[ASP.NET Core 8] Note: dist/index.html not found yet. Running in API-only mode.");
    app.MapControllers();
}

app.Run();
