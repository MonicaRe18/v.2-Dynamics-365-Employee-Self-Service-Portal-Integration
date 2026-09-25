using System.Text.Json.Serialization;

namespace D365.Ess.Api.Models;

public class ReassignmentRequestModel
{
    [JsonPropertyName("applicationDate")]
    public string ApplicationDate { get; set; } = string.Empty;

    [JsonPropertyName("newAddress")]
    public string NewAddress { get; set; } = string.Empty;

    [JsonPropertyName("reassignmentType")]
    public int ReassignmentType { get; set; }

    [JsonPropertyName("newCityKey")]
    public string NewCityKey { get; set; } = string.Empty;
}

public class ReassignmentCityDto
{
    [JsonPropertyName("cityKey")]
    public string CityKey { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class D365AddressCityRecord
{
    public string CityKey { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CountryRegionId { get; set; } = string.Empty;
}
