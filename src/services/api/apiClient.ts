/**
 * Microsoft Dynamics 365 Core API Client
 *
 * Implements real HTTP communication with D365 backend services.
 * Features:
 * - Dynamic Base URL from environment variables
 * - Real Pending, Success, and Error states (never fakes Synced)
 * - Bearer Token authentication injection from authService
 * - OData v4 Headers (OData-Version, Accept, Prefer)
 * - Comprehensive HTTP and Network error reporting
 */

import { D365_CONFIG } from './config';
import { authService } from '../authService';

export type ApiStatus = 'idle' | 'pending' | 'success' | 'error';

export interface ApiResponse<T> {
  status: ApiStatus;
  data: T | null;
  error: string | null;
  statusCode: number;
  timestamp: string;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  endpoint: string;
  odataContext?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = D365_CONFIG.baseUrl.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(newUrl: string): void {
    this.baseUrl = newUrl.replace(/\/+$/, '');
  }

  /**
   * Builds standard HTTP headers including Dynamics 365 OData v4 conventions
   */
  private getHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders);

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json, text/plain, */*');
    }
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json; charset=utf-8');
    }
    if (!headers.has('OData-Version')) {
      headers.set('OData-Version', '4.0');
    }
    if (!headers.has('OData-MaxVersion')) {
      headers.set('OData-MaxVersion', '4.0');
    }
    if (!headers.has('Prefer')) {
      headers.set('Prefer', 'return=representation');
    }

    // Attach active authorization token if user is authenticated
    const session = authService.getCurrentSession();
    if (session && session.token) {
      headers.set('Authorization', `Bearer ${session.token}`);
    }

    return headers;
  }

  /**
   * Core request dispatcher returning real Pending, Success, or Error states
   */
  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${this.baseUrl}${cleanEndpoint}`;
    const timestamp = new Date().toISOString();

    const headers = this.getHeaders(options.headers);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), D365_CONFIG.timeoutMs);

      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK HTTP status codes (4xx, 5xx)
      if (!response.ok) {
        if (response.status === 401 && authService.isAuthenticated()) {
          authService.invalidateSession();
        }
        let errorMessage = `خطأ في استجابة خادم Dynamics 365 [HTTP ${response.status} ${response.statusText}]`;
        try {
          const errData = await response.json();
          if (errData && (errData.error?.message || errData.message)) {
            errorMessage = errData.error?.message || errData.message;
          }
        } catch {
          // Response body was not JSON
        }

        return {
          status: 'error',
          data: null,
          error: errorMessage,
          statusCode: response.status,
          timestamp,
          isPending: false,
          isSuccess: false,
          isError: true,
          endpoint: cleanEndpoint,
        };
      }

      // 204 No Content
      if (response.status === 204) {
        return {
          status: 'success',
          data: null as unknown as T,
          error: null,
          statusCode: 204,
          timestamp,
          isPending: false,
          isSuccess: true,
          isError: false,
          endpoint: cleanEndpoint,
        };
      }

      // Parse JSON payload
      const json = await response.json();
      const odataContext = json?.['@odata.context'];
      // If OData response wraps results in 'value', extract if T is an array or if json itself is desired
      const dataPayload: T = json?.value !== undefined ? (json.value as T) : (json as T);

      return {
        status: 'success',
        data: dataPayload,
        error: null,
        statusCode: response.status,
        timestamp,
        isPending: false,
        isSuccess: true,
        isError: false,
        endpoint: cleanEndpoint,
        odataContext,
      };
    } catch (err: unknown) {
      let errorMsg = 'تعذر الاتصال بخدمة Microsoft Dynamics 365. تحقق من إعدادات الشبكة ومسار الخادم.';

      if (err instanceof DOMException && err.name === 'AbortError') {
        errorMsg = `انتهت مهلة انتظار خادم Dynamics 365 (${D365_CONFIG.timeoutMs / 1000} ثانية). الخادم لم يستجب.`;
      } else if (err instanceof Error && err.message) {
        errorMsg = `فشل الاتصال بـ Dynamics 365: ${err.message}`;
      }

      return {
        status: 'error',
        data: null,
        error: errorMsg,
        statusCode: 0,
        timestamp,
        isPending: false,
        isSuccess: false,
        isError: true,
        endpoint: cleanEndpoint,
      };
    }
  }

  public get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
