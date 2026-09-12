import { trpc } from "@/lib/trpc";
import { Activity, Cpu, ShieldCheck, Sparkles, Video, Mic } from "lucide-react";

export function HudTelemetryRibbon({ className = "" }: { className?: string }) {
  const providers = trpc.ai.providerStatus.useQuery(undefined, {
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const data = providers.data;
  const runwayReady = data?.runway.configured ?? false;
  const nvidiaReady = data?.nvidiaCosmos.configured ?? false;
  const whisperReady = data?.whisper.configured ?? false;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-cyan-500/20 bg-[#091120]/80 backdrop-blur-md text-xs font-mono text-slate-300 ${className}`}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-cyan-300 font-semibold uppercase tracking-wider">
            SYNAPSE // ONLINE
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-slate-400 border-l border-slate-700/60 pl-3">
          <Cpu size={13} className="text-cyan-400" />
          <span>LLM: {nvidiaReady ? "NVIDIA NIM" : "GPT-5 Hybrid"}</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 border-l border-slate-700/60 pl-3">
          <Video size={13} className={runwayReady ? "text-emerald-400" : "text-amber-400"} />
          <span>
            Runway Gen-4.5:{" "}
            <span className={runwayReady ? "text-emerald-300 font-bold" : "text-amber-300"}>
              {runwayReady ? "ACTIVE" : "STANDBY"}
            </span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-slate-400 border-l border-slate-700/60 pl-3">
          <Mic size={13} className="text-purple-400" />
          <span>Voice: {whisperReady ? "Whisper Active" : "Browser WebSpeech"}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md">
          <Sparkles size={12} className="text-cyan-400" />
          <span>TELEMETRY 2.4</span>
        </div>
        <div className="hidden lg:flex items-center gap-1 text-slate-500">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>SANDBOX SECURE</span>
        </div>
      </div>
    </div>
  );
}
