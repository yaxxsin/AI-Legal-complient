import type { ApiResponse } from '@localcompliance/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface FetchOptions extends RequestInit {
  token?: string;
  query?: Record<string, string | number>;
}

async function request<T>(
  method: string,
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { token, query, headers: customHeaders, ...rest } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => params.set(k, String(v)));
    url += `?${params}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    ...rest,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      success: false,
      error: { code: 'NETWORK_ERROR', message: response.statusText },
    }));
    throw error;
  }

  return response.json();
}

/**
 * Typed API client for NestJS backend calls.
 * Automatically injects auth header and parses JSON responses.
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: FetchOptions) => request<T>('GET', endpoint, options),
  post: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    request<T>('POST', endpoint, { ...options, body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    request<T>('PATCH', endpoint, { ...options, body: JSON.stringify(data) }),
  delete: <T>(endpoint: string, options?: FetchOptions) =>
    request<T>('DELETE', endpoint, options),
};
