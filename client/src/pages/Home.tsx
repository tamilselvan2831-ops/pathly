import { AIChatBox, Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  reportAssistantPerformance,
  streamAssistantResponse,
} from "@/lib/assistantStream";
import {
  calculateSkillGap,
  CAREER_PATHS,
  CareerPath,
  createGuidanceFallback,
} from "@shared/advisor";
import {
  getResourcesForCareer,
  LEARNING_RESOURCES,
} from "@shared/learningResources";
import {
  trimAssistantMessageContent,
  trimAssistantMessages,
} from "@shared/assistant";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";
import { useEffect, useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  Brain,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleHelp,
  Clock,
  Cloud,
  Compass,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  GraduationCap,
  Headphones,
  History,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Maximize2,
  Menu,
  MessageCircle,
  Mic,
  Minimize2,
  Network,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Target,
  Trash2,
  Upload,
  Video,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { HudCard } from "@/components/ui/hud-card";
import { HudTelemetryRibbon } from "@/components/ui/hud-telemetry";
import { VisualLab } from "@/components/labs/VisualLab";

GlobalWorkerOptions.workerSrc = workerSrc;

type View =
  | "overview"
  | "assistant"
  | "voice"
  | "video"
  | "visual"
  | "documents"
  | "resume"
  | "domains"
  | "skills"
  | "roadmap"
  | "quiz"
  | "resources"
  | "profile"
  | "history";
type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};
type VoiceStatus =
  | "ready"
  | "listening"
  | "processing"
  | "speaking"
  | "finished"
  | "error";

type NavItem = {
  id: View;
  label: string;
  icon: typeof LayoutDashboard;
  group: string;
};
const nav: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    group: "Workspace",
  },
  { id: "assistant", label: "AI Assistant", icon: Bot, group: "Workspace" },
  { id: "voice", label: "Voice Coach", icon: Mic, group: "Workspace" },
  { id: "video", label: "Video Lab", icon: Video, group: "Workspace" },
  { id: "visual", label: "Visual Lab", icon: Network, group: "Tools" },
  { id: "documents", label: "PDF Lab", icon: FileText, group: "Tools" },
  { id: "resume", label: "Resume Lab", icon: FileCheck2, group: "Tools" },
  {
    id: "domains",
    label: "Explore Domains",
    icon: Compass,
    group: "Career Planning",
  },
  {
    id: "skills",
    label: "Skill Compass",
    icon: Target,
    group: "Career Planning",
  },
  {
    id: "roadmap",
    label: "My Roadmap",
    icon: Activity,
    group: "Career Planning",
  },
  { id: "quiz", label: "Quiz Studio", icon: CircleHelp, group: "Learning" },
  { id: "resources", label: "Resources", icon: BookOpen, group: "Learning" },
  { id: "history", label: "Saved Work", icon: History, group: "Learning" },
];

const defaultMessages: Message[] = [
  {
    role: "assistant",
    content:
      "Welcome to **Pathly**. I can help with programming, study planning, career choices, interview preparation, resumes, and project direction. What are you working toward?",
  },
];
const defaultSkills = ["Figma", "Storytelling", "HTML", "Accessibility"];

function initials(name?: string | null) {
  return (name || "Guest")
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function parseJsonList(value: string | null | undefined, fallback: string[]) {
  try {
    const parsed = JSON.parse(value || "");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function SectionHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-tight text-white font-display mt-1.5">
        {title}
      </h2>
      {detail && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          {detail}
        </p>
      )}
    </div>
  );
}

function CareerCard({
  career,
  selected,
  onSelect,
}: {
  career: CareerPath;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone =
    career.accent === "coral"
      ? "bg-amber-950/60 text-amber-300 border-amber-500/30"
      : career.accent === "violet"
        ? "bg-purple-950/60 text-purple-300 border-purple-500/30"
        : "bg-cyan-950/60 text-cyan-300 border-cyan-500/30";
  return (
    <article
      className={`career-card relative rounded-2xl border p-5 backdrop-blur-xl transition-all ${
        selected
          ? "border-cyan-400 bg-[#0d1c2e]/90 shadow-[0_0_24px_rgba(0,242,254,0.18)]"
          : "border-slate-800 bg-[#091120]/80 hover:border-cyan-500/30 hover:bg-[#0c1527]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl border ${tone}`}>
          <Compass size={18} />
        </div>
        <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-bold">
          {career.match}% FIT
        </span>
      </div>
      <p className="mt-4 text-[10px] font-mono font-bold uppercase tracking-[.14em] text-cyan-400">
        {career.category}
      </p>
      <h3 className="mt-1.5 text-xl font-bold tracking-tight text-white font-display">
        {career.title}
      </h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">
        {career.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {career.requiredSkills.slice(0, 3).map(skill => (
          <span
            key={skill}
            className="rounded-lg bg-[#0c192d] border border-slate-700/60 px-2.5 py-1 text-[11px] font-mono text-slate-300"
          >
            {skill}
          </span>
        ))}
      </div>
      <button
        className="mt-5 flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        onClick={onSelect}
      >
        {selected ? "Selected pathway" : "Explore pathway"}
        <ArrowRight size={15} />
      </button>
    </article>
  );
}

function SignInCard() {
  return (
    <div className="paper rounded-2xl p-7 text-center border-cyan-500/20 bg-[#0a1222]/80 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.2)]">
        <Sparkles size={22} />
      </div>
      <h3 className="mt-4 text-2xl font-bold text-white font-display">Initialize Neural Sync</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        Sign in to save profile updates, AI conversations, visual blueprints, explainer videos, resume audits, and roadmap milestones across sessions.
      </p>
      <Button
        onClick={() => startLogin()}
        className="mt-5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold px-6 shadow-[0_0_20px_rgba(0,242,254,0.3)]"
      >
        Sign in to continue
      </Button>
    </div>
  );
}

function Overview({
  selectedCareer,
  setSelectedCareer,
  profile,
  setView,
  isAuthenticated,
}: {
  selectedCareer: CareerPath;
  setSelectedCareer: (career: CareerPath) => void;
  profile?: any;
  setView: (view: View) => void;
  isAuthenticated: boolean;
}) {
  const skills = parseJsonList(profile?.skills, defaultSkills);
  const recommendations = trpc.advisor.recommend.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const gap = useMemo(
    () => calculateSkillGap(skills, selectedCareer.slug),
    [skills, selectedCareer.slug]
  );
  const name = profile?.careerGoal
    ? profile.careerGoal.split(" ")[0]
    : "Explorer";

  const labPortals: Array<{ id: View; label: string; desc: string; icon: any; color: string; badge: string }> = [
    { id: "assistant", label: "AI Assistant", desc: "Streaming neural problem solver & code mentor", icon: Bot, color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40", badge: "GPT-5 HYBRID" },
    { id: "voice", label: "Voice Coach", desc: "Real-time conversational speech coach with Whisper", icon: Mic, color: "text-purple-400 border-purple-500/30 bg-purple-950/40", badge: "VOICE AI" },
    { id: "video", label: "Video Lab", desc: "Runway Gen-4.5 cinematic video explainer pipeline", icon: Video, color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40", badge: "RUNWAY DEV" },
    { id: "visual", label: "Visual Lab", desc: "Synthesize interactive SVG architectures & flowcharts", icon: Network, color: "text-teal-400 border-teal-500/30 bg-teal-950/40", badge: "VECTOR AI" },
    { id: "documents", label: "PDF Lab", desc: "PDF intelligence, deep document study notes & synthesis", icon: FileText, color: "text-blue-400 border-blue-500/30 bg-blue-950/40", badge: "DOCUMENT AI" },
    { id: "resume", label: "Resume Lab", desc: "ATS readiness audit, section scores & impact rewrites", icon: FileCheck2, color: "text-amber-400 border-amber-500/30 bg-amber-950/40", badge: "CAREER AI" },
    { id: "quiz", label: "Quiz Studio", desc: "Dynamic interactive simulations & knowledge streak tests", icon: CircleHelp, color: "text-pink-400 border-pink-500/30 bg-pink-950/40", badge: "PRACTICE" },
  ];

  return (
    <div className="space-y-10">
      {/* Live Provider & Telemetry Bar */}
      <HudTelemetryRibbon />

      {/* Main Welcome Hero */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="eyebrow">PATHLY // NEURAL PLATFORM v3.0</span>
            <span className="text-xs font-mono text-slate-400">// WORKSPACE ROOT</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-display">
            A clearer next step, <span className="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">{name}</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Pathly brings AI reasoning, voice coaching, video explainer synthesis, and visual blueprints into one unified cinematic command center.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="outline"
            className="rounded-xl border-cyan-500/30 bg-[#091122] text-cyan-300 hover:bg-cyan-950/60 font-medium"
            onClick={() => setView("assistant")}
          >
            <MessageCircle className="mr-2 h-4 w-4 text-cyan-400" />
            Launch Assistant
          </Button>
          <Button
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(0,242,254,0.25)]"
            onClick={() => setView("profile")}
          >
            <Target className="mr-2 h-4 w-4" />
            Refine Profile
          </Button>
        </div>
      </div>

      {/* Quick Launch Lab Portals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="eyebrow">NEURAL LAB MATRIX</span>
            <span className="text-xs font-mono text-slate-400">// RAPID ACCESS</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {labPortals.map(lab => (
            <button
              key={lab.id}
              onClick={() => setView(lab.id)}
              className="group p-4 rounded-2xl border border-slate-800 bg-[#08101e]/80 hover:border-cyan-500/40 hover:bg-[#0c162b] text-left transition-all duration-200 hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(0,242,254,0.12)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl border ${lab.color}`}>
                    <lab.icon size={16} />
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-cyan-300 transition-colors">
                    {lab.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors font-display">
                  {lab.label}
                </h4>
                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {lab.desc}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-mono text-cyan-400/80 group-hover:text-cyan-300">
                <span>Enter Lab</span>
                <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Profile-Guided Recommendations */}
      {isAuthenticated && recommendations.data && (
        <section className="rounded-2xl border border-cyan-500/20 bg-[#091222]/80 p-6 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow !text-cyan-400">
                SYNAPSE SUGGESTIONS
              </p>
              <h2 className="text-2xl font-bold text-white font-display mt-1">
                Directions aligned with your telemetry.
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Correlated with your saved skills &amp; pace
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {recommendations.data.map(item => (
              <button
                key={item.slug}
                onClick={() =>
                  setSelectedCareer(
                    CAREER_PATHS.find(career => career.slug === item.slug) ||
                      selectedCareer
                  )
                }
                className="rounded-xl border border-slate-800 bg-[#060c18] p-4 text-left hover:border-cyan-500/40 hover:bg-[#0a1324] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-display">
                    {item.title}
                  </span>
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    {item.score}% FIT
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  {item.reasons.join(" · ")}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Telemetry Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <HudCard accent="cyan" className="p-5">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Path Clarity</span>
            <Compass size={18} className="text-cyan-400" />
          </div>
          <p className="mt-5 text-4xl font-bold tracking-tight text-white font-display">
            {selectedCareer.match}%
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Alignment signal for {selectedCareer.title}
          </p>
          <Progress
            value={selectedCareer.match}
            className="mt-5 h-2 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-teal-400"
          />
        </HudCard>

        <HudCard accent="purple" className="p-5">
          <div className="flex items-center justify-between">
            <span className="eyebrow !text-purple-400">Skill Readiness</span>
            <Brain size={18} className="text-purple-400" />
          </div>
          <p className="mt-5 text-4xl font-bold tracking-tight text-white font-display">
            {gap.readiness}
            <span className="text-xl text-purple-300 font-mono">%</span>
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Diagnostic capability benchmark
          </p>
          <Progress
            value={gap.readiness}
            className="mt-5 h-2 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-indigo-400"
          />
        </HudCard>

        <button
          onClick={() => setView("roadmap")}
          className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#0e2238] to-[#071120] p-5 text-left text-white shadow-[0_16px_40px_rgba(0,242,254,0.12)] transition-transform hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="eyebrow !text-cyan-300">Active Objective</span>
              <Zap size={18} className="text-amber-400 animate-pulse" />
            </div>
            <p className="mt-5 text-xl font-bold leading-tight font-display">
              Synthesize one gap into a verifiable artifact.
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Open your phased roadmap and execute a small visible milestone.
            </p>
          </div>
          <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-cyan-300">
            View Roadmap <ArrowRight size={15} />
          </span>
        </button>
      </div>

      {/* Pathway Explorations */}
      <div>
        <div className="flex items-end justify-between mb-5">
          <SectionHeading
            eyebrow="Explore Domains"
            title="Futuristic Paths Worth Exploring."
            detail="Lock onto an engineering or design frontier, then let your experiments sharpen the choice."
          />
          <button
            onClick={() => setView("domains")}
            className="hidden items-center gap-1 text-sm font-semibold text-cyan-400 hover:text-cyan-300 sm:flex"
          >
            View all domains <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {CAREER_PATHS.slice(0, 3).map(career => (
            <CareerCard
              key={career.slug}
              career={career}
              selected={selectedCareer.slug === career.slug}
              onSelect={() => setSelectedCareer(career)}
            />
          ))}
        </div>
      </div>

      {/* Skill Compass & Three-Part Rhythm */}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <HudCard accent="cyan" eyebrow="Skill Compass" className="p-6">
          <h3 className="text-2xl font-bold text-white font-display mb-2">
            The gap is your launch vector.
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            For {selectedCareer.title}, close competency gaps through tangible lab artifacts rather than passive reading alone.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-[.14em] text-cyan-400">
                In Your Toolkit
              </p>
              <div className="mt-3 space-y-2">
                {gap.strengths.slice(0, 4).map(skill => (
                  <div
                    key={skill}
                    className="flex items-center gap-2 rounded-xl bg-cyan-950/40 border border-cyan-500/25 px-3 py-2 text-sm font-medium text-cyan-200"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-cyan-500 text-slate-950">
                      <Check size={12} />
                    </span>
                    {skill}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-[.14em] text-amber-400">
                Priority to Develop
              </p>
              <div className="mt-3 space-y-2">
                {gap.gaps.slice(0, 4).map((skill, index) => (
                  <div
                    key={skill}
                    className="flex items-center justify-between rounded-xl bg-amber-950/30 border border-amber-500/25 px-3 py-2 text-sm font-medium text-amber-200"
                  >
                    <span>{skill}</span>
                    <span className="font-mono text-[10px] uppercase text-amber-400">
                      {index === 0 ? "Start here" : "Next"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-6 rounded-xl border-cyan-500/30 bg-[#091122] text-cyan-300 hover:bg-cyan-950/60 font-medium"
            onClick={() => setView("skills")}
          >
            Open full skill analysis <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </HudCard>

        <HudCard accent="teal" eyebrow="Three-Part Rhythm" className="p-6">
          <h3 className="text-2xl font-bold text-white font-display mt-1">
            Learn, Synthesize, Reflect.
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            A resilient learning cycle combines structured knowledge with visible, playable evidence you can critique and iterate.
          </p>
          <div className="mt-6 space-y-4">
            {[
              [BookOpen, "Learn", "Consume one verified high-signal source."],
              [BriefcaseBusiness, "Synthesize", "Build an artifact in Visual or Video Lab."],
              [Lightbulb, "Reflect", "Note what changed in your mental model."],
            ].map(([Icon, title, detail]) => (
              <div
                key={String(title)}
                className="flex items-center gap-3.5 border-l-2 border-teal-500/50 pl-4 py-1"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-400">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white font-display">
                    {String(title)}
                  </p>
                  <p className="text-xs text-slate-400">{String(detail)}</p>
                </div>
              </div>
            ))}
          </div>
        </HudCard>
      </div>

      {!isAuthenticated && <SignInCard />}
    </div>
  );
}

function AssistantView({
  selectedCareer,
  isAuthenticated,
}: {
  selectedCareer: CareerPath;
  isAuthenticated: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [lastPrompt, setLastPrompt] = useState("");
  const [error, setError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const streamControllerRef = useRef<AbortController | null>(null);
  const history = trpc.advisor.history.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const advisor = trpc.advisor.chat.useMutation({
    onSuccess: response => {
      setError("");
      setMessages(current => [
        ...current,
        { role: "assistant", content: response.content },
      ]);
    },
    onError: () =>
      setError("The career advisor could not respond. Retry in a moment."),
  });

  useEffect(() => {
    if (history.data?.length && !streamControllerRef.current) {
      setMessages([
        defaultMessages[0],
        ...history.data
          .slice()
          .reverse()
          .map(item => ({ role: item.role, content: item.content }) as Message),
      ]);
    }
  }, [history.data]);

  useEffect(
    () => () => {
      streamControllerRef.current?.abort();
    },
    []
  );

  const cancelStream = () => {
    streamControllerRef.current?.abort();
    streamControllerRef.current = null;
    setIsStreaming(false);
  };

  const send = (content: string) => {
    if (streamControllerRef.current || advisor.isPending) return;
    const safeContent = trimAssistantMessageContent(content);
    const wasTrimmed = safeContent !== content;
    const requestMessages = trimAssistantMessages([
      ...messages
        .filter(
          (item): item is Message & { role: "user" | "assistant" } =>
            item.role !== "system"
        )
        .slice(-19),
      { role: "user", content: safeContent },
    ]);
    setLastPrompt(safeContent);
    setError(
      wasTrimmed
        ? "Your message was trimmed to 4,000 characters so the assistant can process it."
        : ""
    );
    setMessages(current => [
      ...current,
      { role: "user", content: safeContent },
      { role: "assistant", content: "" },
    ]);

    if (!isAuthenticated) {
      window.setTimeout(
        () =>
          setMessages(current => [
            ...current.slice(0, -1),
            {
              role: "assistant",
              content: createGuidanceFallback(safeContent, selectedCareer.slug),
            },
          ]),
        400
      );
      return;
    }

    const controller = new AbortController();
    streamControllerRef.current = controller;
    setIsStreaming(true);
    void streamAssistantResponse(
      requestMessages,
      delta =>
        setMessages(current => {
          const last = current.at(-1);
          if (!last || last.role !== "assistant") return current;
          return [
            ...current.slice(0, -1),
            { ...last, content: last.content + delta },
          ];
        }),
      controller.signal
    )
      .then(() => {
        setError("");
      })
      .catch((streamError: unknown) => {
        if (controller.signal.aborted) {
          setMessages(current => {
            const last = current.at(-1);
            return last?.role === "assistant" && !last.content
              ? current.slice(0, -1)
              : current;
          });
          return;
        }
        if (
          streamError instanceof Error &&
          streamError.message === "AUTH_REQUIRED"
        )
          startLogin();
        setError(
          "The assistant took too long or the connection failed. Retry your last question."
        );
        setMessages(current => {
          const last = current.at(-1);
          return last?.role === "assistant" && !last.content
            ? current.slice(0, -1)
            : current;
        });
      })
      .finally(() => {
        if (streamControllerRef.current === controller)
          streamControllerRef.current = null;
        setIsStreaming(false);
      });
  };

  const loading = isStreaming || advisor.isPending;
  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
      <div>
        <SectionHeading
          eyebrow="General-purpose AI"
          title="Ask better questions."
          detail="A context-aware assistant for technical concepts, study planning, career decisions, writing, interview prep, and project work."
        />
        <AIChatBox
          className="mt-5 overflow-hidden rounded-[1.35rem] border border-[#e1e8de] bg-white shadow-[0_18px_55px_rgba(25,48,38,.06)]"
          height={590}
          messages={messages}
          onSendMessage={send}
          onCancel={cancelStream}
          isLoading={loading}
          suggestedPrompts={[
            "Explain a difficult programming concept with an example",
            "Help me plan a 4-week portfolio project",
            "Review my interview answer structure",
          ]}
          placeholder="Ask anything you are learning..."
        />
        {error && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#faf0e8] px-4 py-3 text-sm text-[#875e46]">
            <span>{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => lastPrompt && send(lastPrompt)}
              className="shrink-0 border-[#e5c5b2] text-[#875e46]"
            >
              Retry
            </Button>
          </div>
        )}
      </div>
      <aside className="space-y-4">
        <div className="paper rounded-[1.35rem] p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dff0e6] text-[#2f7654]">
              <Bot size={19} />
            </div>
            <div>
              <p className="font-semibold text-[#234a38]">Pathly assistant</p>
              <p className="text-xs text-[#718278]">
                Grounded, practical, transparent
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm leading-6 text-[#63776b]">
            <p>
              Use the assistant for broad questions. For saved career context,
              select a pathway and ask about your next step.
            </p>
            <p>
              AI output can be incomplete. Verify important technical, academic,
              or professional decisions with primary sources and a mentor.
            </p>
          </div>
          <div className="mt-5 rounded-xl bg-[#f4f7f1] p-3 text-xs text-[#5f7468]">
            Current focus:{" "}
            <b className="text-[#315c48]">{selectedCareer.title}</b>
          </div>
        </div>
        <div className="paper rounded-[1.35rem] p-6">
          <p className="eyebrow">Career advisor mode</p>
          <h3 className="serif mt-2 text-2xl text-[#1d3d2e]">
            Stay close to your path.
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#697c71]">
            Ask a question about {selectedCareer.title} and the curated
            materials for that direction.
          </p>
          <Button
            variant="outline"
            onClick={() =>
              advisor.mutate({
                message: `What should I do next to prepare for ${selectedCareer.title}?`,
                careerSlug: selectedCareer.slug,
              })
            }
            className="mt-4 rounded-xl border-[#d8e2d8] text-[#356d54]"
          >
            Generate next step <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </aside>
    </div>
  );
}

function VoiceView({
  setView,
  isAuthenticated,
}: {
  setView: (view: View) => void;
  isAuthenticated: boolean;
}) {
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [audioPaused, setAudioPaused] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>("ready");
  const [voiceError, setVoiceError] = useState("");
  const [microphonePermission, setMicrophonePermission] = useState<
    "unknown" | "prompt" | "granted" | "denied" | "no-device" | "unsupported"
  >("unknown");
  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const voiceConversationRef = useRef<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const voiceControllerRef = useRef<AbortController | null>(null);
  const speechBufferRef = useRef("");
  const speechQueueRef = useRef<string[]>([]);
  const speechActiveRef = useRef(false);
  const voiceStartedAtRef = useRef<number | null>(null);
  const firstAudioReportedRef = useRef(false);

  useEffect(() => {
    let active = true;
    const checkMicrophone = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (active) setMicrophonePermission("unsupported");
        return;
      }
      try {
        const audioInputs = (
          await navigator.mediaDevices.enumerateDevices()
        ).filter(device => device.kind === "audioinput");
        if (!audioInputs.length) {
          if (active) setMicrophonePermission("no-device");
          return;
        }
        const permission = navigator.permissions?.query
          ? await navigator.permissions
              .query({ name: "microphone" as PermissionName })
              .catch(() => null)
          : null;
        if (active)
          setMicrophonePermission(
            permission?.state === "denied"
              ? "denied"
              : permission?.state === "granted"
                ? "granted"
                : "prompt"
          );
        permission?.addEventListener?.("change", () => {
          if (active)
            setMicrophonePermission(
              permission.state === "denied"
                ? "denied"
                : permission.state === "granted"
                  ? "granted"
                  : "prompt"
            );
        });
      } catch {
        if (active) setMicrophonePermission("unknown");
      }
    };
    void checkMicrophone();
    return () => {
      active = false;
    };
  }, []);

  const speakNextQueuedChunk = () => {
    if (speechActiveRef.current || !window.speechSynthesis) return;
    const next = speechQueueRef.current.shift();
    if (!next) return;
    speechActiveRef.current = true;
    const utterance = new SpeechSynthesisUtterance(next.replace(/[*#_`]/g, ""));
    utterance.onstart = () => {
      if (
        !firstAudioReportedRef.current &&
        voiceStartedAtRef.current !== null
      ) {
        firstAudioReportedRef.current = true;
        reportAssistantPerformance(
          "time-to-first-audio",
          performance.now() - voiceStartedAtRef.current
        );
      }
      setSpeaking(true);
      setStatus("speaking");
    };
    utterance.onend = () => {
      speechActiveRef.current = false;
      setSpeaking(false);
      speakNextQueuedChunk();
    };
    utterance.onerror = () => {
      speechActiveRef.current = false;
      setSpeaking(false);
      setAudioPaused(false);
      setVoiceError(
        "Audio playback failed. You can read the answer or use Replay to try again."
      );
      setStatus("error");
    };
    window.speechSynthesis.speak(utterance);
  };

  const enqueueSpeech = (chunk: string, flush = false) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    speechBufferRef.current += chunk;
    const sentencePattern = /^([\s\S]*?[.!?](?:[\s\n]|$))/;
    let match = sentencePattern.exec(speechBufferRef.current);
    while (match) {
      const sentence = match[1].trim();
      if (sentence) speechQueueRef.current.push(sentence);
      speechBufferRef.current = speechBufferRef.current.slice(match[1].length);
      match = sentencePattern.exec(speechBufferRef.current);
    }
    if (flush && speechBufferRef.current.trim()) {
      speechQueueRef.current.push(speechBufferRef.current.trim());
      speechBufferRef.current = "";
    }
    speakNextQueuedChunk();
  };

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setVoiceError(
        "Text-to-speech is not available in this browser. You can still read the answer on screen."
      );
      setStatus("error");
      return;
    }
    window.speechSynthesis.cancel();
    speechQueueRef.current = [];
    speechBufferRef.current = "";
    speechActiveRef.current = false;
    setAudioPaused(false);
    enqueueSpeech(text, true);
  };

  const cancelVoiceRequest = () => {
    voiceControllerRef.current?.abort();
    voiceControllerRef.current = null;
    recognitionRef.current?.stop?.();
    window.speechSynthesis?.cancel();
    speechQueueRef.current = [];
    speechBufferRef.current = "";
    speechActiveRef.current = false;
    setListening(false);
    setSpeaking(false);
    setAudioPaused(false);
    setStatus("ready");
  };

  useEffect(
    () => () => {
      voiceControllerRef.current?.abort();
      recognitionRef.current?.stop?.();
      recorderRef.current?.stop?.();
      window.speechSynthesis?.cancel();
    },
    []
  );

  const streamVoiceAnswer = (
    messages: Array<{ role: "user" | "assistant"; content: string }>
  ) => {
    voiceControllerRef.current?.abort();
    window.speechSynthesis?.cancel();
    speechQueueRef.current = [];
    speechBufferRef.current = "";
    speechActiveRef.current = false;
    const controller = new AbortController();
    voiceStartedAtRef.current = performance.now();
    firstAudioReportedRef.current = false;
    voiceControllerRef.current = controller;
    setAnswer("");
    setVoiceError("");
    setStatus("processing");
    let streamed = "";
    void streamAssistantResponse(
      messages,
      delta => {
        streamed += delta;
        setAnswer(streamed);
        enqueueSpeech(delta);
      },
      controller.signal
    )
      .then(() => {
        voiceConversationRef.current = [
          ...voiceConversationRef.current,
          { role: "assistant" as const, content: streamed },
        ].slice(-10);
        enqueueSpeech("", true);
        setStatus(
          speechQueueRef.current.length || speechActiveRef.current
            ? "speaking"
            : "finished"
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof Error && error.message === "AUTH_REQUIRED")
          startLogin();
        setVoiceError(
          "The AI response could not be generated. Please retry or use text chat."
        );
        setStatus("error");
        setSpeaking(false);
      })
      .finally(() => {
        if (voiceControllerRef.current === controller)
          voiceControllerRef.current = null;
      });
  };

  const processTranscript = (text: string) => {
    const clean = text.trim();
    if (!clean) {
      setVoiceError(
        "No speech was recognized. Please try again and speak clearly."
      );
      setStatus("error");
      return;
    }
    setTranscript(clean);
    setVoiceError("");
    if (!isAuthenticated) {
      const fallback = createGuidanceFallback(clean);
      setAnswer(fallback);
      setStatus("finished");
      speak(fallback);
      return;
    }
    const messages = [
      ...voiceConversationRef.current,
      { role: "user" as const, content: clean },
    ].slice(-10);
    voiceConversationRef.current = messages;
    streamVoiceAnswer(messages);
  };

  const transcribe = trpc.voice.transcribe.useMutation({
    retry: (failureCount, error) =>
      failureCount < 1 &&
      /Failed to fetch|network|timeout|5\d\d/i.test(error.message),
    retryDelay: 800,
    onSuccess: response => {
      if (!response.text) {
        setVoiceError(
          `Whisper is unavailable${response.error ? `: ${response.error}` : "."} Starting browser speech recognition fallback…`
        );
        setStatus("error");
        window.setTimeout(() => startBrowserFallback(), 250);
        return;
      }
      processTranscript(response.text);
    },
    onError: error => {
      setVoiceError(
        `Whisper transcription failed: ${error.message}. Starting browser speech recognition fallback…`
      );
      setStatus("error");
      window.setTimeout(() => startBrowserFallback(), 250);
    },
  });

  async function recordWhisper() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (voiceControllerRef.current || speaking) cancelVoiceRequest();
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceError(
        "Audio recording is not supported in this browser. Use Start speaking instead."
      );
      setStatus("error");
      return;
    }
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (transcribe.isPending) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setMicrophonePermission(
        name === "NotFoundError"
          ? "no-device"
          : name === "NotAllowedError"
            ? "denied"
            : "unknown"
      );
      setVoiceError(
        name === "NotFoundError"
          ? "No microphone device was found. Connect a microphone and try again."
          : name === "NotAllowedError"
            ? "Microphone permission was denied. In your browser address bar, open site settings, set Microphone to Allow, then retry."
            : "The microphone is unavailable. Check browser permissions and device settings."
      );
      setStatus("error");
      return;
    }
    setMicrophonePermission("granted");
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach(track => track.stop());
      setVoiceError(
        "The browser could not start audio recording. Use Start speaking instead."
      );
      setStatus("error");
      return;
    }
    const chunks: BlobPart[] = [];
    recorder.onerror = () => {
      stream.getTracks().forEach(track => track.stop());
      setRecording(false);
      setVoiceError(
        "Recording failed before the clip could be uploaded. Please try again."
      );
      setStatus("error");
    };
    recorder.ondataavailable = event =>
      event.data.size && chunks.push(event.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      setRecording(false);
      setStatus("processing");
      setVoiceError("");
      const blob = new Blob(chunks, {
        type: recorder.mimeType || "audio/webm",
      });
      if (blob.size > 16 * 1024 * 1024) {
        setVoiceError("Keep the recording under 16 MB.");
        setStatus("error");
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => {
        setVoiceError(
          "The recording could not be prepared for transcription. Please try again."
        );
        setStatus("error");
      };
      reader.onloadend = () => {
        const data = String(reader.result || "");
        const type = (recorder.mimeType || "audio/webm").split(";")[0] as
          | "audio/webm"
          | "audio/mp4"
          | "audio/wav"
          | "audio/ogg"
          | "audio/mpeg";
        transcribe.mutate({ audioBase64: data, mimeType: type });
      };
      reader.readAsDataURL(blob);
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setStatus("listening");
    setVoiceError("");
  }

  async function startBrowserFallback() {
    if (recording || transcribe.isPending) return;
    const Recognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError(
        "Speech recognition is not available in this browser. You can type a question in the AI assistant instead."
      );
      setStatus("error");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError(
        "This browser cannot access a microphone. You can use text chat instead."
      );
      setStatus("error");
      return;
    }
    if (voiceControllerRef.current || speaking) cancelVoiceRequest();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setMicrophonePermission(
        name === "NotFoundError"
          ? "no-device"
          : name === "NotAllowedError"
            ? "denied"
            : "unknown"
      );
      setVoiceError(
        name === "NotFoundError"
          ? "No microphone device was found. Connect a microphone and try again."
          : name === "NotAllowedError"
            ? "Microphone permission was denied. In your browser address bar, open site settings, set Microphone to Allow, then use Start speaking again."
            : "The microphone is unavailable. Check browser permissions and device settings."
      );
      setStatus("error");
      setListening(false);
      return;
    }
    setVoiceError("");
    setStatus("listening");
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      processTranscript(text);
    };
    recognition.onerror = (event: any) => {
      setVoiceError(
        event?.error === "not-allowed"
          ? "Microphone permission was denied. Allow microphone access or use text chat."
          : "Microphone or speech recognition failed. Please try again or use text chat."
      );
      setStatus("error");
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      setStatus((current: VoiceStatus) =>
        current === "listening" ? "ready" : current
      );
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setVoiceError(
        "Speech recognition could not start. Please try again or use text chat."
      );
      setStatus("error");
      setListening(false);
    }
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setStatus("ready");
      return;
    }
    void startBrowserFallback();
  }

  function stopAudio() {
    window.speechSynthesis?.cancel();
    speechQueueRef.current = [];
    speechBufferRef.current = "";
    speechActiveRef.current = false;
    setSpeaking(false);
    setAudioPaused(false);
    if (answer) setStatus("finished");
  }

  function toggleAudioPause() {
    if (!window.speechSynthesis || !answer) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setAudioPaused(false);
    } else {
      window.speechSynthesis.pause();
      setAudioPaused(true);
    }
  }

  const statusLabel =
    status === "ready"
      ? "Ready"
      : status === "listening"
        ? "Listening…"
        : status === "processing"
          ? "Synthesizing…"
          : status === "speaking"
            ? "Vocalizing…"
            : status === "finished"
              ? "Session idle"
              : "Subsystem error";

  return (
    <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
      <div>
        <SectionHeading
          eyebrow="Neural Audio Interface"
          title="Voice Coach."
          detail="Bidirectional neural voice channel. Pathly captures your spoken ideas, synthesizes reasoned responses, and reads them with low-latency audio feedback."
        />
        <div className="hud-panel mt-5 p-7 text-center relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Holographic Glowing Mic Ring & Audio Waves */}
          <div className="relative mx-auto mt-2 grid h-32 w-32 place-items-center">
            {listening && (
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400/60 animate-ping" />
            )}
            {speaking && (
              <div className="absolute inset-0 rounded-full border-2 border-teal-400/60 animate-pulse" />
            )}
            <div
              className={`relative grid h-28 w-28 place-items-center rounded-full transition-all duration-500 ${
                listening
                  ? "bg-gradient-to-br from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_35px_rgba(0,242,254,0.6)]"
                  : speaking
                    ? "bg-gradient-to-br from-teal-500 to-emerald-400 text-slate-950 shadow-[0_0_35px_rgba(20,184,166,0.6)]"
                    : status === "processing"
                      ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse"
                      : "bg-[#09152a] text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,242,254,0.15)]"
              }`}
            >
              {listening ? (
                <Mic size={38} className="animate-bounce" />
              ) : speaking ? (
                <Volume2 size={38} className="animate-pulse" />
              ) : (
                <Headphones size={38} />
              )}
            </div>
          </div>

          {/* Sound Wave Frequency Visualizer Simulation */}
          <div className="mt-5 flex items-center justify-center gap-1.5 h-8">
            {[40, 75, 100, 60, 85, 45, 90, 65, 30, 80, 95, 50, 70, 35].map(
              (height, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    listening
                      ? "bg-cyan-400 animate-pulse"
                      : speaking
                        ? "bg-teal-400 animate-pulse"
                        : "bg-slate-800"
                  }`}
                  style={{
                    height:
                      listening || speaking
                        ? `${Math.max(15, (height * (listening ? 0.9 : 0.7)))}%`
                        : "18%",
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              )
            )}
          </div>

          {/* Status readout badge */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                listening
                  ? "bg-cyan-400 animate-ping"
                  : speaking
                    ? "bg-teal-400 animate-pulse"
                    : status === "processing"
                      ? "bg-purple-400 animate-pulse"
                      : "bg-emerald-400"
              }`}
            />
            <p className="text-sm font-semibold tracking-wide text-white font-mono uppercase">
              {statusLabel}
            </p>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Allow microphone access when prompted. Neural voice synthesis streams
            directly from the pipeline.
          </p>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#081223] border border-cyan-500/20 px-3 py-1 text-[11px] font-mono text-cyan-300">
            <span>MIC STATUS:</span>
            <span className="font-semibold text-white">
              {microphonePermission === "no-device"
                ? "NO DEVICE DETECTED"
                : microphonePermission === "unsupported"
                  ? "UNSUPPORTED BROWSER"
                  : microphonePermission === "denied"
                    ? "PERMISSION DENIED"
                    : microphonePermission === "granted"
                      ? "ONLINE // ACTIVE"
                      : microphonePermission === "prompt"
                        ? "PROMPT REQUIRED"
                        : "CHECKING HARDWARE..."}
            </span>
          </div>

          {voiceError && (
            <div
              className="mx-auto mt-4 max-w-xl rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-left text-xs leading-5 text-rose-300 font-mono"
              role="alert"
            >
              {voiceError}
            </div>
          )}

          {microphonePermission === "no-device" && (
            <div className="mx-auto mt-4 max-w-xl rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-left text-xs leading-5 text-amber-200">
              <p className="font-semibold font-mono text-amber-300">
                To connect an audio input device:
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-300">
                <li>Plug in or enable a microphone and confirm it is unmuted.</li>
                <li>Verify input device in system audio preferences.</li>
                <li>Permit microphone access in browser security controls.</li>
                <li>Reload and press Start Speaking.</li>
              </ol>
            </div>
          )}

          {/* HUD Action Controls */}
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Button
              onClick={toggleListening}
              className={`rounded-xl font-medium tracking-wide shadow-lg transition-all ${
                listening
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]"
                  : "bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold shadow-[0_0_20px_rgba(0,242,254,0.35)]"
              }`}
            >
              {listening ? (
                <>
                  <Square className="mr-2 h-4 w-4 fill-white" />
                  Halt Listening
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Speaking
                </>
              )}
            </Button>
            <Button
              onClick={recordWhisper}
              disabled={transcribe.isPending}
              variant="outline"
              className="rounded-xl border-cyan-500/30 bg-[#081223] text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/40"
            >
              {recording ? (
                <>
                  <Square className="mr-2 h-4 w-4 text-rose-400" />
                  Stop Recording
                </>
              ) : transcribe.isPending ? (
                "Neural Whisper Transcribing…"
              ) : (
                <>
                  <Headphones className="mr-2 h-4 w-4 text-teal-400" />
                  Whisper Neural Capture
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={toggleAudioPause}
              disabled={!answer}
              className="rounded-xl border-slate-800 bg-[#081223] text-slate-300 hover:border-slate-700"
            >
              <Pause className="mr-2 h-4 w-4 text-cyan-400" />
              {audioPaused ? "Resume Audio" : "Pause Audio"}
            </Button>
            <Button
              variant="outline"
              onClick={stopAudio}
              disabled={!speaking && !audioPaused}
              className="rounded-xl border-slate-800 bg-[#081223] text-slate-300 hover:border-slate-700"
            >
              <Square className="mr-2 h-4 w-4 text-slate-400" />
              Mute
            </Button>
            {(status === "processing" || speaking) && (
              <Button
                variant="outline"
                onClick={cancelVoiceRequest}
                className="rounded-xl border-rose-500/30 bg-rose-950/20 text-rose-300 hover:border-rose-500/50"
              >
                Abort Stream
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setView("assistant")}
              className="rounded-xl text-slate-400 hover:text-cyan-300"
            >
              Terminal Mode &rarr;
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Transcription HUD Panel */}
        <div className="hud-panel p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Input Stream // Transcription</p>
            <Badge
              variant="outline"
              className="border-cyan-500/30 bg-cyan-950/40 text-cyan-300 font-mono text-[10px]"
            >
              SPEECH-TO-TEXT
            </Badge>
          </div>
          <div className="mt-4 min-h-20 rounded-xl border border-slate-800/80 bg-[#060c18] p-4 text-sm leading-6 font-mono text-slate-300">
            {transcript || (
              <span className="text-slate-400 italic">
                Awaiting spoken audio input. Speak to observe real-time stream decoding...
              </span>
            )}
          </div>
        </div>

        {/* AI Response HUD Panel */}
        <div className="hud-panel p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Neural Output // Voice Stream</p>
            <Button
              variant="outline"
              size="sm"
              disabled={!answer}
              onClick={() => speak(answer)}
              className="rounded-lg border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:border-cyan-400 text-xs font-mono"
            >
              <Volume2 className="mr-1.5 h-3.5 w-3.5" />
              Replay Audio
            </Button>
          </div>
          <div className="mt-4 rounded-xl border border-slate-800/80 bg-[#060c18] p-5 text-sm leading-6 text-slate-200">
            {answer ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <Streamdown>{answer}</Streamdown>
              </div>
            ) : (
              <p className="text-slate-400 font-mono text-xs">
                Spoken queries will be reasoned through Pathly AI and vocalized back automatically.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function TopicExplainer() {
  const [topic, setTopic] = useState("Explain Java inheritance");
  const [stage, setStage] = useState<
    "idle" | "script" | "scenes" | "visuals" | "narration" | "ready"
  >("idle");
  const [script, setScript] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState("");
  const [videoJobId, setVideoJobId] = useState<number | null>(null);
  const videoStatus = trpc.ai.explainerStatus.useQuery(
    { jobId: videoJobId ?? 0 },
    {
      enabled: videoJobId !== null,
      refetchInterval: query => {
        const status = query.state.data?.status;
        return status === "completed" || status === "failed" || status === "cancelled" ? false : 1500;
      },
    },
  );
  const video = trpc.ai.generateExplainerVideo.useMutation({
    onSuccess: response => {
      setVideoJobId(response.jobId);
      setVideoError("");
      setStage("script");
    },
    onError: error => {
      setVideoError(error.message || "Video generation failed. Please try again.");
      setStage("idle");
    },
  });
  const cancelVideo = trpc.ai.cancelExplainer.useMutation({
    onSuccess: () => setVideoError("Video generation cancelled."),
  });
  useEffect(() => {
    const job = videoStatus.data;
    if (!job) return;
    if (job.status === "completed") {
      setScript(job.script ?? "");
      setVideoUrl(job.finalVideoUrl ?? "");
      setStage("ready");
    } else if (job.status === "failed") {
      setVideoError(job.error ?? "Video generation failed. Please try again.");
      setStage("idle");
    } else if (job.status === "cancelled") {
      setStage("idle");
    } else if (job.stage === "narration" || job.status === "assembling") {
      setStage("narration");
    } else if (job.stage.startsWith("scene")) {
      setStage("visuals");
    } else {
      setStage("script");
    }
  }, [videoStatus.data]);

  const generate = () => {
    const cleanTopic = topic.trim();
    if (!cleanTopic || video.isPending) return;
    setScript("");
    setVideoUrl("");
    setVideoError("");
    setVideoJobId(null);
    setStage("script");
    video.mutate({ topic: cleanTopic });
  };
  const stages = [
    ["script", "Script"],
    ["scenes", "Scenes"],
    ["visuals", "Visual plan"],
    ["narration", "Narration"],
    ["ready", "Ready to record"],
  ] as const;
  const presets = [
    "Explain Java Inheritance & Polymorphism",
    "Quantum Superposition & Wavefunction",
    "Neural Network Backpropagation & Gradient Descent",
    "CRISPR-Cas9 Precision Gene Editing",
  ];

  const job = videoStatus.data;
  const isGenerating = video.isPending || (job?.status !== undefined && ["queued", "generating", "assembling"].includes(job.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-mono text-[10px] tracking-wider uppercase">
              <Video size={12} className="mr-1.5 text-emerald-400" /> Runway Gen-4.5 Pipeline
            </Badge>
            <span className="text-xs font-mono text-slate-400">// CINEMATIC LESSON COMPOSITOR</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-display">
            Video Lab // Topic Explainer
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">
            Pathly writes a scientifically responsible lesson, generates real scene videos and narration on the server, and composites them with ffmpeg into a playable MP4.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <Sparkles size={14} className="text-emerald-400" />
          <span>MULTI-SCENE VIDEO SYNTHESIS</span>
        </div>
      </div>

      {/* Control Console */}
      <HudCard accent="teal" cornerBrackets={true} className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && generate()}
                className="h-12 bg-[#080e1c] border-teal-500/25 text-white placeholder:text-slate-500 rounded-xl font-medium focus:border-teal-400 focus:ring-1 focus:ring-teal-400 pl-4 pr-10 text-sm"
                placeholder="e.g. Explain quantum computing fundamentals"
              />
              <Video size={18} className="absolute right-3.5 top-3.5 text-teal-400/60 pointer-events-none" />
            </div>

            <Button
              onClick={generate}
              disabled={isGenerating || !topic.trim()}
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold tracking-wide shadow-[0_0_20px_rgba(5,213,179,0.3)] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-slate-950" />
                  <span>Synthesizing Video...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-slate-950" />
                  <span>Build Explainer</span>
                </>
              )}
            </Button>

            {videoJobId !== null && isGenerating && (
              <Button
                variant="outline"
                onClick={() => cancelVideo.mutate({ jobId: videoJobId })}
                disabled={cancelVideo.isPending}
                className="h-12 px-4 rounded-xl border-red-500/30 bg-red-950/60 hover:bg-red-900/60 text-red-300 font-mono text-xs"
              >
                {cancelVideo.isPending ? "Cancelling..." : "Cancel Job"}
              </Button>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 flex-wrap">
            <span className="text-[11px] font-mono uppercase text-slate-500">Presets:</span>
            {presets.map(p => (
              <button
                key={p}
                onClick={() => setTopic(p)}
                className="px-2.5 py-1 rounded-lg bg-[#0d1627] hover:bg-teal-950/60 border border-slate-700/60 hover:border-teal-500/30 text-xs text-slate-300 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Progress Stages */}
        <div className="mt-6 grid gap-2 sm:grid-cols-5">
          {stages.map(([id, label], index) => {
            const currentIdx = stages.findIndex(([key]) => key === stage);
            const isCompleted = currentIdx > index;
            const isCurrent = currentIdx === index && isGenerating;
            return (
              <div
                key={id}
                className={`rounded-xl p-3 text-center border transition-all ${
                  isCurrent
                    ? "bg-teal-950/60 border-teal-400 text-teal-300 shadow-[0_0_15px_rgba(5,213,179,0.2)] animate-pulse"
                    : isCompleted || (stage === "ready" && index === 4)
                      ? "bg-[#0a1a24] border-emerald-500/40 text-emerald-300"
                      : "bg-[#080d18] border-slate-800 text-slate-500"
                }`}
              >
                <span className="block font-mono text-[10px] uppercase tracking-wider mb-0.5">
                  0{index + 1} // STAGE
                </span>
                <span className="text-xs font-semibold">{label}</span>
              </div>
            );
          })}
        </div>
      </HudCard>

      {/* Error Alert */}
      {videoError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/50 p-4 text-xs font-mono text-red-300 leading-relaxed" role="alert">
          <span className="font-bold text-red-200">PIPELINE ERROR: </span>
          {videoError}
        </div>
      )}

      {/* Active Generation Telemetry Card */}
      {isGenerating && (
        <HudCard accent="teal" className="p-8 text-center border-teal-500/30">
          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-teal-950/60 border border-teal-500/40 grid place-items-center text-teal-300 mb-4 animate-spin">
              <RefreshCw size={22} />
            </div>
            <h4 className="text-base font-bold text-white font-display">
              Synthesizing Multi-Scene Media
            </h4>
            <p className="mt-2 text-xs font-mono text-slate-400 leading-relaxed">
              Generating lesson storyboard, requesting Runway text-to-video scenes, synthesizing ElevenLabs narration, and compositing with ffmpeg...
            </p>
            <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full mt-5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 animate-pulse w-2/3"></div>
            </div>
          </div>
        </HudCard>
      )}

      {/* Output Results */}
      {script ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          {/* Script & Video Player */}
          <HudCard accent="cyan" cornerBrackets={true} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="eyebrow">Generated Script &amp; Lesson</span>
                <h3 className="text-lg font-bold text-white font-display mt-0.5">
                  {job?.title || topic}
                </h3>
              </div>
              <Badge className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs">
                VIDEO READY
              </Badge>
            </div>

            {/* Video Player Box */}
            {videoUrl && (
              <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-500/40 bg-[#050b14] shadow-[0_0_30px_rgba(52,211,153,0.15)]">
                <video
                  className="aspect-video w-full bg-black"
                  controls
                  preload="metadata"
                  src={videoUrl}
                  aria-label={`Educational video about ${topic}`}
                />
                <div className="p-3 bg-[#08101e] border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Check size={13} /> Composite MP4 Stream
                  </span>
                  <a
                    href={videoUrl}
                    download="pathly-explainer.mp4"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Download size={13} /> Download MP4
                  </a>
                </div>
              </div>
            )}

            {/* Script Text */}
            <div className="prose prose-invert prose-sm max-w-none text-slate-200 bg-[#070d18] border border-slate-800/80 rounded-xl p-5">
              <Streamdown>{script}</Streamdown>
            </div>

            {/* Narration Preview if available */}
            {job?.narration && (
              <div className="mt-4 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200">
                <span className="font-mono font-bold uppercase tracking-wider text-purple-400 block mb-1">
                  Narration Audio Script:
                </span>
                {job.narration}
              </div>
            )}
          </HudCard>

          {/* Scene Storyboard & Production Notes */}
          <div className="space-y-5">
            {/* Storyboard Scenes if available */}
            {job?.scenes && job.scenes.length > 0 && (
              <HudCard accent="teal" eyebrow="Storyboard Scenes" className="p-5">
                <div className="space-y-3">
                  {job.scenes.map((scene, sIdx) => (
                    <div
                      key={scene.id || sIdx}
                      className="p-3.5 rounded-xl bg-[#070e1a] border border-slate-800 hover:border-teal-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                          Scene {sIdx + 1}: {scene.title}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                          {scene.duration}s · {scene.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 italic mb-2">
                        &ldquo;{scene.narration}&rdquo;
                      </p>
                      <p className="text-[11px] font-mono text-teal-300/80 bg-teal-950/30 p-2 rounded-lg border border-teal-500/20">
                        Prompt: {scene.visualPrompt}
                      </p>
                    </div>
                  ))}
                </div>
              </HudCard>
            )}

            {/* Production Quality Guidelines */}
            <HudCard accent="purple" eyebrow="Production Guidelines" className="p-5">
              <h4 className="text-base font-bold text-white font-display mb-3">
                Lesson Synthesis Standards
              </h4>
              <div className="space-y-2.5">
                {[
                  "Each scene delivers exactly one focused visual principle.",
                  "Audio pacing calibrated at comfortable listening rates.",
                  "Scientific terminology validated against authoritative catalogs.",
                  "MP4 output composited server-side and stored in durable cloud storage.",
                ].map(item => (
                  <div
                    key={item}
                    className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-300"
                  >
                    <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => {
                  setStage("idle");
                  setScript("");
                  setVideoUrl("");
                  setVideoError("");
                  setVideoJobId(null);
                }}
                variant="outline"
                className="mt-5 w-full rounded-xl border-cyan-500/30 bg-[#091122] text-cyan-300 hover:bg-cyan-950/60 text-xs"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Synthesize Another Explainer
              </Button>
            </HudCard>
          </div>
        </div>
      ) : (
        <HudCard accent="teal" className="p-10 text-center border-dashed border-teal-500/20">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-teal-950/50 border border-teal-500/30 text-teal-400 shadow-[0_0_20px_rgba(5,213,179,0.2)] mb-4">
            <Video size={28} />
          </div>
          <h3 className="text-xl font-bold text-white font-display">
            A Cinematic Lesson Starts With an Inquiry
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-6 text-slate-400">
            Submit a science concept, engineering principle, or algorithm above to generate an explainer video lesson with multi-scene storyboard.
          </p>
        </div>
      )}
    </div>
  );
}

function FileAnalyzer({
  kind,
  isAuthenticated,
}: {
  kind: "document" | "resume";
  isAuthenticated: boolean;
}) {
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("");
  const [mode, setMode] = useState("detailed");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);

  const analysis = trpc.ai.analyze.useMutation({
    onSuccess: response => {
      setResult(response.content);
      setStatus(
        response.source === "ai" ? "Neural analysis complete" : "Guided review ready"
      );
      toast.success(kind === "resume" ? "Resume ATS audit complete!" : "Document analysis synthesized!");
    },
    onError: error => {
      setStatus("Analysis could not be completed. Please retry.");
      toast.error(error.message || "Analysis failed.");
    },
  });

  const isResume = kind === "resume";
  const title = isResume ? "Resume Lab // ATS Diagnostic" : "PDF Lab // Document Intelligence";

  async function readFile(file: File) {
    setStatus("Extracting buffer...");
    setFileName(file.name);
    if (file.size > 8 * 1024 * 1024) {
      setStatus("File is larger than 8 MB. Please choose a smaller document.");
      toast.error("File exceeds 8 MB limit.");
      return;
    }
    if (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      try {
        const buffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: buffer }).promise;
        let extracted = `PDF: ${file.name} (${pdf.numPages} pages)\n\n`;
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          extracted += `\n--- Page ${pageNumber} ---\n${content.items.map((item: any) => ("str" in item ? item.str : "")).join(" ")}`;
        }
        setText(extracted.slice(0, 24000));
        setStatus(
          `Extracted text from ${pdf.numPages} page${pdf.numPages === 1 ? "" : "s"}.`
        );
        toast.success(`PDF parsed successfully (${pdf.numPages} pages).`);
      } catch {
        setStatus(
          "This PDF could not be read in the browser. Paste its text below to continue."
        );
        toast.error("Failed to parse PDF binary. Please paste text directly.");
      }
    } else {
      const allowed = ["text/plain", "text/markdown", "application/json"];
      if (
        !allowed.includes(file.type) &&
        !file.name.match(/\.(txt|md|json)$/i)
      ) {
        setStatus(
          "Choose a PDF, TXT, Markdown, or JSON file, or paste the text below."
        );
        return;
      }
      setText((await file.text()).slice(0, 24000));
      setStatus("Document text loaded into buffer.");
      toast.success("Text file loaded.");
    }
  }

  function analyze() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (text.trim().length < 40) {
      setStatus("Add at least 40 characters of document text.");
      toast.error("Please add at least 40 characters.");
      return;
    }
    analysis.mutate({
      kind,
      title: fileName || title,
      text,
      mode: mode as any,
    });
  }

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Analysis copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className={
                isResume
                  ? "bg-amber-950/60 border-amber-500/40 text-amber-300 font-mono text-[10px] tracking-wider uppercase"
                  : "bg-blue-950/60 border-blue-500/40 text-blue-300 font-mono text-[10px] tracking-wider uppercase"
              }
            >
              {isResume ? <FileCheck2 size={12} className="mr-1.5 text-amber-400" /> : <FileText size={12} className="mr-1.5 text-blue-400" />}
              {isResume ? "ATS Career Engine" : "PDF Intelligence Engine"}
            </Badge>
            <span className="text-xs font-mono text-slate-400">
              {isResume ? "// RESUME READINESS AUDIT" : "// LOCAL CLIENT PARSER"}
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-display">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">
            {isResume
              ? "Comprehensive AI audit of formatting, measurable achievements, keyword resonance, and role alignment without leaking credentials."
              : "Locally extract text from PDFs or markdown documents, then query server-side AI for structured summaries, key claims, and study cards."}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1.5 rounded-xl">
          <ShieldCheck size={14} className="text-cyan-400" />
          <span>ZERO-RETENTION PARSER</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
        {/* Upload & Controls */}
        <div className="space-y-4">
          <label className="block cursor-pointer rounded-2xl border border-dashed border-cyan-500/30 bg-[#070e1c]/80 p-6 text-center hover:border-cyan-400 hover:bg-[#0a1428] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <input
              className="sr-only"
              type="file"
              accept=".pdf,.txt,.md,.json,application/pdf,text/plain,text/markdown,application/json"
              onChange={e => e.target.files?.[0] && readFile(e.target.files[0])}
            />
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.2)]">
              <Upload size={24} />
            </div>
            <p className="mt-4 text-sm font-bold text-white font-display">
              Drop file or browse disk
            </p>
            <p className="mt-1 text-xs font-mono text-slate-400">
              PDF, TXT, Markdown, or JSON · max 8 MB
            </p>
            {fileName && (
              <Badge
                variant="outline"
                className="mt-4 bg-cyan-950/80 border-cyan-500/40 text-cyan-300 font-mono text-xs"
              >
                {fileName}
              </Badge>
            )}
          </label>

          <HudCard accent={isResume ? "amber" : "cyan"} className="p-5">
            <Label className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Analysis Mode
            </Label>
            <select
              value={mode}
              onChange={e => setMode(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-[#08101e] px-3.5 text-sm text-white font-medium focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            >
              <option value="detailed">Detailed review &amp; analysis</option>
              <option value="short">Short executive brief</option>
              <option value="key-points">Key bullet takeaways</option>
              <option value="study-notes">Study flashcards &amp; notes</option>
              <option value="simple">Simple language explanation</option>
            </select>

            <Button
              onClick={analyze}
              disabled={analysis.isPending || !text.trim()}
              className={`mt-5 w-full h-11 rounded-xl font-bold text-slate-950 tracking-wide shadow-[0_0_20px_rgba(0,242,254,0.25)] transition-all flex items-center justify-center gap-2 ${
                isResume
                  ? "bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300"
                  : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400"
              }`}
            >
              {analysis.isPending ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-slate-950" />
                  <span>Synthesizing Analysis...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-slate-950" />
                  <span>{isResume ? "Run ATS Diagnostic" : "Synthesize Analysis"}</span>
                </>
              )}
            </Button>

            <p className="mt-3.5 text-[11px] font-mono leading-relaxed text-slate-400">
              Files are parsed locally in browser memory. Only sanitized text is transmitted to the AI enclave.
            </p>
          </HudCard>
        </div>

        {/* Text Input & Results */}
        <div className="space-y-4">
          <HudCard accent={isResume ? "amber" : "cyan"} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow">{status || "Document Buffer"}</span>
              {text && (
                <span className="font-mono text-xs text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-500/20">
                  {text.length.toLocaleString()} characters
                </span>
              )}
            </div>

            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={
                isResume
                  ? "Upload a resume PDF or paste markdown / plain text here..."
                  : "Upload a document PDF or paste source text here..."
              }
              className="min-h-[200px] max-h-[320px] resize-y bg-[#060b14] border-cyan-500/20 text-white placeholder:text-slate-500 rounded-xl focus:border-cyan-400 text-xs font-mono leading-relaxed"
            />

            {/* Analysis Result Display */}
            {result && (
              <div className="mt-6 pt-6 border-t border-cyan-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="eyebrow">Diagnostic Report</span>
                    {analysis.data?.score !== null && analysis.data?.score !== undefined && (
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                        ATS SCORE: {analysis.data.score}/100
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyResult}
                    className="h-8 px-3 rounded-lg border-cyan-500/30 bg-[#0a1426] text-cyan-300 hover:bg-cyan-950 text-xs gap-1.5"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? "Copied" : "Copy Report"}</span>
                  </Button>
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-slate-200 bg-[#070d18] border border-slate-800 rounded-xl p-5 shadow-inner">
                  <Streamdown>{result}</Streamdown>
                </div>
              </div>
            )}
          </HudCard>
        </div>
      </div>
    </div>
  );
}

function DomainsView({
  selectedCareer,
  setSelectedCareer,
}: {
  selectedCareer: CareerPath;
  setSelectedCareer: (career: CareerPath) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Engineering domain explorer"
        title="Compare the worlds you could build in."
        detail="Explore what professionals do, the skills and tools they use, portfolio proof to create, and where each path can lead."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {CAREER_PATHS.map(career => (
          <CareerCard
            key={career.slug}
            career={career}
            selected={selectedCareer.slug === career.slug}
            onSelect={() => setSelectedCareer(career)}
          />
        ))}
      </div>
      <div className="paper rounded-[1.35rem] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Selected domain</p>
            <h3 className="serif mt-2 text-3xl text-[#1d3d2e]">
              {selectedCareer.title}
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#697c71]">
              {selectedCareer.description}
            </p>
          </div>
          <Badge className="w-fit bg-[#dff0e6] text-[#2f7654]">
            {selectedCareer.category}
          </Badge>
        </div>
        <div className="mt-7 grid gap-6 md:grid-cols-3">
          <div>
            <p className="eyebrow">Roles</p>
            <div className="mt-3 space-y-2 text-sm text-[#456453]">
              {selectedCareer.roles.map(item => (
                <p key={item}>↳ {item}</p>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow">Tools & tech</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCareer.tools.map(item => (
                <span
                  key={item}
                  className="rounded-full bg-[#f1f4ef] px-3 py-1.5 text-xs font-medium text-[#567064]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow">Projects & applications</p>
            <div className="mt-3 space-y-2 text-sm text-[#456453]">
              <p>↳ Build a small {selectedCareer.title} case study.</p>
              <p>
                ↳ Recreate one workflow using{" "}
                {selectedCareer.tools.slice(0, 2).join(" and ")}.
              </p>
              <p>↳ Publish an evidence-backed portfolio note.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillsView({
  selectedCareer,
  profile,
}: {
  selectedCareer: CareerPath;
  profile?: any;
}) {
  const skills = parseJsonList(profile?.skills, defaultSkills);
  const gap = calculateSkillGap(skills, selectedCareer.slug);
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Skill gap analysis"
        title="Know what to practice next."
        detail={`A transparent comparison between your current toolkit and the core skills for ${selectedCareer.title}.`}
      />
      <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
        <div className="rounded-[1.35rem] bg-[#1e4e3a] p-7 text-white">
          <p className="eyebrow !text-[#b7d3c1]">Readiness signal</p>
          <p className="mt-4 text-6xl font-semibold tracking-[-.08em]">
            {gap.readiness}
            <span className="text-2xl text-[#b7d3c1]">%</span>
          </p>
          <p className="mt-3 text-sm leading-6 text-[#c1d6c8]">
            Use this as a starting point for a learning conversation, not a
            prediction of hiring outcomes.
          </p>
          <div className="mt-7 space-y-3">
            {gap.career.requiredSkills.map(skill => (
              <div
                key={skill}
                className="flex items-center justify-between text-sm"
              >
                <span>{skill}</span>
                <span
                  className={`h-2 w-2 rounded-full ${gap.strengths.includes(skill) ? "bg-[#f4d8a5]" : "bg-[#789f87]"}`}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="paper rounded-[1.35rem] p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="eyebrow">Strengths to compound</p>
              <div className="mt-4 space-y-2">
                {gap.strengths.map(skill => (
                  <div
                    key={skill}
                    className="flex items-center gap-2 rounded-xl bg-[#edf5ec] px-3 py-2.5 text-sm font-medium text-[#38694f]"
                  >
                    <Check size={15} />
                    {skill}
                  </div>
                ))}
              </div>
              {gap.strengths.length === 0 && (
                <p className="mt-4 text-sm text-[#718278]">
                  Add skills in your profile to see your strengths here.
                </p>
              )}
            </div>
            <div>
              <p className="eyebrow">Priority gaps</p>
              <div className="mt-4 space-y-2">
                {gap.gaps.map((skill, index) => (
                  <div
                    key={skill}
                    className="rounded-xl bg-[#faf0e8] px-3 py-2.5 text-sm font-medium text-[#875e46]"
                  >
                    <div className="flex items-center justify-between">
                      <span>{skill}</span>
                      <span className="font-mono text-[10px]">
                        {index === 0 ? "NOW" : "NEXT"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-normal text-[#9b745c]">
                      Pair one lesson with a small artifact.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoadmapView({
  selectedCareer,
  isAuthenticated,
}: {
  selectedCareer: CareerPath;
  isAuthenticated: boolean;
}) {
  const [roadmap, setRoadmap] = useState("");
  const [progress, setProgress] = useState(0);
  const generate = trpc.advisor.generatePathway.useMutation({
    onSuccess: response => {
      setRoadmap(response.content);
      setProgress(0);
    },
  });
  const save = trpc.advisor.savePlan.useMutation();
  function create() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    generate.mutate({
      careerSlug: selectedCareer.slug,
      careerTitle: selectedCareer.title,
      requiredSkills: selectedCareer.requiredSkills,
    });
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Personalized learning roadmap"
          title={`Your ${selectedCareer.title} path.`}
          detail="Build in phases, create proof, and revisit the plan when your direction changes."
        />
        <Button
          onClick={create}
          disabled={generate.isPending}
          className="rounded-xl bg-[#1f503b]"
        >
          {generate.isPending ? (
            "Generating…"
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate with AI
            </>
          )}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {selectedCareer.milestones.map((milestone, index) => (
          <article
            key={milestone.title}
            className={`paper rounded-[1.25rem] p-5 ${index === 0 ? "border-[#76a886]" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#dff0e6] text-sm font-bold text-[#2f7654]">
                0{index + 1}
              </span>
              <span className="font-mono text-[10px] uppercase text-[#7b9082]">
                {milestone.duration}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-[#274b3a]">
              {milestone.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6a7c72]">
              {milestone.detail}
            </p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.25rem] bg-[#edf5ec] p-5">
          <p className="eyebrow !text-[#5b8069]">Project proof</p>
          <h3 className="mt-2 font-semibold text-[#315844]">
            Build one small {selectedCareer.title} artifact.
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#5f7a6a]">
            Choose a real constraint, document your decisions, and publish a
            short readme with evidence.
          </p>
        </article>
        <article className="rounded-[1.25rem] bg-[#f7f1e8] p-5">
          <p className="eyebrow !text-[#9b745c]">Interview practice</p>
          <h3 className="mt-2 font-semibold text-[#6e513e]">
            Explain the trade-offs.
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#80634f]">
            Prepare one story about debugging, collaboration, and a technical
            decision you changed after feedback.
          </p>
        </article>
        <article className="rounded-[1.25rem] bg-[#eee9f5] p-5">
          <p className="eyebrow !text-[#8067a0]">Portfolio guidance</p>
          <h3 className="mt-2 font-semibold text-[#624b7c]">
            Show the learning loop.
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#75618a]">
            Include the problem, your approach, a visible result, and what you
            would improve next.
          </p>
        </article>
      </div>
      <div className="paper rounded-[1.35rem] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Progress tracker</p>
            <p className="mt-2 text-sm text-[#516c5c]">
              Move this as you complete evidence, not just lessons.
            </p>
          </div>
          <span className="font-mono text-sm text-[#356d54]">{progress}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={e => setProgress(Number(e.target.value))}
          className="mt-5 w-full accent-[#39775a]"
        />
        <Button
          onClick={() =>
            isAuthenticated
              ? save.mutate({
                  careerSlug: selectedCareer.slug,
                  roadmap:
                    roadmap ||
                    selectedCareer.milestones
                      .map(item => item.title)
                      .join("\n"),
                  progress,
                })
              : startLogin()
          }
          variant="outline"
          className="mt-5 rounded-xl border-[#d8e2d8] text-[#356d54]"
        >
          Save progress
        </Button>
      </div>
      {roadmap && (
        <article className="paper rounded-[1.35rem] p-6">
          <p className="eyebrow">AI-generated pathway</p>
          <div className="prose prose-sm mt-4 max-w-none text-[#415e4e]">
            <Streamdown>{roadmap}</Streamdown>
          </div>
        </article>
      )}
    </div>
  );
}

function QuizView({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [topic, setTopic] = useState("JavaScript & TypeScript Engineering");
  const [difficulty, setDifficulty] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const generate = trpc.quiz.generate.useMutation({
    onSuccess: response => {
      setQuestions(response.questions as QuizQuestion[]);
      setAnswers({});
      setSubmitted(false);
    },
  });

  const score = submitted
    ? questions.reduce(
        (total, question) =>
          total + (answers[question.id] === question.answer ? 1 : 0),
        0
      )
    : 0;

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const presets = [
    "Fullstack React & Next.js",
    "Distributed System Design",
    "Neural Networks & LLMs",
    "Cloud Architecture & K8s",
    "Clean Code & Architecture",
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Adaptive Retrieval Engine"
        title="Practice & Quiz Studio."
        detail="Active retrieval practice powered by neural generation. Generate focused scenario-based assessments, test your mental models, and review deep architectural explanations."
      />

      {/* Control Console */}
      <div className="hud-panel p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Quick Presets */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            RAPID TARGETS:
          </span>
          {presets.map(preset => (
            <button
              key={preset}
              onClick={() => setTopic(preset)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-mono transition-all ${
                topic === preset
                  ? "border-cyan-400/60 bg-cyan-950/60 text-cyan-200 shadow-[0_0_10px_rgba(0,242,254,0.25)]"
                  : "border-slate-800 bg-[#091120] text-slate-400 hover:border-cyan-500/30 hover:text-cyan-300"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_170px_130px_auto]">
          <div className="relative">
            <Input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="rounded-xl border-slate-800 bg-[#060c18] text-white placeholder:text-slate-400 focus:border-cyan-400 font-mono text-sm h-11"
              placeholder="Specify domain, framework, or concept..."
            />
          </div>

          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value as typeof difficulty)}
            className="h-11 rounded-xl border border-slate-800 bg-[#060c18] px-3 text-xs font-mono uppercase text-cyan-300 focus:border-cyan-400 focus:outline-none"
          >
            <option value="beginner">Level // Beginner</option>
            <option value="intermediate">Level // Intermediate</option>
            <option value="advanced">Level // Advanced</option>
          </select>

          <div className="flex h-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-950/30 px-3 text-xs font-mono text-cyan-300">
            5 MODULES
          </div>

          <Button
            onClick={() =>
              isAuthenticated
                ? generate.mutate({ topic, difficulty, questionCount: 5 })
                : startLogin()
            }
            disabled={generate.isPending}
            className="h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold px-6 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all"
          >
            {generate.isPending ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Synthesizing…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Quiz
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Generated Questions Stream */}
      {questions.length > 0 && (
        <div className="space-y-4">
          {/* Telemetry bar during quiz */}
          <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-[#07101f] px-5 py-3 font-mono text-xs">
            <div className="flex items-center gap-3 text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>TOPIC: <b className="text-white font-sans">{topic}</b></span>
              <span className="text-slate-400">|</span>
              <span>DIFFICULTY: <b className="text-cyan-300 uppercase">{difficulty}</b></span>
            </div>
            <div className="text-slate-400">
              PROGRESS: <b className="text-cyan-300">{Object.keys(answers).length}/{questions.length} Answered</b>
            </div>
          </div>

          {questions.map((question, index) => (
            <article key={question.id} className="hud-panel p-6 relative overflow-hidden">
              <div className="flex items-start gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/60 font-mono text-xs font-bold text-cyan-300 shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-base text-white leading-relaxed font-display">
                    {question.question}
                  </p>

                  {/* Options List */}
                  <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = answers[question.id] === optionIndex;
                      const isCorrect = submitted && question.answer === optionIndex;
                      const isWrong = submitted && isSelected && !isCorrect;

                      return (
                        <button
                          key={option}
                          onClick={() =>
                            !submitted &&
                            setAnswers({ ...answers, [question.id]: optionIndex })
                          }
                          className={`group flex items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-all duration-200 ${
                            isCorrect
                              ? "border-emerald-400 bg-emerald-950/50 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                              : isWrong
                                ? "border-rose-500 bg-rose-950/50 text-rose-200 shadow-[0_0_16px_rgba(244,63,94,0.3)]"
                                : isSelected
                                  ? "border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-[0_0_15px_rgba(0,242,254,0.25)]"
                                  : "border-slate-800 bg-[#060c18] text-slate-300 hover:border-cyan-500/40 hover:bg-[#081224]"
                          }`}
                        >
                          <span
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-md font-mono text-[10px] font-bold ${
                              isSelected
                                ? "bg-cyan-400 text-slate-950"
                                : "bg-slate-800 text-slate-400 group-hover:text-white"
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span className="flex-1 leading-snug">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Post-submission Review Explanations */}
                  {submitted && (
                    <div
                      className={`mt-4 rounded-xl border p-4 text-xs font-mono leading-relaxed ${
                        answers[question.id] === question.answer
                          ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-200"
                          : "border-amber-500/30 bg-amber-950/30 text-amber-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            answers[question.id] === question.answer
                              ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                              : "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                          }`}
                        />
                        <b className="uppercase tracking-wider">
                          {answers[question.id] === question.answer
                            ? "CORRECT SPECIFICATION"
                            : "CONCEPT DISCREPANCY DETECTED"}
                        </b>
                      </div>
                      <p className="text-slate-300 font-sans text-sm">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}

          {/* Action & Score Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#09152b] to-[#070e1d] p-5 shadow-[0_0_25px_rgba(0,242,254,0.12)]">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setSubmitted(true)}
                disabled={submitted || Object.keys(answers).length === 0}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold px-6 shadow-[0_0_15px_rgba(0,242,254,0.3)]"
              >
                Evaluate Answers ({Object.keys(answers).length}/{questions.length})
              </Button>

              {submitted && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setAnswers({});
                  }}
                  className="rounded-xl border-slate-800 bg-[#060c18] text-slate-300 hover:text-white"
                >
                  <RotateCcw className="mr-2 h-4 w-4 text-cyan-400" />
                  Retry Practice
                </Button>
              )}
            </div>

            {submitted && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    RETRIEVAL ACCURACY
                  </p>
                  <p className="text-2xl font-bold font-display text-white">
                    {percentage}%{" "}
                    <span className="text-xs font-mono text-cyan-300 font-normal">
                      ({score}/{questions.length} verified)
                    </span>
                  </p>
                </div>
                <div
                  className={`grid h-12 w-12 place-items-center rounded-xl font-mono text-sm font-bold shadow-lg ${
                    percentage >= 80
                      ? "border border-emerald-500/50 bg-emerald-950/60 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                      : percentage >= 50
                        ? "border border-cyan-500/50 bg-cyan-950/60 text-cyan-300 shadow-[0_0_20px_rgba(0,242,254,0.3)]"
                        : "border border-rose-500/50 bg-rose-950/60 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                  }`}
                >
                  {percentage >= 80 ? "S" : percentage >= 60 ? "A" : "B"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ResourcesView({ selectedCareer }: { selectedCareer: CareerPath }) {
  const resources = getResourcesForCareer(selectedCareer.slug);
  const items = resources.length ? resources : LEARNING_RESOURCES.slice(0, 8);
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("pathly-saved-resources") || "[]");
    } catch {
      return [];
    }
  });
  const [progress, setProgress] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("pathly-resource-progress") || "{}"
      );
    } catch {
      return {};
    }
  });
  useEffect(() => {
    localStorage.setItem("pathly-saved-resources", JSON.stringify(saved));
  }, [saved]);
  useEffect(() => {
    localStorage.setItem("pathly-resource-progress", JSON.stringify(progress));
  }, [progress]);
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Curated learning library"
        title="Materials with a reason to exist."
        detail="Use official docs, structured courses, and project prompts as ingredients in your roadmap. Save a resource and move its progress as you work."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map(resource => {
          const isSaved = saved.includes(resource.title);
          const value = progress[resource.title] || 0;
          return (
            <article
              key={resource.title}
              className="paper rounded-[1.25rem] p-5 transition-transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge
                    variant="outline"
                    className="border-[#d8e2d8] text-[#567064]"
                  >
                    {resource.type}
                  </Badge>
                  <h3 className="mt-3 text-lg font-semibold text-[#274b3a]">
                    {resource.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#6a7c72]">
                    {resource.summary}
                  </p>
                </div>
                <button
                  aria-label={isSaved ? "Unsave resource" : "Save resource"}
                  onClick={() =>
                    setSaved(current =>
                      isSaved
                        ? current.filter(item => item !== resource.title)
                        : [...current, resource.title]
                    )
                  }
                  className={`rounded-full p-2 ${isSaved ? "bg-[#dff0e6] text-[#2f7654]" : "bg-[#f1f4ef] text-[#789083]"}`}
                >
                  <BookOpen size={16} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-[#7b9082]">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#356d54] hover:underline"
                >
                  Open at {resource.provider}{" "}
                  <ArrowRight className="ml-1 inline h-3 w-3" />
                </a>
                <span>{resource.level}</span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[.12em] text-[#789083]">
                  <span>Progress</span>
                  <span>{value}%</span>
                </div>
                <input
                  aria-label={`Progress for ${resource.title}`}
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={e =>
                    setProgress(current => ({
                      ...current,
                      [resource.title]: Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full accent-[#39775a]"
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ProfileView({
  profile,
  isAuthenticated,
}: {
  profile?: any;
  isAuthenticated: boolean;
}) {
  const [form, setForm] = useState({
    careerGoal: profile?.careerGoal || "AI Engineer",
    education: profile?.education || "Undergraduate learner",
    interests: parseJsonList(profile?.interests, [
      "building useful tools",
      "mathematics",
      "design",
    ]),
    skills: parseJsonList(profile?.skills, defaultSkills),
    learningPace: profile?.learningPace || "Steady",
  });
  const save = trpc.advisor.saveProfile.useMutation();
  const [saved, setSaved] = useState(false);
  const set = (key: string, value: string | string[]) =>
    setForm(current => ({ ...current, [key]: value }));
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Personalization"
        title="Make the guidance yours."
        detail="Your profile shapes recommendations, skill-gap comparisons, and roadmap prompts. Keep it honest and update it as you learn."
      />
      {!isAuthenticated && <SignInCard />}
      <div className="paper rounded-[1.35rem] p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label>Career direction</Label>
            <Input
              className="mt-2 rounded-xl"
              value={form.careerGoal}
              onChange={e => set("careerGoal", e.target.value)}
            />
          </div>
          <div>
            <Label>Education</Label>
            <Input
              className="mt-2 rounded-xl"
              value={form.education}
              onChange={e => set("education", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Interests</Label>
            <Input
              className="mt-2 rounded-xl"
              value={form.interests.join(", ")}
              onChange={e =>
                set(
                  "interests",
                  e.target.value
                    .split(",")
                    .map(item => item.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
          <div className="md:col-span-2">
            <Label>Current skills</Label>
            <Textarea
              className="mt-2 rounded-xl"
              value={form.skills.join(", ")}
              onChange={e =>
                set(
                  "skills",
                  e.target.value
                    .split(",")
                    .map(item => item.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
          <div>
            <Label>Learning pace</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Steady", "Accelerated", "Flexible"].map(pace => (
                <button
                  key={pace}
                  onClick={() => set("learningPace", pace)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${form.learningPace === pace ? "bg-[#dcefe2] text-[#225940]" : "bg-[#f1f2ee] text-[#7a887f]"}`}
                >
                  {pace}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button
            disabled={!isAuthenticated || save.isPending}
            onClick={() => {
              save.mutate(
                {
                  careerGoal: form.careerGoal,
                  education: form.education,
                  interests: form.interests,
                  skills: form.skills,
                  learningPace: form.learningPace as
                    | "Steady"
                    | "Accelerated"
                    | "Flexible",
                },
                { onSuccess: () => setSaved(true) }
              );
            }}
            className="rounded-xl bg-[#1f503b]"
          >
            Save profile
          </Button>
          {saved && (
            <span className="text-sm text-[#356d54]">
              Saved to your workspace.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryView({ isAuthenticated }: { isAuthenticated: boolean }) {
  const history = trpc.advisor.history.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const artifacts = trpc.artifacts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const plans = trpc.advisor.plans.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  if (!isAuthenticated)
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Your library"
          title="Saved work, in one place."
          detail="Sign in to keep your conversations, analyses, quizzes, and roadmap snapshots available across sessions."
        />
        <SignInCard />
      </div>
    );
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Your library"
        title="Saved work, in one place."
        detail="Your latest advisor conversations and persisted learning artifacts appear here."
      />
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="paper rounded-[1.35rem] p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Conversations</p>
            <MessageCircle size={17} className="text-[#58816a]" />
          </div>
          <div className="mt-4 space-y-3">
            {(history.data || []).slice(0, 6).map(item => (
              <div
                key={item.id}
                className="border-b border-[#edf1eb] pb-3 last:border-0"
              >
                <p className="text-xs font-semibold uppercase text-[#7b9082]">
                  {item.role}
                </p>
                <p className="mt-1 line-clamp-3 text-sm leading-5 text-[#587061]">
                  {item.content}
                </p>
              </div>
            ))}
            {!history.data?.length && (
              <p className="text-sm text-[#718278]">No conversations yet.</p>
            )}
          </div>
        </div>
        <div className="paper rounded-[1.35rem] p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Analyses & quizzes</p>
            <FileText size={17} className="text-[#936eaa]" />
          </div>
          <div className="mt-4 space-y-3">
            {(artifacts.data || []).slice(0, 6).map(item => (
              <div
                key={item.id}
                className="border-b border-[#edf1eb] pb-3 last:border-0"
              >
                <p className="text-xs font-semibold uppercase text-[#7b9082]">
                  {item.kind} {item.score ? `· ${item.score}/100` : ""}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#456453]">
                  {item.title}
                </p>
              </div>
            ))}
            {!artifacts.data?.length && (
              <p className="text-sm text-[#718278]">
                Your saved analyses will appear here.
              </p>
            )}
          </div>
        </div>
        <div className="paper rounded-[1.35rem] p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Roadmap snapshots</p>
            <GraduationCap size={17} className="text-[#ae5636]" />
          </div>
          <div className="mt-4 space-y-3">
            {(plans.data || []).slice(0, 6).map(item => (
              <div
                key={item.id}
                className="border-b border-[#edf1eb] pb-3 last:border-0"
              >
                <p className="text-sm font-semibold text-[#456453]">
                  {item.careerSlug}
                </p>
                <p className="mt-1 text-xs text-[#7b9082]">
                  {item.progress}% complete
                </p>
              </div>
            ))}
            {!plans.data?.length && (
              <p className="text-sm text-[#718278]">
                Generate a roadmap to create a snapshot.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [view, setView] = useState<View>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState(CAREER_PATHS[0]);
  const profileQuery = trpc.advisor.profile.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const profile = profileQuery.data;
  const active = nav.find(item => item.id === view) || nav[0];
  useEffect(() => {
    setMobileOpen(false);
  }, [view]);
  const content =
    view === "overview" ? (
      <Overview
        selectedCareer={selectedCareer}
        setSelectedCareer={setSelectedCareer}
        profile={profile}
        setView={setView}
        isAuthenticated={isAuthenticated}
      />
    ) : view === "assistant" ? (
      <AssistantView
        selectedCareer={selectedCareer}
        isAuthenticated={isAuthenticated}
      />
    ) : view === "voice" ? (
      <VoiceView setView={setView} isAuthenticated={isAuthenticated} />
    ) : view === "video" ? (
      <TopicExplainer />
    ) : view === "visual" ? (
      <VisualLab isAuthenticated={isAuthenticated} />
    ) : view === "documents" ? (
      <FileAnalyzer kind="document" isAuthenticated={isAuthenticated} />
    ) : view === "resume" ? (
      <FileAnalyzer kind="resume" isAuthenticated={isAuthenticated} />
    ) : view === "domains" ? (
      <DomainsView
        selectedCareer={selectedCareer}
        setSelectedCareer={setSelectedCareer}
      />
    ) : view === "skills" ? (
      <SkillsView selectedCareer={selectedCareer} profile={profile} />
    ) : view === "roadmap" ? (
      <RoadmapView
        selectedCareer={selectedCareer}
        isAuthenticated={isAuthenticated}
      />
    ) : view === "quiz" ? (
      <QuizView isAuthenticated={isAuthenticated} />
    ) : view === "resources" ? (
      <ResourcesView selectedCareer={selectedCareer} />
    ) : view === "profile" ? (
      <ProfileView profile={profile} isAuthenticated={isAuthenticated} />
    ) : (
      <HistoryView isAuthenticated={isAuthenticated} />
    );
  return (
    <div className="pathly-shell">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        {/* Futuristic Cyber Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-cyan-500/20 bg-[#070e1b]/90 px-5 py-6 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-slate-950 font-bold shadow-[0_0_18px_rgba(0,242,254,0.35)]">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white font-display">
                pathly
              </span>
              <span className="ml-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                AI 3.0
              </span>
            </div>
          </div>

          <p className="mt-8 px-2 text-[10px] font-mono uppercase tracking-[.15em] text-slate-400">
            Navigation System
          </p>

          <nav className="mt-3 space-y-1 overflow-y-auto flex-1 pr-1">
            {["Workspace", "Tools", "Career Planning", "Learning"].map(
              group => (
                <div key={group} className="mb-4">
                  <p className="mb-1.5 px-2.5 text-[10px] font-mono uppercase tracking-[.14em] text-slate-400">
                    {group}
                  </p>
                  {nav
                    .filter(item => item.group.toLowerCase() === group.toLowerCase())
                    .map(item => (
                      <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`nav-item ${view === item.id ? "active" : ""}`}
                      >
                        <item.icon size={16} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                </div>
              )
            )}
          </nav>

          {/* Synapse Streak HUD Card */}
          <div className="mt-auto rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-[#091529] to-[#060e1c] p-4 shadow-[0_0_20px_rgba(0,242,254,0.1)]">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold">
              <Award size={16} />
              <span>SYNAPSE STREAK</span>
            </div>
            <p className="mt-2.5 text-3xl font-bold tracking-tight text-white font-display">
              12 <span className="text-sm font-mono text-cyan-300 font-normal">cycles</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Compounding cognitive momentum.
            </p>
          </div>

          {/* User Account / Identity */}
          <button
            onClick={
              isAuthenticated ? () => setView("profile") : () => startLogin()
            }
            className="mt-3 flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-[#081120] p-2.5 text-left hover:border-cyan-500/40 hover:bg-[#0b162c] transition-all"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-xs font-bold text-cyan-300 font-mono">
              {initials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white font-display">
                {isAuthenticated ? user?.name : "Connect Neural ID"}
              </p>
              <p className="truncate text-[11px] font-mono text-slate-400">
                {isAuthenticated ? user?.email : "Sign in to synchronize"}
              </p>
            </div>
          </button>
          {isAuthenticated && (
            <button
              onClick={logout}
              className="mt-1.5 px-2 text-left text-xs font-mono text-slate-400 hover:text-red-400 transition-colors"
            >
              Disconnect session &rarr;
            </button>
          )}
        </aside>

        {/* Main Content Viewport */}
        <main className="min-w-0 flex-1 px-4 pb-14 pt-4 sm:px-7 lg:px-10 lg:pt-6">
          {/* Mobile Top Header */}
          <header className="flex items-center justify-between lg:hidden mb-4 pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500 text-slate-950 font-bold">
                <Sparkles size={16} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-display">
                pathly
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                AI 3.0
              </span>
            </div>
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-500/30 bg-[#091120] text-cyan-300"
            >
              <Menu size={18} />
            </button>
          </header>

          {/* Mobile Drawer */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 bg-[#03060c]/80 backdrop-blur-md lg:hidden">
              <div className="h-full w-[310px] overflow-y-auto bg-[#070e1b] border-r border-cyan-500/30 p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white font-display">pathly</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300">HUD</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <nav className="mt-8 space-y-1">
                  {nav.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`nav-item ${view === item.id ? "active" : ""}`}
                    >
                      <item.icon size={17} />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* HUD Viewport Header Ribbon */}
          <div className="mb-7 mt-2 flex items-center justify-between border-b border-cyan-500/15 pb-4">
            <div>
              <p className="eyebrow">{active.group}</p>
              <p className="mt-0.5 text-lg font-bold text-white font-display flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,242,254,0.8)]"></span>
                {active.label}
              </p>
            </div>
            <div className="hidden items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1 rounded-lg sm:flex">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>ENCLAVE SECURE // AES-256</span>
            </div>
          </div>

          {content}
        </main>
      </div>
    </div>
  );
}
