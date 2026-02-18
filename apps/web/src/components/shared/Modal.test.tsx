import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Modal } from "./Modal";

afterEach(cleanup);

describe("Modal", () => {
  test("renders nothing when closed", () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.queryByText("Content")).toBeNull();
  });

  test("renders children when open", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText("Content")).toBeTruthy();
  });

  test("renders title when provided", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="My Title">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText("My Title")).toBeTruthy();
  });

  test("calls onClose when Escape is pressed", () => {
    let closed = false;
    render(
      <Modal isOpen={true} onClose={() => { closed = true; }}>
        <p>Content</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(closed).toBe(true);
  });

  test("calls onClose when backdrop is clicked", () => {
    let closed = false;
    render(
      <Modal isOpen={true} onClose={() => { closed = true; }}>
        <p>Content</p>
      </Modal>
    );
    // The backdrop is the outer fixed div
    const backdrop = document.querySelector(".fixed.inset-0");
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(closed).toBe(true);
  });

  test("does not close when content is clicked", () => {
    let closed = false;
    render(
      <Modal isOpen={true} onClose={() => { closed = true; }}>
        <p>Content</p>
      </Modal>
    );
    fireEvent.click(screen.getByText("Content"));
    expect(closed).toBe(false);
  });

  test("renders close button by default", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Content</p>
      </Modal>
    );
    // The X button should exist
    const buttons = document.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  test("applies size variant classes", () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={() => {}} size="sm">
        <p>Content</p>
      </Modal>
    );
    expect(document.querySelector(".max-w-sm")).toBeTruthy();
    unmount();

    render(
      <Modal isOpen={true} onClose={() => {}} size="lg">
        <p>Content</p>
      </Modal>
    );
    expect(document.querySelector(".max-w-lg")).toBeTruthy();
  });
});
