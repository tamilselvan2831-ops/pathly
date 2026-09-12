import { describe, expect, it } from "vitest";
import { getResourcesForCareer } from "../shared/learningResources";

describe("curated learning resources", () => {
  it("returns role-specific materials with official provider links", () => {
    const resources = getResourcesForCareer("frontend-engineer");
    expect(resources.length).toBeGreaterThan(1);
    expect(resources.some((resource) => resource.provider === "MDN Web Docs")).toBe(true);
    expect(resources.every((resource) => resource.url.startsWith("https://"))).toBe(true);
  });

  it("does not blend unrelated role materials into a selected pathway", () => {
    const resources = getResourcesForCareer("product-designer");
    expect(resources.every((resource) => resource.careerSlugs.includes("product-designer"))).toBe(true);
    expect(resources.some((resource) => resource.provider === "Coursera")).toBe(false);
  });
});
