const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Called when an API request is rejected with 401. It renews the session and resolves to
 * the new access token, or null when the session is over. Set by the AuthProvider.
 */
let unauthorizedHandler: (() => Promise<string | null>) | null = null;

export function setUnauthorizedHandler(handler: (() => Promise<string | null>) | null) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  public status: number;
  public code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit,
  retried = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(options?.headers as Record<string, string>) },
      credentials: "include", // send refresh token cookie
    });
  } catch {
    throw new ApiError(0, "Network request failed", "NETWORK_ERROR");
  }

  // An expired access token (e.g. the app slept past its renewal timer): renew once and
  // retry. Auth endpoints are excluded — a 401 there is the real answer.
  if (res.status === 401 && !retried && unauthorizedHandler && !path.startsWith("/auth/")) {
    const renewed = await unauthorizedHandler().catch(() => null);
    if (renewed) return apiClient<T>(path, options, true);
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(
      res.status,
      error.message ?? "Request failed",
      error.code
    );
  }

  return res.json() as Promise<T>;
}
