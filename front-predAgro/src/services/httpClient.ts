const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3333/api';

interface RequestOptions extends RequestInit {
  token?: string;
  skipAuthRetry?: boolean;
}

interface ApiClientAuthHandlers {
  refreshAccessToken: () => Promise<string | null>;
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let authHandlers: ApiClientAuthHandlers | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function configureApiClientAuth(nextHandlers: ApiClientAuthHandlers | null) {
  authHandlers = nextHandlers;
}

async function refreshAccessToken() {
  if (!authHandlers) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = authHandlers
      .refreshAccessToken()
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, skipAuthRetry = false, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (response.status === 401 && token && !skipAuthRetry && authHandlers) {
    try {
      const nextToken = await refreshAccessToken();

      if (nextToken) {
        return request<T>(path, {
          ...options,
          token: nextToken,
          skipAuthRetry: true,
        });
      }
    } catch {
      // Preserve the original API error when session renewal fails.
    }
  }

  if (!response.ok) {
    throw new ApiError(payload?.message ?? 'Erro ao processar requisição.', response.status, payload);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
