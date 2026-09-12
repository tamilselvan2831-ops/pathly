import { afterEach, describe, expect, it, vi } from "vitest";
import { invokeLLM } from "./_core/llm";

describe("NVIDIA NIM LLM adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("routes a chat completion to NVIDIA NIM with the configured model", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "nim-test",
          created: 1,
          model: "openai/gpt-oss-120b",
          choices: [{ index: 0, message: { role: "assistant", content: "Java is a programming language." }, finish_reason: "stop" }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await invokeLLM({ messages: [{ role: "user", content: "What is Java?" }], model: "gpt-5-mini" });
    expect(result.choices[0]?.message.content).toContain("Java");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://integrate.api.nvidia.com/v1/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toMatch(/^Bearer .+/);
    const payload = JSON.parse(String(init.body)) as { model: string; messages: Array<{ content: string }> };
    expect(payload.model).toBe("openai/gpt-oss-120b");
    expect(payload.messages[0]?.content).toBe("What is Java?");
  });

  it("falls back to the existing server-side engine on a non-retryable NIM error", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "model unavailable" }), { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "forge-fallback",
        created: 1,
        model: "fallback",
        choices: [{ index: 0, message: { role: "assistant", content: "Fallback answer." }, finish_reason: "stop" }],
      }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await invokeLLM({ messages: [{ role: "user", content: "Fallback test" }] });
    expect(result.choices[0]?.message.content).toBe("Fallback answer.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[1] as [string])[0]).toContain("/v1/chat/completions");
  });
});
