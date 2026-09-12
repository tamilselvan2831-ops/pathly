import { describe, expect, it } from "vitest";
import { validateExplainerLesson } from "./videoGeneration";

describe("Topic Explainer lesson contract", () => {
  it("accepts a complete two-scene lesson", () => {
    expect(validateExplainerLesson({
      title: "Photosynthesis",
      script: "Plants convert light into stored energy.",
      narration: "Plants use light to make food.",
      scenes: [
        { title: "Light", narration: "Light reaches the leaf.", visualPrompt: "Educational animation of sunlight reaching a leaf", duration: 5 },
        { title: "Energy", narration: "The leaf stores chemical energy.", visualPrompt: "Educational diagram of energy storage in a plant cell", duration: 5 },
      ],
    })).toBe(true);
  });

  it("rejects incomplete or out-of-range scene data", () => {
    expect(validateExplainerLesson({
      title: "Photosynthesis",
      script: "script",
      narration: "narration",
      scenes: [{ title: "Only one", narration: "short", visualPrompt: "plant", duration: 2 }],
    })).toBe(false);
  });
});
