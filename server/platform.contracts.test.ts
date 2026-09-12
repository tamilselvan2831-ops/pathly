import { describe, expect, it } from "vitest";
import { CAREER_PATHS, calculateSkillGap } from "../shared/advisor";
import { analysisInput, buildVoiceFallbackResult, quizInput } from "./routers";

describe("voice transcription fallback", () => {
  it("returns a handled browser-fallback result with diagnostics", () => {
    expect(buildVoiceFallbackResult(new Error("Transcription service request failed"))).toEqual({
      text: "",
      language: "en",
      source: "browser-fallback",
      error: "Transcription service request failed",
    });
  });
});

describe("platform contracts", () => {
  it("accepts bounded document and resume analysis requests", () => {
    const text = "This is a sufficiently long document body for a deterministic contract test with more than forty characters.";
    expect(analysisInput.parse({ kind: "resume", title: "resume.txt", text, mode: "detailed" }).kind).toBe("resume");
    expect(() => analysisInput.parse({ kind: "document", title: "notes.txt", text: "too short" })).toThrow();
  });

  it("rejects quiz sizes outside the supported range", () => {
    expect(quizInput.parse({ topic: "SQL joins", difficulty: "beginner", questionCount: 5 }).questionCount).toBe(5);
    expect(() => quizInput.parse({ topic: "SQL joins", difficulty: "beginner", questionCount: 2 })).toThrow();
  });

  it("includes a broad engineering domain catalog and computes transparent gaps", () => {
    expect(CAREER_PATHS.length).toBeGreaterThanOrEqual(8);
    const result = calculateSkillGap(["Python", "APIs"], "ai-engineer");
    expect(result.career.title).toBe("AI Engineer");
    expect(result.strengths).toEqual(expect.arrayContaining(["Python", "APIs"]));
    expect(result.gaps.length).toBeGreaterThan(0);
  });
});
