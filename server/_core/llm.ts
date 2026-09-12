import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?:
      | "audio/mpeg"
      | "audio/wav"
      | "application/pdf"
      | "audio/mp4"
      | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: string;
  thinking?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
};

export type LLMStreamParams = InvokeParams;

export type LLMStreamEvent = {
  content: string;
  done?: boolean;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

const assertApiKey = () => {
  if (!ENV.nvidiaApiKey && !ENV.forgeApiKey) {
    throw new Error("No server-side AI provider is configured");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

const RETRY_MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 30_000;
const PROVIDER_TIMEOUT_MS = 25_000;

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException("Request aborted", "AbortError"));
    };
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort, { once: true });
  });

const isRetryableStatus = (status: number) =>
  status === 408 || status === 429 || status >= 500;

const parseRetryAfter = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
};

// Equal-jitter exponential backoff. The cap/2 floor guarantees a minimum
// delay so a misbehaving caller loop slows down instead of hammering the
// upstream while it keeps returning errors.
const computeBackoffDelay = (
  attempt: number,
  retryAfterMs?: number
): number => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};

// Retries non-2xx responses and network errors with exponential backoff, then
// returns the final Response so callers keep their existing error handling.
const fetchWithBackoff = async (
  url: string,
  init: FetchInit,
  externalSignal?: AbortSignal
): Promise<Response> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        PROVIDER_TIMEOUT_MS
      );
      const abortFromCaller = () => controller.abort();
      if (externalSignal?.aborted) controller.abort();
      else
        externalSignal?.addEventListener("abort", abortFromCaller, {
          once: true,
        });
      let response: Response;
      try {
        response = await fetch(url, { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener("abort", abortFromCaller);
      }
      if (
        response.ok ||
        attempt === RETRY_MAX_RETRIES ||
        !isRetryableStatus(response.status)
      ) {
        return response;
      }

      const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
      try {
        await response.body?.cancel();
      } catch {
        // Body already settled; nothing to clean up.
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs), externalSignal);
    } catch (error) {
      if (externalSignal?.aborted) throw error;
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt), externalSignal);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("LLM request failed after exhausting retries");
};

const invokeProvider = async (
  url: string,
  apiKey: string,
  payload: Record<string, unknown>,
  providerModel?: string,
  signal?: AbortSignal
): Promise<InvokeResult> => {
  const requestPayload = {
    ...payload,
    ...(providerModel ? { model: providerModel } : {}),
  };
  const response = await fetchWithBackoff(
    url,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestPayload),
    },
    signal
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM provider request failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
};

const buildPayload = (params: InvokeParams): Record<string, unknown> => {
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens,
  } = params;

  const payload: Record<string, unknown> = {
    messages: messages.map(normalizeMessage),
  };

  if (model) payload.model = model;
  if (tools && tools.length > 0) payload.tools = tools;

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) payload.tool_choice = normalizedToolChoice;

  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number")
    payload.max_tokens = resolvedMaxTokens;
  if (thinking) payload.thinking = thinking;
  if (reasoning) payload.reasoning = reasoning;

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat: params.responseFormat,
    response_format: params.response_format,
    outputSchema,
    output_schema,
  });
  if (normalizedResponseFormat)
    payload.response_format = normalizedResponseFormat;

  return payload;
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const payload = buildPayload(params);
  if (ENV.nvidiaApiKey) {
    try {
      return await invokeProvider(
        ENV.nvidiaApiUrl,
        ENV.nvidiaApiKey,
        payload,
        ENV.nvidiaModel
      );
    } catch (error) {
      console.warn(
        "NVIDIA NIM unavailable; using the configured server-side fallback provider.",
        error instanceof Error ? error.message : "unknown provider error"
      );
    }
  }

  if (ENV.forgeApiKey) {
    return invokeProvider(
      resolveApiUrl(),
      ENV.forgeApiKey,
      payload,
      params.model
    );
  }

  throw new Error("The configured AI provider is temporarily unavailable");
}

const parseStreamChunk = (line: string): string | null => {
  const data = line.startsWith("data:") ? line.slice(5).trim() : "";
  if (!data || data === "[DONE]") return null;
  try {
    const parsed = JSON.parse(data) as {
      choices?: Array<{ delta?: { content?: unknown } }>;
    };
    const content = parsed.choices?.[0]?.delta?.content;
    return typeof content === "string" ? content : null;
  } catch {
    return null;
  }
};

async function* readProviderStream(
  response: Response
): AsyncGenerator<LLMStreamEvent> {
  if (!response.body) throw new Error("LLM provider returned an empty stream");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const content = parseStreamChunk(line.trim());
        if (content) yield { content };
        if (line.includes("[DONE]")) {
          yield { content: "", done: true };
          return;
        }
      }
      if (done) break;
    }
    const finalContent = parseStreamChunk(buffer.trim());
    if (finalContent) yield { content: finalContent };
    yield { content: "", done: true };
  } finally {
    try {
      await reader.cancel();
    } catch {
      // The upstream body is already closed or was aborted by the client.
    }
  }
}

/**
 * Stream ordinary assistant responses from NVIDIA NIM. If NVIDIA is
 * unavailable before any token arrives, fall back to the existing server-side
 * provider and emit its completed answer as one event for reliability.
 */
export async function* streamLLM(
  params: LLMStreamParams,
  signal?: AbortSignal
): AsyncGenerator<LLMStreamEvent> {
  const payload = buildPayload(params);
  let providerError: unknown;
  let emittedContent = false;

  if (ENV.nvidiaApiKey) {
    try {
      const response = await fetchWithBackoff(
        ENV.nvidiaApiUrl,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${ENV.nvidiaApiKey}`,
          },
          body: JSON.stringify({
            ...payload,
            model: ENV.nvidiaFastModel,
            stream: true,
          }),
        },
        signal
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `LLM provider request failed: ${response.status} ${response.statusText} – ${errorText}`
        );
      }
      for await (const event of readProviderStream(response)) {
        if (event.content) emittedContent = true;
        yield event;
      }
      return;
    } catch (error) {
      if (signal?.aborted || emittedContent) throw error;
      providerError = error;
      console.warn(
        "NVIDIA streaming unavailable; using the configured server-side fallback provider.",
        error instanceof Error ? error.message : "unknown provider error"
      );
    }
  }

  if (ENV.forgeApiKey) {
    const fallback = await invokeProvider(
      resolveApiUrl(),
      ENV.forgeApiKey,
      payload,
      params.model,
      signal
    );
    const content = fallback.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.length > 0) {
      yield { content };
      yield { content: "", done: true };
      return;
    }
  }

  throw providerError instanceof Error
    ? providerError
    : new Error("The configured AI provider is temporarily unavailable");
}

export type ModelInfo = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

export type ModelsResponse = {
  object: string;
  data: ModelInfo[];
};

export async function listLLMModels(): Promise<ModelsResponse> {
  assertApiKey();

  const url =
    ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
      ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/models`
      : "https://forge.manus.im/v1/models";

  const response = await fetchWithBackoff(url, {
    headers: { authorization: `Bearer ${ENV.forgeApiKey}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `List LLM models failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as ModelsResponse;
}
