import { describe, expect, it } from "vitest";
import {
  assistantInput,
  normalizeAssistantMessages,
  ASSISTANT_CONTENT_MAX,
  ASSISTANT_SYSTEM_PROMPT,
} from "./routers";
import {
  ASSISTANT_REQUEST_MAX,
  compactAssistantMessages,
  trimAssistantMessages,
} from "../shared/assistant";

describe("ai.assistant input contract", () => {
  it("accepts a 21-message history for server-side trimming", () => {
    const messages = Array.from({ length: 21 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `message ${index}`,
    }));

    expect(assistantInput.parse({ messages })).toEqual({ messages });
  });

  it("accepts and trims oversized individual message content", () => {
    const content = "x".repeat(5000);
    const parsed = assistantInput.parse({
      messages: [{ role: "user" as const, content }],
    });
    const normalized = normalizeAssistantMessages(parsed.messages);

    expect(normalized[0]?.content.length).toBeLessThanOrEqual(
      ASSISTANT_CONTENT_MAX
    );
    expect(normalized[0]?.content).toContain("Earlier content trimmed");
  });

  it("trims oldest context to the total 12000-character budget", () => {
    const messages = Array.from({ length: 6 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `${index}:` + "x".repeat(2500),
    }));
    const trimmed = trimAssistantMessages(messages);

    expect(
      trimmed.reduce((sum, message) => sum + message.content.length, 0)
    ).toBeLessThanOrEqual(ASSISTANT_REQUEST_MAX);
    expect(trimmed[0]?.content.startsWith("0:")).toBe(false);
    expect(trimmed.at(-1)?.content.startsWith("5:")).toBe(true);
  });

  it("budgets the provider-bound system prompt and conversation together", () => {
    const messages = Array.from({ length: 6 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `${index}:` + "x".repeat(2500),
    }));
    const trimmed = normalizeAssistantMessages(
      messages,
      12000 - ASSISTANT_SYSTEM_PROMPT.length
    );
    const totalContent =
      ASSISTANT_SYSTEM_PROMPT.length +
      trimmed.reduce((sum, message) => sum + message.content.length, 0);

    expect(totalContent).toBeLessThanOrEqual(12000);
    expect(trimmed.at(-1)?.content.startsWith("5:")).toBe(true);
  });

  it("compacts older turns without adding another model request", () => {
    const messages = Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `turn ${index}`,
    }));
    const compacted = compactAssistantMessages(messages, 4);

    expect(compacted).toHaveLength(5);
    expect(compacted[0]?.content).toContain("Context summary of earlier turns");
    expect(compacted.at(-1)?.content).toBe("turn 9");
  });

  it("still rejects histories above the hard request ceiling", () => {
    const messages = Array.from({ length: 61 }, (_, index) => ({
      role: "user" as const,
      content: `message ${index}`,
    }));

    expect(() => assistantInput.parse({ messages })).toThrow();
  });
});
