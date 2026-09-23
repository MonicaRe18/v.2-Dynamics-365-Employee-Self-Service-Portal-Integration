/**
 * Microsoft Dynamics 365 API Configuration
 * Reads Base URL and parameters from environment variables with sensible defaults
 */

const env = typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env
  ? (import.meta as unknown as { env: Record<string, string> }).env
  : {};

export const D365_CONFIG = {
  // Base URL for Microsoft Dynamics 365 OData & REST integration endpoints
  baseUrl: env.VITE_D365_API_BASE_URL || '/api/d365',
  environment: env.VITE_D365_ENVIRONMENT || 'Contoso-EG01-Production',
  legalEntity: env.VITE_D365_LEGAL_ENTITY || 'EG01',
  timeoutMs: 15000,
  retryCount: 1,
};
