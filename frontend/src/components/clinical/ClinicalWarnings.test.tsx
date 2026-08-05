import { describe, it, expect, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import React from "react";

interface ClinicalWarningProps {
  allergyFlag?: string;
  dosageWarning?: string;
  interactionRisk?: string;
}

function ClinicalWarningAlert({
  allergyFlag,
  dosageWarning,
  interactionRisk
}: ClinicalWarningProps) {
  const hasWarnings = Boolean(allergyFlag || dosageWarning || interactionRisk);

  if (!hasWarnings) {
    return (
      <div data-testid="clear-status" className="p-3 bg-emerald-500/10 text-emerald-400">
        ✓ No Contraindications Detected
      </div>
    );
  }

  return (
    <div data-testid="clinical-warning-banner" className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
      <h4 className="font-bold text-rose-400">Clinical Warnings Detected</h4>
      {allergyFlag ? <p data-testid="allergy-alert">Allergy Alert: {allergyFlag}</p> : null}
      {dosageWarning ? <p data-testid="dosage-alert">Dosage Warning: {dosageWarning}</p> : null}
      {interactionRisk ? <p data-testid="interaction-alert">Interaction Risk: {interactionRisk}</p> : null}
    </div>
  );
}

describe("Clinical Warning Alerts — RTL Conditional Rendering Tests", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders clear status when no warnings exist", () => {
    render(<ClinicalWarningAlert />);
    expect(screen.getByTestId("clear-status")).toBeDefined();
    expect(screen.queryByTestId("clinical-warning-banner")).toBeNull();
  });

  it("renders allergy and dosage warning banners when flags are active", () => {
    render(
      <ClinicalWarningAlert
        allergyFlag="Patient has documented Penicillin allergy"
        dosageWarning="Daily dose 2000mg exceeds renal clearance maximum 1000mg"
      />
    );

    expect(screen.getByTestId("clinical-warning-banner")).toBeDefined();
    expect(screen.getByTestId("allergy-alert")).toBeDefined();
    expect(screen.getByTestId("dosage-alert")).toBeDefined();
  });

  it("renders drug-drug interaction warning when flagged", () => {
    render(
      <ClinicalWarningAlert
        interactionRisk="Severe interaction between Warfarin and Aspirin (Bleeding Risk)"
      />
    );

    expect(screen.getByTestId("interaction-alert")).toBeDefined();
    expect(screen.queryByTestId("allergy-alert")).toBeNull();
  });
});
