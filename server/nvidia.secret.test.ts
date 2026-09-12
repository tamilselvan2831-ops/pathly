import { describe, expect, it } from "vitest";

describe("NVIDIA NIM secret", () => {
  it("authenticates against the lightweight models endpoint when configured", async () => {
    const key = process.env.NVIDIA_API_KEY;
    expect(key, "NVIDIA_API_KEY must be configured through the secure secret flow").toBeTruthy();

    const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });

    expect(response.status, await response.text()).toBe(200);
  }, 15_000);
});
