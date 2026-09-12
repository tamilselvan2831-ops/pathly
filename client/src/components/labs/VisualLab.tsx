import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { HudCard } from "@/components/ui/hud-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  RefreshCw,
  Layers,
  Cpu,
  Info,
  Network,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type VisualStyle = "architecture" | "flowchart" | "concept-map" | "infographic";

const PRESETS = [
  { label: "Transformer Attention", topic: "Transformer Self-Attention Mechanism", style: "architecture" as VisualStyle },
  { label: "Event Microservices", topic: "Event-Driven Microservices Architecture", style: "architecture" as VisualStyle },
  { label: "TCP 3-Way Handshake", topic: "TCP/IP 3-Way Handshake and Session Teardown", style: "flowchart" as VisualStyle },
  { label: "Photosynthesis Cycle", topic: "Biochemical Light and Dark Reactions in Photosynthesis", style: "concept-map" as VisualStyle },
  { label: "CRISPR Mechanism", topic: "CRISPR-Cas9 Target Cleavage and DNA Repair", style: "infographic" as VisualStyle },
];

export function VisualLab({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [topic, setTopic] = useState("Transformer Self-Attention Mechanism");
  const [style, setStyle] = useState<VisualStyle>("architecture");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const generate = trpc.visual.generateDiagram.useMutation({
    onSuccess: () => {
      toast.success("Visual blueprint synthesized and saved to your neural archive.");
    },
    onError: error => {
      toast.error(error.message || "Failed to synthesize visual blueprint.");
    },
  });

  const handleGenerate = () => {
    if (!topic.trim() || generate.isPending) return;
    generate.mutate({ topic: topic.trim(), style });
  };

  const currentBlueprint = generate.data?.blueprint;

  const handleCopySvg = () => {
    if (!currentBlueprint?.svg) return;
    navigator.clipboard.writeText(currentBlueprint.svg);
    setCopied(true);
    toast.success("Raw SVG markup copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!currentBlueprint?.svg) return;
    const blob = new Blob([currentBlueprint.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(currentBlueprint.title || "diagram").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("SVG blueprint downloaded");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-cyan-950/60 border-cyan-500/40 text-cyan-300 font-mono text-[10px] tracking-wider uppercase">
              <Network size={12} className="mr-1.5 text-cyan-400" /> Neural Visual Engine 3.2
            </Badge>
            <span className="text-xs font-mono text-slate-400">// VECTOR COMPOSITOR</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-display">
            AI Visual Lab
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">
            Synthesize interactive architectural blueprints, scientific concept maps, and algorithm flowcharts using real server-side AI visual intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1.5 rounded-xl">
          <Zap size={14} className="text-cyan-400" />
          <span>REAL-TIME BLUEPRINT RENDERER</span>
        </div>
      </div>

      {/* Control Console */}
      <HudCard accent="cyan" cornerBrackets={true} className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
                placeholder="Specify any architecture, algorithm, system, or scientific process..."
                className="h-12 bg-[#080e1c] border-cyan-500/25 text-white placeholder:text-slate-500 rounded-xl font-medium focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 pl-4 pr-10 text-sm"
              />
              <Sparkles size={18} className="absolute right-3.5 top-3.5 text-cyan-400/60 pointer-events-none" />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generate.isPending || !topic.trim()}
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold tracking-wide shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {generate.isPending ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-slate-950" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-slate-950" />
                  <span>Generate Blueprint</span>
                </>
              )}
            </Button>
          </div>

          {/* Style Selector & Presets */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Blueprint Style:</span>
              <div className="flex flex-wrap gap-1.5">
                {(["architecture", "flowchart", "concept-map", "infographic"] as VisualStyle[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-all ${
                      style === s
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,242,254,0.2)]"
                        : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {s.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono uppercase text-slate-500">Presets:</span>
              {PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setTopic(preset.topic);
                    setStyle(preset.style);
                  }}
                  className="px-2 py-0.5 rounded-md bg-[#0d1627] hover:bg-cyan-950/60 border border-slate-700/60 hover:border-cyan-500/30 text-[11px] text-slate-300 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </HudCard>

      {/* Loading Hologram */}
      {generate.isPending && (
        <HudCard accent="cyan" className="p-12 text-center border-cyan-500/30">
          <div className="mx-auto flex flex-col items-center max-w-md">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/30 animate-ping"></div>
              <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400 flex items-center justify-center bg-cyan-950/40">
                <Network size={28} className="text-cyan-300 animate-pulse" />
              </div>
            </div>
            <h4 className="text-lg font-bold text-white tracking-wide font-display">
              Synthesizing Vector Blueprint
            </h4>
            <p className="mt-2 text-xs font-mono text-cyan-300/80">
              Generating holographic SVG geometry, circuit connectors, and semantic nodes...
            </p>
            <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 animate-pulse w-3/4"></div>
            </div>
          </div>
        </HudCard>
      )}

      {/* Blueprint Visual Display */}
      {currentBlueprint && !generate.isPending && (
        <div className="space-y-6">
          {/* Main SVG Viewer Card */}
          <div
            className={`rounded-2xl border border-cyan-500/30 bg-[#070c17] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all ${
              isFullscreen ? "fixed inset-4 z-50 flex flex-col bg-[#070c17]/95 backdrop-blur-2xl" : ""
            }`}
          >
            {/* Viewer Toolbar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0a1120] border-b border-cyan-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-mono font-bold text-white tracking-wide uppercase">
                  {currentBlueprint.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 uppercase">
                  {currentBlueprint.style}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopySvg}
                  className="h-8 px-2.5 bg-[#0d172a] hover:bg-cyan-950 border-cyan-500/30 text-cyan-300 text-xs gap-1.5"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy SVG"}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadSvg}
                  className="h-8 px-2.5 bg-[#0d172a] hover:bg-cyan-950 border-cyan-500/30 text-cyan-300 text-xs gap-1.5"
                >
                  <Download size={13} />
                  <span>Export</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="h-8 w-8 p-0 bg-[#0d172a] hover:bg-cyan-950 border-cyan-500/30 text-cyan-300"
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </Button>
              </div>
            </div>

            {/* SVG Render Canvas */}
            <div
              className={`w-full p-4 overflow-auto flex items-center justify-center ${
                isFullscreen ? "flex-1 min-h-0" : "min-h-[420px] max-h-[580px]"
              }`}
              dangerouslySetInnerHTML={{ __html: currentBlueprint.svg }}
            />

            {/* Footer Status */}
            <div className="px-5 py-2.5 bg-[#090f1d] border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Info size={12} className="text-cyan-400" />
                <span>Interactive vector generated by Pathly Visual Engine</span>
              </span>
              <span>SAVED IN DATABASE ARTIFACTS</span>
            </div>
          </div>

          {/* Conceptual Blueprint Breakdown */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Overview & Core Nodes */}
            <HudCard accent="cyan" eyebrow="Architectural Nodes" className="p-6">
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                {currentBlueprint.overview}
              </p>
              <div className="space-y-2.5">
                {currentBlueprint.nodes.map((node, index) => (
                  <div
                    key={node.id || index}
                    onMouseEnter={() => setActiveNode(node.id)}
                    onMouseLeave={() => setActiveNode(null)}
                    className={`p-3 rounded-xl border transition-all ${
                      activeNode === node.id
                        ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.15)]"
                        : "bg-[#080e1a] border-slate-800 hover:border-cyan-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        {node.label}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                        {node.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {node.description}
                    </p>
                  </div>
                ))}
              </div>
            </HudCard>

            {/* Key Takeaways & Synthesis */}
            <HudCard accent="purple" eyebrow="Conceptual Takeaways" className="p-6">
              <div className="space-y-3.5">
                {currentBlueprint.keyTakeaways.map((takeaway, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0e0c1f] border border-purple-500/20"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-purple-950/80 border border-purple-500/40 text-xs font-mono text-purple-300">
                      0{index + 1}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {takeaway}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-[#091122] border border-cyan-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-cyan-300 font-semibold uppercase">
                    Saved Artifact
                  </p>
                  <p className="text-[11px] text-slate-400">
                    This blueprint is preserved under your Saved Work history.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleDownloadSvg}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  <Download size={13} className="mr-1.5" /> Export SVG
                </Button>
              </div>
            </HudCard>
          </div>
        </div>
      )}

      {/* Initial Empty State Placeholder */}
      {!currentBlueprint && !generate.isPending && (
        <HudCard accent="teal" className="p-10 text-center border-dashed border-teal-500/20">
          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-950/50 border border-teal-500/30 grid place-items-center text-teal-400 mb-4">
              <Layers size={26} />
            </div>
            <h4 className="text-base font-bold text-white font-display">
              Ready for Visual Synthesis
            </h4>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Enter any technical concept or choose a preset above to generate an interactive SVG architecture blueprint with full node telemetry.
            </p>
            <div className="mt-5 flex gap-2 flex-wrap justify-center">
              {PRESETS.slice(0, 3).map(p => (
                <button
                  key={p.label}
                  onClick={() => {
                    setTopic(p.topic);
                    setStyle(p.style);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#0d1829] border border-teal-500/25 text-xs text-teal-300 hover:bg-teal-950/60 transition-colors"
                >
                  Try &ldquo;{p.label}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </HudCard>
      )}
    </div>
  );
}
