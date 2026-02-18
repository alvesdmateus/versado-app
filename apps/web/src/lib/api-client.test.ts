import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { apiClient, ApiError, setAccessToken, getAccessToken } from "./api-client";

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
});
