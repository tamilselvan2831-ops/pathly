import { describe, expect, it } from "vitest";
import { advisorChatInput, advisorPathwayInput, learnerProfileInput } from "./routers";

describe("advisor input contracts", () => {
  const validProfile = {
    careerGoal: "Product Designer",
    education: "Design diploma",
    interests: ["Human behaviour", "Interfaces"],
    skills: ["Figma", "Storytelling"],
    learningPace: "Steady" as const,
  };

  it("accepts a complete learner profile", () => {
    expect(learnerProfileInput.parse(validProfile)).toMatchObject(validProfile);
  });

  it("rejects incomplete profile details and unsupported pace values", () => {
    expect(learnerProfileInput.safeParse({ ...validProfile, skills: [], learningPace: "Instant" }).success).toBe(false);
  });

  it("provides the default career context for a chat request", () => {
    expect(advisorChatInput.parse({ message: "What should I prioritise?" }).careerSlug).toBe("product-designer");
  });

  it("requires a target career and at least one required skill for pathway generation", () => {
    expect(advisorPathwayInput.safeParse({ careerSlug: "", careerTitle: "", requiredSkills: [] }).success).toBe(false);
  });
});
