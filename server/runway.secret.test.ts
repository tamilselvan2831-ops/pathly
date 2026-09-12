import { describe, expect, it } from "vitest";

describe("Runway managed secret", () => {
  it("authenticates against the lightweight organization endpoint", async () => {
    const secret = process.env.RUNWAYML_API_SECRET;
    expect(secret, "RUNWAYML_API_SECRET must be configured").toBeTruthy();

    const response = await fetch("https://api.dev.runwayml.com/v1/organization", {
      headers: {
        Authorization: `Bearer ${secret}`,
        "X-Runway-Version": "2024-11-06",
      },
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.ok, `Runway credential check returned HTTP ${response.status}`).toBe(true);
  }, 15_000);
});
