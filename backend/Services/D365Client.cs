using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using D365.Ess.Api.Models;
using Microsoft.Extensions.Options;

namespace D365.Ess.Api.Services;

public interface ID365Client
{
    Task<T?> GetAsync<T>(string entitySet, string? queryParams = null, CancellationToken cancellationToken = default);
    Task<TResponse?> PostAsync<TRequest, TResponse>(string entitySet, TRequest body, CancellationToken cancellationToken = default);
    Task<bool> PostActionAsync(string entitySetAndAction, CancellationToken cancellationToken = default);
    Task<string> PostCustomRequestAsync(string relativePath, object body, CancellationToken cancellationToken = default);
    Task<TResponse?> PatchAsync<TRequest, TResponse>(string entitySetAndKey, TRequest body, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string entitySetAndKey, CancellationToken cancellationToken = default);
    Task<bool> PingAsync(CancellationToken cancellationToken = default);
}

public class D365Client : ID365Client
{
    private readonly HttpClient _httpClient;
    private readonly D365Settings _settings;
    private readonly ILogger<D365Client> _logger;
    private string? _cachedAccessToken;
    private DateTime _tokenExpiration = DateTime.MinValue;
    private readonly SemaphoreSlim _tokenSemaphore = new(1, 1);

    public D365Client(HttpClient httpClient, IOptions<D365Settings> options, ILogger<D365Client> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value;
        _logger = logger;
    }

    private async Task<string?> GetAccessTokenAsync(CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(_cachedAccessToken) && DateTime.UtcNow.AddMinutes(5) < _tokenExpiration)
        {
            return _cachedAccessToken;
        }

        await _tokenSemaphore.WaitAsync(cancellationToken);
        try
        {
            if (!string.IsNullOrEmpty(_cachedAccessToken) && DateTime.UtcNow.AddMinutes(5) < _tokenExpiration)
            {
                return _cachedAccessToken;
            }

            if (!_settings.IsConfigured)
            {
                throw new D365ConfigurationException(_settings.GetMissingConfigurations());
            }

            var tokenEndpoint = $"https://login.microsoftonline.com/{_settings.TenantId}/oauth2/v2.0/token";
            var tokenRequest = new HttpRequestMessage(HttpMethod.Post, tokenEndpoint)
            {
                Content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    { "grant_type", "client_credentials" },
                    { "client_id", _settings.ClientId },
                    { "client_secret", _settings.ClientSecret },
                    { "scope", $"{(_settings.ResourceUrl.Length > 0 ? _settings.ResourceUrl : _settings.BaseUrl).TrimEnd('/')}/.default" }
                })
            };

            var response = await _httpClient.SendAsync(tokenRequest, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to acquire Dynamics 365 OAuth token: {Error}", err);
                throw new HttpRequestException($"Dynamics 365 OAuth token acquisition failed ({response.StatusCode}): {err}");
            }

            using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
            var root = doc.RootElement;
            if (root.TryGetProperty("access_token", out var tokenProp))
            {
                _cachedAccessToken = tokenProp.GetString();
                int expiresIn = root.TryGetProperty("expires_in", out var exp) ? exp.GetInt32() : 3599;
                _tokenExpiration = DateTime.UtcNow.AddSeconds(expiresIn);
                _logger.LogInformation("Acquired Dynamics 365 OAuth token successfully. Expires in {Sec}s.", expiresIn);
                return _cachedAccessToken;
            }

            throw new InvalidOperationException("Dynamics 365 OAuth token response did not contain an access_token.");
        }
        finally
        {
            _tokenSemaphore.Release();
        }
    }

    private async Task<HttpRequestMessage> CreateD365Request(HttpMethod method, string path, CancellationToken cancellationToken)
    {
        var cleanBase = _settings.BaseUrl.TrimEnd('/');
        var cleanPath = path.StartsWith('/') ? path : $"/{path}";
        var url = $"{cleanBase}{_settings.ODataPath}{cleanPath}";

        var request = new HttpRequestMessage(method, url);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.Add("OData-Version", "4.0");
        request.Headers.Add("OData-MaxVersion", "4.0");
        request.Headers.Add("Prefer", "return=representation");

        var token = await GetAccessTokenAsync(cancellationToken);
        if (!string.IsNullOrEmpty(token))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return request;
    }

    public async Task<T?> GetAsync<T>(string entitySet, string? queryParams = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var path = string.IsNullOrWhiteSpace(queryParams)
                ? entitySet
                : $"{entitySet}?{queryParams}";

            var request = await CreateD365Request(HttpMethod.Get, path, cancellationToken);
            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("D365 GET {Entity} returned {StatusCode}: {Error}", entitySet, response.StatusCode, errorText);
                return default;
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing D365 GET {Entity}", entitySet);
            return default;
        }
    }

    public async Task<TResponse?> PostAsync<TRequest, TResponse>(string entitySet, TRequest body, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = await CreateD365Request(HttpMethod.Post, entitySet, cancellationToken);
            var json = JsonSerializer.Serialize(body);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("D365 POST {Entity} returned {StatusCode}: {Error}", entitySet, response.StatusCode, errorText);
                return default;
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            return JsonSerializer.Deserialize<TResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing D365 POST {Entity}", entitySet);
            return default;
        }
    }

    public async Task<bool> PostActionAsync(string entitySetAndAction, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = await CreateD365Request(HttpMethod.Post, entitySetAndAction, cancellationToken);
            request.Content = new StringContent("{}", Encoding.UTF8, "application/json");
            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode) return true;

            var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("D365 action {Entity} returned {StatusCode}: {Error}", entitySetAndAction, response.StatusCode, errorText);
            string message;
            try
            {
                using var errorJson = JsonDocument.Parse(errorText);
                var error = errorJson.RootElement.GetProperty("error");
                message = error.GetProperty("message").GetString() ?? "Dynamics rejected the action.";
                if (message == "An error has occurred."
                    && error.TryGetProperty("innererror", out var inner)
                    && inner.TryGetProperty("message", out var innerMessage))
                    message = innerMessage.GetString() ?? message;
            }
            catch (Exception)
            {
                message = "Dynamics rejected the action.";
            }
            throw new InvalidOperationException($"Dynamics submit failed (HTTP {(int)response.StatusCode}): {message[..Math.Min(message.Length, 500)]}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing D365 action {Entity}", entitySetAndAction);
            throw;
        }
    }

    public async Task<string> PostCustomRequestAsync(string relativePath, object body, CancellationToken cancellationToken = default)
    {
        if (!relativePath.StartsWith('/') || relativePath.StartsWith("//") || relativePath.Contains("..") || relativePath.Contains('?'))
            throw new ArgumentException("Dynamics service path must be an absolute relative path without a query string.", nameof(relativePath));

        using var request = new HttpRequestMessage(HttpMethod.Post, _settings.BaseUrl.TrimEnd('/') + relativePath);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", await GetAccessTokenAsync(cancellationToken));
        request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            using var result = JsonDocument.Parse(responseBody);
            var root = result.RootElement;
            var assignmentId = root.ValueKind == JsonValueKind.String ? root.GetString()
                : root.TryGetProperty("result", out var value) && value.ValueKind == JsonValueKind.String ? value.GetString()
                : null;
            if (!string.IsNullOrWhiteSpace(assignmentId)) return assignmentId;
            throw new InvalidOperationException("Dynamics did not return a reassignment request number.");
        }

        _logger.LogWarning("D365 custom service {Path} returned {StatusCode}: {Error}", relativePath, response.StatusCode, responseBody);
        throw new InvalidOperationException($"Dynamics custom service request failed (HTTP {(int)response.StatusCode}): {responseBody[..Math.Min(responseBody.Length, 500)]}");
    }

    public async Task<TResponse?> PatchAsync<TRequest, TResponse>(string entitySetAndKey, TRequest body, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = await CreateD365Request(HttpMethod.Patch, entitySetAndKey, cancellationToken);
            var json = JsonSerializer.Serialize(body);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("D365 PATCH {Entity} returned {StatusCode}: {Error}", entitySetAndKey, response.StatusCode, errorText);
                return default;
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            return JsonSerializer.Deserialize<TResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing D365 PATCH {Entity}", entitySetAndKey);
            return default;
        }
    }

    public async Task<bool> DeleteAsync(string entitySetAndKey, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = await CreateD365Request(HttpMethod.Delete, entitySetAndKey, cancellationToken);
            var response = await _httpClient.SendAsync(request, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing D365 DELETE {Entity}", entitySetAndKey);
            return false;
        }
    }

    public async Task<bool> PingAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var request = await CreateD365Request(HttpMethod.Get, "/", cancellationToken);
            var response = await _httpClient.SendAsync(request, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }
}
