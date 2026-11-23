import { ApiError } from "./api-client";

/** Failures worth retrying: no response, rate limited, or a server error. */
export function isTransient(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 0 || err.status === 429 || err.status >= 500);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run `fn`, retrying transient failures after each delay in `delaysMs`.
 * Anything else (4xx, validation, auth) is rethrown at once.
 */
export async function withRetry<T>(fn: () => Promise<T>, delaysMs: number[] = [500, 1500, 4000]): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTransient(err) || attempt >= delaysMs.length) throw err;
      await sleep(delaysMs[attempt]!);
    }
  }
}
