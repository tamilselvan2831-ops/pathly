export const ASSISTANT_REQUEST_MAX = 12_000;
export const ASSISTANT_MESSAGE_MAX = 4_000;
export const ASSISTANT_RECENT_MESSAGE_LIMIT = 8;
const TRUNCATION_SUFFIX = "\n[Earlier content trimmed for context.]";

export type AssistantMessage = { role: "user" | "assistant"; content: string };

export function trimAssistantMessageContent(content: string) {
  if (content.length <= ASSISTANT_MESSAGE_MAX) return content;
  return `${content.slice(0, ASSISTANT_MESSAGE_MAX - TRUNCATION_SUFFIX.length)}${TRUNCATION_SUFFIX}`;
}

export function trimAssistantMessages(
  messages: AssistantMessage[],
  maxTotal = ASSISTANT_REQUEST_MAX
) {
  const normalized = messages.map(message => ({
    ...message,
    content: trimAssistantMessageContent(message.content),
  }));

  let start = 0;
  let total = normalized.reduce(
    (sum, message) => sum + message.content.length,
    0
  );
  while (total > maxTotal && start < normalized.length - 1) {
    total -= normalized[start]?.content.length ?? 0;
    start += 1;
  }

  const kept = normalized.slice(start);
  if (kept.length === 0) return normalized.slice(-1);
  return kept;
}

function summarizeOlderMessages(messages: AssistantMessage[]) {
  if (messages.length === 0) return "";
  return messages
    .map(message => {
      const compact = message.content.replace(/\s+/g, " ").trim();
      const excerpt =
        compact.length > 240 ? `${compact.slice(0, 237)}…` : compact;
      return `${message.role === "user" ? "Learner" : "Pathly"}: ${excerpt}`;
    })
    .join(" | ");
}

/**
 * Keeps the most recent turns and adds a small extractive summary of older
 * turns. This is intentionally local and deterministic so context reduction
 * never adds another sequential LLM request to the critical path.
 */
export function compactAssistantMessages(
  messages: AssistantMessage[],
  recentLimit = ASSISTANT_RECENT_MESSAGE_LIMIT
) {
  const normalized = messages.map(message => ({
    ...message,
    content: trimAssistantMessageContent(message.content),
  }));

  if (normalized.length <= recentLimit) return normalized;

  const older = normalized.slice(0, -recentLimit);
  const recent = normalized.slice(-recentLimit);
  const summary = summarizeOlderMessages(older);
  return [
    {
      role: "assistant" as const,
      content: `[Context summary of earlier turns] ${summary}`,
    },
    ...recent,
  ];
}

export function trimAndCompactAssistantMessages(
  messages: AssistantMessage[],
  maxTotal = ASSISTANT_REQUEST_MAX
) {
  return trimAssistantMessages(compactAssistantMessages(messages), maxTotal);
}
