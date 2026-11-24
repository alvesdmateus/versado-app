import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { apiClient, ApiError, setAccessToken, getAccessToken, setUnauthorizedHandler } from "./api-client";

describe("api-client", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    setAccessToken(null);
  });

  afterEach(() => {
    if (fetchSpy) fetchSpy.mockRestore();
  });

  test("returns JSON on successful response", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: "test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await apiClient<{ data: string }>("/test");
    expect(result.data).toBe("test");
  });

  test("throws ApiError on non-ok response", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Not found", code: "NOT_FOUND" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );

    try {
      await apiClient("/test");
      expect(true).toBe(false); // should not reach
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(404);
      expect((e as ApiError).code).toBe("NOT_FOUND");
    }
  });

  test("throws ApiError with status 0 on network failure", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Failed to fetch")
    );

    try {
      await apiClient("/test");
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(0);
      expect((e as ApiError).code).toBe("NETWORK_ERROR");
    }
  });

  test("includes Authorization header when token is set", async () => {
    setAccessToken("my-token");
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );

    await apiClient("/test");
    const callArgs = fetchSpy.mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer my-token");
  });

  test("does not include Authorization header when token is null", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );

    await apiClient("/test");
    const callArgs = fetchSpy.mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });

  test("setAccessToken and getAccessToken work correctly", () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken("token123");
    expect(getAccessToken()).toBe("token123");
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  describe("expired access token", () => {
    const unauthorized = () => new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
    const authHeader = (call: unknown[]) => ((call[1] as RequestInit).headers as Record<string, string>)["Authorization"];

    afterEach(() => setUnauthorizedHandler(null));

    test("renews the session once and retries with the new token", async () => {
      setAccessToken("old");
      let renewals = 0;
      setUnauthorizedHandler(async () => {
        renewals++;
        setAccessToken("new");
        return "new";
      });
      fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(ok({ data: 1 }));

      const result = await apiClient<{ data: number }>("/api/learn/tracks");
      expect(result.data).toBe(1);
      expect(renewals).toBe(1);
      expect(authHeader(fetchSpy.mock.calls[0]!)).toBe("Bearer old");
      expect(authHeader(fetchSpy.mock.calls[1]!)).toBe("Bearer new");
    });

    test("does not loop when the retried request is rejected again", async () => {
      let renewals = 0;
      setUnauthorizedHandler(async () => {
        renewals++;
        return "new";
      });
      fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(unauthorized());

      await expect(apiClient("/api/learn/tracks")).rejects.toMatchObject({ status: 401 });
      expect(renewals).toBe(1);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    test("surfaces the 401 when the session cannot be renewed", async () => {
      setUnauthorizedHandler(async () => null);
      fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(unauthorized());

      await expect(apiClient("/api/learn/tracks")).rejects.toMatchObject({ status: 401 });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    test("never renews for auth endpoints, where 401 is the real answer", async () => {
      let renewals = 0;
      setUnauthorizedHandler(async () => {
        renewals++;
        return "new";
      });
      fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(unauthorized());

      await expect(apiClient("/auth/refresh", { method: "POST" })).rejects.toMatchObject({ status: 401 });
      expect(renewals).toBe(0);
    });
  });
});
