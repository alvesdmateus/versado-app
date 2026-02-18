import React from "react";
import { describe, test, expect, afterEach, beforeEach, spyOn } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

afterEach(cleanup);

function ThrowingComponent(): React.ReactNode {
  throw new Error("Test error");
}

function GoodComponent() {
  return <p>All good</p>;
}

describe("ErrorBoundary", () => {
  // Suppress console.error for expected errors in tests
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText("All good")).toBeTruthy();
  });

  test("catches error and shows error UI", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText(/unexpected error/i)).toBeTruthy();
  });

  test("shows reload button on error", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText("Reload App")).toBeTruthy();
  });
});
