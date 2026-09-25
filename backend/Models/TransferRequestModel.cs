using System.Text.Json.Serialization;

namespace D365.Ess.Api.Models;

public class TransferRequestModel
{
    [JsonPropertyName("transferDate")]
    public string TransferDate { get; set; } = string.Empty;

    [JsonPropertyName("transferTo")]
    public string TransferTo { get; set; } = string.Empty;
}
