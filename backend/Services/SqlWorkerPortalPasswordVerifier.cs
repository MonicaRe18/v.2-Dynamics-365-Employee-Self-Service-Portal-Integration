using System.Data;
using Microsoft.Data.SqlClient;

namespace D365.Ess.Api.Services;

public interface IWorkerPortalPasswordVerifier
{
    Task<bool> VerifyAsync(string personnelNumber, string partyNumber, string password, CancellationToken ct);
    Task<bool> ChangeAsync(string personnelNumber, string partyNumber, string currentPassword, string newPassword, CancellationToken ct);
}

// OneBox-only bridge until a Dynamics custom authentication service is deployed.
// The password is compared in AxDB and is never selected into the API process.
public sealed class SqlWorkerPortalPasswordVerifier : IWorkerPortalPasswordVerifier
{
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public SqlWorkerPortalPasswordVerifier(IConfiguration configuration, IWebHostEnvironment environment)
    {
        _configuration = configuration;
        _environment = environment;
    }

    public async Task<bool> VerifyAsync(string personnelNumber, string partyNumber, string password, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(personnelNumber) || string.IsNullOrWhiteSpace(partyNumber)
            || string.IsNullOrEmpty(password) || password.Length > 50)
            return false;

        if (!_environment.IsDevelopment())
            throw new InvalidOperationException("OneBox worker-password verification is disabled outside Development.");

        var connectionString = Environment.GetEnvironmentVariable("AXDB_CONNECTION_STRING")
            ?? _configuration.GetConnectionString("AxDb");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("AxDB password-verification connection is not configured.");

        const string sql = """
            SELECT CAST(CASE WHEN EXISTS (
                SELECT 1
                FROM dbo.HCMWORKER AS worker
                INNER JOIN dbo.DIRPARTYTABLE AS party
                    ON party.RECID = worker.PERSON AND party.PARTITION = worker.PARTITION
                WHERE worker.PERSONNELNUMBER = @personnelNumber
                    AND party.PARTYNUMBER = @partyNumber
                    AND worker.USERPORTALPASSWORD <> N''
                    AND worker.USERPORTALPASSWORD COLLATE Latin1_General_100_BIN2
                        = @password COLLATE Latin1_General_100_BIN2
                    AND DATALENGTH(worker.USERPORTALPASSWORD) = DATALENGTH(@password)
            ) THEN 1 ELSE 0 END AS bit)
            """;

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(ct);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@personnelNumber", SqlDbType.NVarChar, 50).Value = personnelNumber;
        command.Parameters.Add("@partyNumber", SqlDbType.NVarChar, 50).Value = partyNumber;
        command.Parameters.Add("@password", SqlDbType.NVarChar, 50).Value = password;
        return (bool)(await command.ExecuteScalarAsync(ct) ?? false);
    }

    public async Task<bool> ChangeAsync(string personnelNumber, string partyNumber, string currentPassword, string newPassword, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(personnelNumber) || string.IsNullOrWhiteSpace(partyNumber)
            || string.IsNullOrEmpty(currentPassword) || currentPassword.Length > 50
            || string.IsNullOrWhiteSpace(newPassword) || newPassword.Length is < 8 or > 50)
            return false;

        if (!_environment.IsDevelopment())
            throw new InvalidOperationException("OneBox worker-password updates are disabled outside Development.");

        var connectionString = Environment.GetEnvironmentVariable("AXDB_CONNECTION_STRING")
            ?? _configuration.GetConnectionString("AxDb");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("AxDB password-update connection is not configured.");

        const string sql = """
            UPDATE worker
            SET USERPORTALPASSWORD = @newPassword,
                RECVERSION = worker.RECVERSION + 1,
                MODIFIEDDATETIME = SYSUTCDATETIME(),
                MODIFIEDBY = N'ESSPortal'
            FROM dbo.HCMWORKER AS worker
            INNER JOIN dbo.DIRPARTYTABLE AS party
                ON party.RECID = worker.PERSON AND party.PARTITION = worker.PARTITION
            WHERE worker.PERSONNELNUMBER = @personnelNumber
                AND party.PARTYNUMBER = @partyNumber
                AND worker.USERPORTALPASSWORD <> N''
                AND worker.USERPORTALPASSWORD COLLATE Latin1_General_100_BIN2
                    = @currentPassword COLLATE Latin1_General_100_BIN2
                AND DATALENGTH(worker.USERPORTALPASSWORD) = DATALENGTH(@currentPassword);
            SELECT @@ROWCOUNT;
            """;

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(ct);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@personnelNumber", SqlDbType.NVarChar, 50).Value = personnelNumber;
        command.Parameters.Add("@partyNumber", SqlDbType.NVarChar, 50).Value = partyNumber;
        command.Parameters.Add("@currentPassword", SqlDbType.NVarChar, 50).Value = currentPassword;
        command.Parameters.Add("@newPassword", SqlDbType.NVarChar, 50).Value = newPassword;
        return Convert.ToInt32(await command.ExecuteScalarAsync(ct)) == 1;
    }
}
