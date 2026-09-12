import RunwayML from "@runwayml/sdk";
import { ENV } from "./_core/env";

export type ProviderTelemetry = {
  runway: {
    configured: boolean;
    provider: "runway-dev";
    model: string;
    status: "ready" | "unconfigured";
    capabilities: string[];
  };
  nvidiaCosmos: {
    configured: boolean;
    provider: "nvidia-nim";
    model: string;
    status: "ready" | "unconfigured";
    capabilities: string[];
  };
  whisper: {
    configured: boolean;
    provider: "openai-whisper";
    status: "ready" | "browser-fallback";
    capabilities: string[];
  };
};

export function isRunwayConfigured(): boolean {
  return Boolean(ENV.runwayApiSecret && ENV.runwayApiSecret.trim().length > 10);
}

export function isNvidiaCosmosConfigured(): boolean {
  return Boolean(ENV.nvidiaApiKey && ENV.nvidiaApiKey.trim().length > 10);
}

export function getRunwayClient(): RunwayML {
  if (!isRunwayConfigured()) {
    throw new Error(
      "RUNWAYML_API_SECRET is not configured on this server. Please configure your Runway developer API key to generate video scenes."
    );
  }
  return new RunwayML({ apiKey: ENV.runwayApiSecret });
}

export function getProviderTelemetry(): ProviderTelemetry {
  const runwayReady = isRunwayConfigured();
  const nvidiaReady = isNvidiaCosmosConfigured();
  const whisperReady = Boolean(ENV.forgeApiKey || ENV.nvidiaApiKey);

  return {
    runway: {
      configured: runwayReady,
      provider: "runway-dev",
      model: "gen4.5 / gen4_turbo",
      status: runwayReady ? "ready" : "unconfigured",
      capabilities: ["text-to-video", "image-to-video", "speech-synthesis"],
    },
    nvidiaCosmos: {
      configured: nvidiaReady,
      provider: "nvidia-nim",
      model: "cosmos3-nano / cosmos-1.0",
      status: nvidiaReady ? "ready" : "unconfigured",
      capabilities: ["diffusion-video", "multimodal-world-model", "fast-inference"],
    },
    whisper: {
      configured: whisperReady,
      provider: "openai-whisper",
      status: whisperReady ? "ready" : "browser-fallback",
      capabilities: ["speech-to-text", "audio-transcription", "multilingual"],
    },
  };
}
