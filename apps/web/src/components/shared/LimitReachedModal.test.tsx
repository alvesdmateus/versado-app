import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { LimitReachedModal } from "./LimitReachedModal";

afterEach(cleanup);

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("LimitReachedModal", () => {
  test("renders nothing when closed", () => {
    renderWithRouter(
      <LimitReachedModal isOpen={false} onClose={() => {}} />
    );
    expect(screen.queryByText(/daily limit/i)).toBeNull();
  });

  test("renders when open", () => {
    renderWithRouter(
      <LimitReachedModal isOpen={true} onClose={() => {}} />
    );
    expect(screen.getByText(/daily limit/i)).toBeTruthy();
  });

  test("shows Go Fluent buttons", () => {
    renderWithRouter(
      <LimitReachedModal isOpen={true} onClose={() => {}} />
    );
    const goFluentButtons = screen.getAllByText("Go Fluent");
    expect(goFluentButtons.length).toBeGreaterThanOrEqual(1);
  });

  test("calls onClose when Maybe Later is clicked", () => {
    let closed = false;
    renderWithRouter(
      <LimitReachedModal
        isOpen={true}
        onClose={() => { closed = true; }}
      />
    );
    fireEvent.click(screen.getByText("Maybe Later"));
    expect(closed).toBe(true);
  });

  test("calls onClose when X button is clicked", () => {
    let closed = false;
    renderWithRouter(
      <LimitReachedModal
        isOpen={true}
        onClose={() => { closed = true; }}
      />
    );
    // The X close button is the first button
    const buttons = document.querySelectorAll("button");
    fireEvent.click(buttons[0]!); // X button
    expect(closed).toBe(true);
  });

  test("shows social proof text", () => {
    renderWithRouter(
      <LimitReachedModal isOpen={true} onClose={() => {}} />
    );
    expect(screen.getByText(/fluent learners/i)).toBeTruthy();
  });
});
