import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { waitFor, fireEvent } from "@testing-library/dom";
import React from "react";

function HighStakesPrescriptionForm({
  onSave
}: {
  onSave: (payload: { name: string; dosage: string }) => Promise<void>;
}) {
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("IDLE");
    setErrorMessage("");

    try {
      await onSave({ name: "Amoxicillin", dosage: "500mg" });
      setStatus("SUCCESS");
    } catch (err: unknown) {
      setStatus("ERROR");
      setErrorMessage((err as Error)?.message || "Failed to issue prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Issue E-Prescription</h2>
      {status === "SUCCESS" && <div data-testid="success-banner">Prescription Confirmed & Issued</div>}
      {status === "ERROR" && <div data-testid="error-banner">{errorMessage}</div>}
      {loading && <div data-testid="pending-indicator">Verifying with Server...</div>}

      <button type="submit" disabled={loading}>
        {loading ? "Transmitting..." : "Sign & Transmit Prescription"}
      </button>
    </form>
  );
}

describe("High-Stakes Clinical Mutations — Patient Safety Audit", () => {
  beforeEach(() => {
    cleanup();
  });

  it("shows pending state immediately and does NOT display success before server confirmation", async () => {
    let resolveServer: () => void = () => {};
    const mockSave = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveServer = resolve;
        })
    );

    const { getByRole, getByTestId, queryByTestId } = render(<HighStakesPrescriptionForm onSave={mockSave} />);

    const submitBtn = getByRole("button", { name: /sign & transmit/i });
    fireEvent.click(submitBtn);

    // (a) Pending indicator is visible immediately
    await waitFor(() => {
      expect(getByTestId("pending-indicator")).toBeDefined();
    });

    // (b) Success banner is NOT visible prior to server resolution
    expect(queryByTestId("success-banner")).toBeNull();

    // Now resolve server response
    resolveServer();

    await waitFor(() => {
      expect(getByTestId("success-banner")).toBeDefined();
    });
  });

  it("displays explicit error message on server failure and does NOT silently revert to success", async () => {
    const mockSave = vi.fn().mockRejectedValue(new Error("Drug-Drug Interaction Risk Flagged"));

    const { getByRole, getByTestId, queryByTestId, getByText } = render(<HighStakesPrescriptionForm onSave={mockSave} />);

    const submitBtn = getByRole("button", { name: /sign & transmit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // (c) Server failure produces visible error state
      expect(getByTestId("error-banner")).toBeDefined();
      expect(getByText("Drug-Drug Interaction Risk Flagged")).toBeDefined();
      expect(queryByTestId("success-banner")).toBeNull();
    });
  });
});
