import { describe, expect, it } from "vitest";
import { calculateSkillGap, createGuidanceFallback } from "../shared/advisor";

describe("career guidance logic", () => {
  it("identifies a learner's strengths, skill gaps, and readiness", () => {
    const result = calculateSkillGap(["Figma", "Accessibility", "Storytelling"], "product-designer");
    expect(result.readiness).toBe(50);
    expect(result.strengths).toEqual(["Figma", "Storytelling", "Accessibility"]);
    expect(result.gaps).toContain("User research");
  });

  it("creates useful guided advice if an AI response is unavailable", () => {
    const advice = createGuidanceFallback("What should I do next?", "frontend-engineer");
    expect(advice).toContain("Frontend Engineer");
    expect(advice).toContain("What should I do next?");
  });
});
