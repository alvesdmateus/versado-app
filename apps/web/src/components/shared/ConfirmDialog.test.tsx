import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";

afterEach(cleanup);

describe("ConfirmDialog", () => {
  const defaultProps = {
    isOpen: true,
    onClose: () => {},
    onConfirm: () => {},
    title: "Confirm Action",
    message: "Are you sure?",
  };

  test("renders nothing when closed", () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Are you sure?")).toBeNull();
  });

  test("renders title and message when open", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Confirm Action")).toBeTruthy();
    expect(screen.getByText("Are you sure?")).toBeTruthy();
  });

  test("calls onConfirm when confirm button is clicked", () => {
    let confirmed = false;
    render(
      <ConfirmDialog
        {...defaultProps}
        onConfirm={() => { confirmed = true; }}
      />
    );
    fireEvent.click(screen.getByText("Confirm"));
    expect(confirmed).toBe(true);
  });

  test("calls onClose when cancel button is clicked", () => {
    let closed = false;
    render(
      <ConfirmDialog
        {...defaultProps}
        onClose={() => { closed = true; }}
      />
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(closed).toBe(true);
  });

  test("uses custom button labels", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    );
    expect(screen.getByText("Delete")).toBeTruthy();
    expect(screen.getByText("Keep")).toBeTruthy();
  });

  test("shows loading state", () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    expect(screen.getByText("...")).toBeTruthy();
  });

  test("renders danger variant with error styling", () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />);
    const confirmBtn = screen.getByText("Confirm");
    expect(confirmBtn.className).toContain("error");
  });
});
