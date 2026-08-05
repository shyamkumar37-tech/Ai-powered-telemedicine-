import { describe, it, expect, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import React from "react";

interface Phq9ScreenerProps {
  totalScore: number;
  hasSelfHarmThoughts: boolean;
}

function Phq9RiskEvaluator({ totalScore, hasSelfHarmThoughts }: Phq9ScreenerProps) {
  let severityLabel = "Minimal / No Depression";
  let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

  if (totalScore >= 20) {
    severityLabel = "Severe Depression";
    badgeColor = "bg-rose-500/15 text-rose-400 border-rose-500/40";
  } else if (totalScore >= 15) {
    severityLabel = "Moderately Severe Depression";
    badgeColor = "bg-amber-500/15 text-amber-400 border-amber-500/40";
  } else if (totalScore >= 10) {
    severityLabel = "Moderate Depression";
    badgeColor = "bg-yellow-500/15 text-yellow-400 border-yellow-500/40";
  } else if (totalScore >= 5) {
    severityLabel = "Mild Depression";
    badgeColor = "bg-blue-500/15 text-blue-400 border-blue-500/40";
  }

  return (
    <div data-testid="phq9-evaluator-card" className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">PHQ-9 Clinical Screener Result</h4>
        <span data-testid="phq9-score-badge" className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
          {totalScore} / 27 — {severityLabel}
        </span>
      </div>

      {hasSelfHarmThoughts && (
        <div data-testid="self-harm-alert-banner" className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2 animate-pulse">
          <span>🚨 Safety Alert: Immediate Clinical Review & Crisis Protocol Triggered (Item 9 Flagged)</span>
        </div>
      )}

      {totalScore >= 10 && (
        <div data-testid="followup-recommendation" className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
          Recommend clinical consultation and evidence-based psychotherapy review.
        </div>
      )}
    </div>
  );
}

describe("PHQ-9 Screener Conditional Rendering Tests (RTL)", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders minimal risk badge and no safety alerts for low scores (e.g. score 3)", () => {
    render(<Phq9RiskEvaluator totalScore={3} hasSelfHarmThoughts={false} />);

    expect(screen.getByTestId("phq9-score-badge").textContent).toContain("3 / 27 — Minimal / No Depression");
    expect(screen.queryByTestId("self-harm-alert-banner")).toBeNull();
    expect(screen.queryByTestId("followup-recommendation")).toBeNull();
  });

  it("renders moderate severity badge and clinical follow-up prompt for score 12", () => {
    render(<Phq9RiskEvaluator totalScore={12} hasSelfHarmThoughts={false} />);

    expect(screen.getByTestId("phq9-score-badge").textContent).toContain("12 / 27 — Moderate Depression");
    expect(screen.getByTestId("followup-recommendation")).toBeDefined();
    expect(screen.queryByTestId("self-harm-alert-banner")).toBeNull();
  });

  it("renders critical safety alert banner when self-harm thoughts (Item 9) are flagged regardless of score", () => {
    render(<Phq9RiskEvaluator totalScore={6} hasSelfHarmThoughts={true} />);

    expect(screen.getByTestId("self-harm-alert-banner")).toBeDefined();
    expect(screen.getByText(/Safety Alert: Immediate Clinical Review/i)).toBeDefined();
  });
});
