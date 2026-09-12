import { describe, expect, it } from "vitest";
import { getOAuthSessionName } from "./_core/oauth";

describe("OAuth session identity fallback", () => {
  it("prefers the provider display name", () => {
    expect(
      getOAuthSessionName({
        name: "CareerPath Learner",
        email: "learner@example.com",
        openId: "user-123",
      })
    ).toBe("CareerPath Learner");
  });

  it("uses email when the provider omits a display name", () => {
    expect(
      getOAuthSessionName({
        name: null,
        email: "learner@example.com",
        openId: "user-123",
      })
    ).toBe("learner@example.com");
  });

  it("uses openId as the final non-empty identity fallback", () => {
    expect(
      getOAuthSessionName({
        name: null,
        email: null,
        openId: "user-123",
      })
    ).toBe("user-123");
  });
});
