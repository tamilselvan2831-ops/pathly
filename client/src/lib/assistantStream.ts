import { COOKIE_NAME } from "@shared/const";

export type StreamAssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type StreamEvent =
  | { type: "delta"; content: string }
  | { type: "done" }
  | { type: "error"; error: string };

function getSessionHeaders(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem("manus-cookie");
    if (raw) {
      const prefix = `${COOKIE_NAME}=`;
      const pair = raw
        .split(";")
        .find(value => value.trim().startsWith(prefix));
      const token = pair?.trim().slice(prefix.length);
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Cookie authentication remains the primary path when sessionStorage is unavailable.
  }
  return {};
}

export function reportAssistantPerformance(
  metric: "time-to-first-audio",
  durationMs: number
) {
  if (!Number.isFinite(durationMs) || durationMs < 0) return;
  void fetch("/api/ai/metrics", {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: {
      "content-type": "application/json",
      ...getSessionHeaders(),
    },
    body: JSON.stringify({ metric, durationMs: Math.round(durationMs) }),
  }).catch(() => {
    // Metrics must never affect the voice response.
  });
}

export async function streamAssistantResponse(
  messages: StreamAssistantMessage[],
  onDelta: (content: string) => void,
  signal: AbortSignal
) {
  const response = await fetch("/api/ai/assistant/stream", {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      Accept: "text/event-stream",
      ...getSessionHeaders(),
    },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!response.ok) {
    const error = new Error(
      response.status === 401
        ? "AUTH_REQUIRED"
        : `Assistant request failed (${response.status})`
    );
    Object.assign(error, { status: response.status });
    throw error;
  }
  if (!response.body) throw new Error("The assistant returned an empty stream");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let complete = "";
  let sawDone = false;

  const handleEvent = (raw: string) => {
    const line = raw.trim();
    if (!line.startsWith("data:")) return;
    try {
      const event = JSON.parse(line.slice(5).trim()) as StreamEvent;
      if (event.type === "delta") {
        complete += event.content;
        onDelta(event.content);
      } else if (event.type === "error") {
        throw new Error(event.error);
      } else if (event.type === "done") {
        sawDone = true;
      }
    } catch (error) {
      if (error instanceof SyntaxError) return;
      throw error;
    }
  };

  try {
    while (!sawDone) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? "";
      for (const event of events) handleEvent(event);
      if (done) break;
    }
    if (buffer.trim()) handleEvent(buffer);
    if (!complete) throw new Error("The assistant returned no content");
    return complete;
  } finally {
    try {
      await reader.cancel();
    } catch {
      // The stream is already closed or was cancelled by the caller.
    }
  }
}
