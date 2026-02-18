import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

afterEach(cleanup);

describe("EmptyState", () => {
  test("renders title", () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeTruthy();
  });

  test("renders description when provided", () => {
    render(
      <EmptyState
        title="No items"
        description="Try adding some items first."
      />
    );
    expect(screen.getByText("Try adding some items first.")).toBeTruthy();
  });

  test("does not render description when not provided", () => {
    render(<EmptyState title="No items" />);
    const container = document.querySelector(".flex.flex-col");
    expect(container?.querySelectorAll("p").length).toBe(1);
  });

  test("renders icon when provided", () => {
    render(
      <EmptyState
        title="No items"
        icon={<span data-testid="icon">📦</span>}
      />
    );
    expect(screen.getByTestId("icon")).toBeTruthy();
  });

  test("renders action button and fires callback", () => {
    let clicked = false;
    render(
      <EmptyState
        title="No items"
        action={{
          label: "Add Item",
          onClick: () => { clicked = true; },
        }}
      />
    );
    fireEvent.click(screen.getByText("Add Item"));
    expect(clicked).toBe(true);
  });

  test("does not render action button when not provided", () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
