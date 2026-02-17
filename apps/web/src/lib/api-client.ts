const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
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
  options?: RequestInit
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
