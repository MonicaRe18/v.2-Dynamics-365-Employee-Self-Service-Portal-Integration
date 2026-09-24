/**
 * Microsoft Dynamics 365 Backend API Configuration
 * React connects exclusively to the ASP.NET Core Web API proxy.
 * TenantId, ClientId, ClientSecret, BaseUrl and LegalEntity are kept strictly in backend environment variables.
 */

export const D365_CONFIG = {
  // Base URL for ASP.NET Core 8 Web API backend proxy
  baseUrl: '/api/d365',
  timeoutMs: 15000,
  retryCount: 1,
};
