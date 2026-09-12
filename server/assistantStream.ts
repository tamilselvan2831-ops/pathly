import type { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { streamLLM } from "./_core/llm";
import {
  ASSISTANT_REQUEST_MAX,
  compactAssistantMessages,
  trimAssistantMessageContent,
  trimAssistantMessages,
  type AssistantMessage,
} from "../shared/assistant";
import { ASSISTANT_SYSTEM_PROMPT } from "./routers";

const metricInput = z.object({
  metric: z.literal("time-to-first-audio"),
  durationMs: z.number().finite().min(0).max(120_000),
});

const streamInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(12_000),
      })
    )
    .min(1)
    .max(60),
});

const writeEvent = (res: Response, payload: Record<string, unknown>) => {
  if (!res.writableEnded) {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
};

const isAbortError = (error: unknown) =>
  error instanceof Error &&
  (error.name === "AbortError" || /aborted|abort/i.test(error.message));

export function registerAssistantStreamRoute(app: Express) {
  app.post("/api/ai/metrics", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const parsed = metricInput.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid performance metric" });
        return;
      }
      console.info("[AI performance] client metric", {
        userId: user.id,
        metric: parsed.data.metric,
        durationMs: Math.round(parsed.data.durationMs),
      });
      res.status(204).end();
    } catch {
      res.status(401).end();
    }
  });

  app.post("/api/ai/assistant/stream", async (req: Request, res: Response) => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    const abortController = new AbortController();
    let finished = false;
    let firstTokenAt: number | undefined;
    let tokenCount = 0;
    let responseText = "";

    const abortIfDisconnected = () => {
      if (!finished) abortController.abort();
    };
    req.on("aborted", abortIfDisconnected);
    res.on("close", abortIfDisconnected);

    try {
      let user: Awaited<ReturnType<typeof sdk.authenticateRequest>>;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      const parsed = streamInput.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid assistant request" });
        return;
      }

      const inputMessages = parsed.data.messages.map(message => ({
        role: message.role,
        content: trimAssistantMessageContent(message.content),
      })) as AssistantMessage[];
      const compacted = compactAssistantMessages(inputMessages);
      const boundedMessages = trimAssistantMessages(
        compacted,
        Math.max(ASSISTANT_REQUEST_MAX - ASSISTANT_SYSTEM_PROMPT.length, 1_000)
      );
      const lastMessage = boundedMessages.at(-1)?.content ?? "";

      void db.saveAdvisorMessage(user.id, "user", lastMessage).catch(error => {
        console.warn(
          "[AI stream] user message persistence failed",
          error instanceof Error ? error.message : "unknown error"
        );
      });

      res.status(200);
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders?.();

      for await (const event of streamLLM(
        {
          messages: [
            { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
            ...boundedMessages,
          ],
          maxTokens: 900,
        },
        abortController.signal
      )) {
        if (abortController.signal.aborted)
          throw new DOMException("Request aborted", "AbortError");
        if (event.content) {
          if (firstTokenAt === undefined) {
            firstTokenAt = Date.now();
            console.info("[AI stream] first token", {
              requestId,
              timeToFirstTokenMs: firstTokenAt - startedAt,
            });
          }
          tokenCount += event.content.length;
          responseText += event.content;
          writeEvent(res, { type: "delta", content: event.content });
        }
        if (event.done) break;
      }

      if (responseText.trim()) {
        void db
          .saveAdvisorMessage(user.id, "assistant", responseText)
          .catch(error => {
            console.warn(
              "[AI stream] assistant message persistence failed",
              error instanceof Error ? error.message : "unknown error"
            );
          });
      }
      writeEvent(res, { type: "done" });
      finished = true;
      res.end();
      console.info("[AI stream] completed", {
        requestId,
        timeToFirstTokenMs:
          firstTokenAt === undefined ? null : firstTokenAt - startedAt,
        durationMs: Date.now() - startedAt,
        outputChars: tokenCount,
      });
    } catch (error) {
      finished = true;
      if (
        isAbortError(error) ||
        abortController.signal.aborted ||
        res.destroyed
      ) {
        console.info("[AI stream] cancelled", {
          requestId,
          durationMs: Date.now() - startedAt,
        });
        if (!res.writableEnded) res.end();
        return;
      }
      console.error("[AI stream] failed", {
        requestId,
        durationMs: Date.now() - startedAt,
        error:
          error instanceof Error
            ? error.message.slice(0, 160)
            : "unknown error",
      });
      if (!res.headersSent) {
        res
          .status(502)
          .json({ error: "The assistant is temporarily unavailable" });
      } else {
        writeEvent(res, {
          type: "error",
          error: "The assistant is temporarily unavailable",
        });
        res.end();
      }
    } finally {
      req.off("aborted", abortIfDisconnected);
      res.off("close", abortIfDisconnected);
    }
  });
}
