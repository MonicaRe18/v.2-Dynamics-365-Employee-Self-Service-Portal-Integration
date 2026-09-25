using System.Text.Json.Serialization;

namespace D365.Ess.Api.Models;

public class SecondmentRequestModel
{
    [JsonPropertyName("applicationDate")]
    public string ApplicationDate { get; set; } = string.Empty;

    [JsonPropertyName("borrowingEntity")]
    public string BorrowingEntity { get; set; } = string.Empty;
}
