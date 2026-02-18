import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Toast } from "./Toast";

afterEach(cleanup);

describe("Toast", () => {
  test("renders message", () => {
    render(
      <Toast message="Operation successful" type="success" onDismiss={() => {}} />
    );
    expect(screen.getByText("Operation successful")).toBeTruthy();
  });

  test("calls onDismiss when close button is clicked", () => {
    let dismissed = false;
    render(
      <Toast
        message="Test"
        type="info"
        onDismiss={() => { dismissed = true; }}
      />
    );
    const button = document.querySelector("button");
    if (button) fireEvent.click(button);
    expect(dismissed).toBe(true);
  });

  test("renders success variant", () => {
    const { container } = render(
      <Toast message="OK" type="success" onDismiss={() => {}} />
    );
    expect(container.innerHTML).toContain("success");
  });

  test("renders error variant", () => {
    const { container } = render(
      <Toast message="Fail" type="error" onDismiss={() => {}} />
    );
    expect(container.innerHTML).toContain("error");
  });

  test("renders info variant", () => {
    const { container } = render(
      <Toast message="Info" type="info" onDismiss={() => {}} />
    );
    expect(container.innerHTML).toContain("primary");
  });
});
