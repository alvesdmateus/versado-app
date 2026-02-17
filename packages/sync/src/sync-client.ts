import type { OutboxEntry, PullResponse, PushResponse } from "./types";

export interface SyncClientOptions {
  baseUrl: string;
  getToken: () => string | null;
}

export class SyncClient {
  private baseUrl: string;
  private getToken: () => string | null;

  constructor(options: SyncClientOptions) {
    this.baseUrl = options.baseUrl;
    this.getToken = options.getToken;
  }

  async pull(since: string | null): Promise<PullResponse> {
    const query = since ? `?since=${encodeURIComponent(since)}` : "";
    return this.request<PullResponse>(`/api/sync/pull${query}`);
  }

  async push(changes: OutboxEntry[]): Promise<PushResponse> {
    return this.request<PushResponse>("/api/sync/push", {
      method: "POST",
      body: JSON.stringify({ changes }),
    });
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...(options?.headers as Record<string, string>) },
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Sync request failed" }));
      throw new Error(error.message ?? "Sync request failed");
    }

    return res.json() as Promise<T>;
  }
}
