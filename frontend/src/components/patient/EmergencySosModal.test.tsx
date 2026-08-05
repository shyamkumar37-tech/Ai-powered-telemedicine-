import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { screen, fireEvent } from "@testing-library/dom";
import React from "react";
import EmergencySosModal from "./EmergencySosModal";

describe("EmergencySosModal RTL Component Tests", () => {
  it("does not render when isOpen is false", () => {
    render(<EmergencySosModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders countdown screen when opened and triggers cancel on button click", () => {
    const handleClose = vi.fn();
    render(<EmergencySosModal isOpen={true} onClose={handleClose} />);

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText(/Emergency SOS/i)).toBeDefined();

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(handleClose).toHaveBeenCalled();
  });
});
