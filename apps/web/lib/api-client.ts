import type { ApiResponse } from '@localcompliance/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

interface FetchOptions extends RequestInit {
  token?: string;
}

/**
 * Typed API client for NestJS backend calls.
 * Automatically injects auth header and parses JSON responses.
 */
export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    credentials: 'include', // Send httpOnly cookies automatically
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
