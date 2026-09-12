import { afterEach, describe, expect, it, vi } from "vitest";
import { streamLLM } from "./_core/llm";

describe("assistant streaming adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("streams deltas immediately through NVIDIA using the fast ordinary-question model", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"choices":[{"delta":{"content":"First"}}]}\n\n'
          )
        );
        controller.enqueue(
          encoder.encode(
            'data: {"choices":[{"delta":{"content":" answer."}}]}\n\n'
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(body, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const events: string[] = [];
    for await (const event of streamLLM({
      messages: [{ role: "user", content: "Hello" }],
    })) {
      if (event.content) events.push(event.content);
    }

    expect(events.join("")).toBe("First answer.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://integrate.api.nvidia.com/v1/chat/completions");
    const payload = JSON.parse(String(init.body)) as {
      model: string;
      stream: boolean;
    };
    expect(payload.model).toBe("openai/gpt-oss-20b");
    expect(payload.stream).toBe(true);
  });

  it("propagates cancellation instead of retrying an abandoned request", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true }
          );
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const stream = streamLLM(
      { messages: [{ role: "user", content: "Cancel me" }] },
      controller.signal
    );
    const next = stream.next();
    controller.abort();

    await expect(next).rejects.toThrow(/abort/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
