import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";

export type VisualBlueprint = {
  title: string;
  topic: string;
  style: string;
  overview: string;
  svg: string;
  nodes: Array<{
    id: string;
    label: string;
    category: string;
    description: string;
    status?: "active" | "synced" | "core";
  }>;
  keyTakeaways: string[];
};

export function createFallbackSvg(topic: string, style: string): string {
  const cleanTitle = topic.replace(/[<>&"]/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" width="100%" height="100%" style="background: radial-gradient(circle at 50% 30%, #0d1a2d 0%, #060911 100%); font-family: 'DM Sans', -apple-system, sans-serif;">
  <defs>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#4facfe" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b150e2" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#8a2be2" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#05d5b3" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#00a896" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 242, 254, 0.05)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background Grid & HUD Frame -->
  <rect width="900" height="520" fill="url(#grid)" />
  <rect x="20" y="20" width="860" height="480" rx="14" fill="none" stroke="rgba(0, 242, 254, 0.18)" stroke-dasharray="8 6"/>
  
  <!-- Header Telemetry -->
  <text x="50" y="55" fill="#00f2fe" font-size="12" font-weight="700" letter-spacing="2" font-family="'DM Mono', monospace">PATHLY // NEURAL VISUAL LAB v2.4</text>
  <text x="50" y="85" fill="#ffffff" font-size="22" font-weight="700">${cleanTitle}</text>
  <text x="50" y="106" fill="#8ca0b8" font-size="13">Architectural Blueprint &amp; Concept Flow (${style})</text>
  <circle cx="830" cy="50" r="4" fill="#00f2fe" filter="url(#glow)"/>
  <text x="760" y="54" fill="#00f2fe" font-size="10" font-family="'DM Mono', monospace">LIVE SYNAPSE</text>

  <!-- Interconnecting Circuit Lines -->
  <path d="M 190 260 L 330 260" stroke="rgba(0, 242, 254, 0.6)" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
  <path d="M 470 260 L 610 260" stroke="rgba(5, 213, 179, 0.6)" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
  <path d="M 400 310 L 400 390 L 610 390" stroke="rgba(177, 80, 226, 0.6)" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
  <path d="M 400 210 L 400 160 L 610 160" stroke="rgba(0, 242, 254, 0.6)" stroke-width="2" stroke-dasharray="4 4" fill="none"/>

  <!-- Core Node 1: Input / Origin -->
  <g transform="translate(60, 210)">
    <rect width="130" height="100" rx="12" fill="#0d1829" stroke="#00f2fe" stroke-width="1.5" filter="url(#glow)"/>
    <rect width="130" height="100" rx="12" fill="url(#cyanGrad)"/>
    <text x="15" y="32" fill="#00f2fe" font-size="10" font-weight="bold" font-family="'DM Mono', monospace">01 // INGESTION</text>
    <text x="15" y="58" fill="#ffffff" font-size="14" font-weight="600">Foundation</text>
    <text x="15" y="78" fill="#94a3b8" font-size="11">Core Principles</text>
  </g>

  <!-- Core Node 2: Central Processing -->
  <g transform="translate(330, 210)">
    <rect width="140" height="100" rx="12" fill="#0d1f2d" stroke="#05d5b3" stroke-width="1.8" filter="url(#glow)"/>
    <rect width="140" height="100" rx="12" fill="url(#tealGrad)"/>
    <text x="15" y="32" fill="#05d5b3" font-size="10" font-weight="bold" font-family="'DM Mono', monospace">02 // SYNAPSE</text>
    <text x="15" y="58" fill="#ffffff" font-size="14" font-weight="600">Engine Core</text>
    <text x="15" y="78" fill="#94a3b8" font-size="11">Active Mechanisms</text>
  </g>

  <!-- Core Node 3: Synthesis / Output -->
  <g transform="translate(610, 210)">
    <rect width="150" height="100" rx="12" fill="#1b122c" stroke="#b150e2" stroke-width="1.5" filter="url(#glow)"/>
    <rect width="150" height="100" rx="12" fill="url(#purpleGrad)"/>
    <text x="15" y="32" fill="#b150e2" font-size="10" font-weight="bold" font-family="'DM Mono', monospace">03 // SYNTHESIS</text>
    <text x="15" y="58" fill="#ffffff" font-size="14" font-weight="600">Implementation</text>
    <text x="15" y="78" fill="#94a3b8" font-size="11">Real Outcomes</text>
  </g>

  <!-- Auxiliary Node: Verification / Feedback -->
  <g transform="translate(610, 340)">
    <rect width="150" height="90" rx="10" fill="#0b1726" stroke="rgba(0, 242, 254, 0.4)" stroke-width="1.2"/>
    <text x="15" y="30" fill="#00f2fe" font-size="10" font-family="'DM Mono', monospace">DIAGNOSTIC</text>
    <text x="15" y="54" fill="#ffffff" font-size="13" font-weight="600">Feedback Loop</text>
    <text x="15" y="72" fill="#718096" font-size="10">Validation Metrics</text>
  </g>

  <!-- Auxiliary Node: Extension -->
  <g transform="translate(610, 115)">
    <rect width="150" height="90" rx="10" fill="#0b1726" stroke="rgba(5, 213, 179, 0.4)" stroke-width="1.2"/>
    <text x="15" y="30" fill="#05d5b3" font-size="10" font-family="'DM Mono', monospace">OPTIMIZATION</text>
    <text x="15" y="54" fill="#ffffff" font-size="13" font-weight="600">Next Frontier</text>
    <text x="15" y="72" fill="#718096" font-size="10">System Evolution</text>
  </g>

  <!-- Footer HUD telemetry -->
  <text x="50" y="475" fill="#4a5d73" font-size="10" font-family="'DM Mono', monospace">RENDER ID: 0x9F4 // PROTOCOL: CYBER-HUD // VECTOR QUALITY: HIGH</text>
</svg>`;
}

export function createFallbackBlueprint(topic: string, style: string): VisualBlueprint {
  return {
    title: topic.length > 50 ? topic.slice(0, 50) + "..." : topic,
    topic,
    style,
    overview: `Visual architecture blueprint for ${topic}. Shows ingestion, active synapse mechanisms, output synthesis, and diagnostic validation loops.`,
    svg: createFallbackSvg(topic, style),
    nodes: [
      { id: "node-1", label: "Foundations", category: "Core Principle", description: `Initial primitives and definitions for ${topic}.`, status: "core" },
      { id: "node-2", label: "Synapse Engine", category: "Processing", description: `Internal transformation and algorithmic rules governing ${topic}.`, status: "active" },
      { id: "node-3", label: "Synthesis Output", category: "Production", description: "Validated deliverables, execution flow, or physical manifestation.", status: "synced" },
      { id: "node-4", label: "Feedback Loop", category: "Validation", description: "Verification metrics, error correction, and iterative refinement.", status: "synced" },
    ],
    keyTakeaways: [
      `Decompose ${topic} into sequential stages from fundamental inputs to outputs.`,
      "Trace state changes across the central processing synapse for deep conceptual clarity.",
      "Incorporate diagnostic feedback to ensure resilient and repeatable outcomes.",
    ],
  };
}

export async function generateVisualBlueprint(
  topic: string,
  style: "architecture" | "flowchart" | "concept-map" | "infographic" = "architecture",
  detail?: string
): Promise<VisualBlueprint> {
  const fallback = createFallbackBlueprint(topic, style);
  try {
    const prompt = `You are Pathly's Visual AI Architect. Create a futuristic, high-tech SVG diagram and conceptual breakdown for the topic: "${topic}".
Style requested: ${style}.
Additional context: ${detail || "Standard educational blueprint"}.

Return a JSON object with:
- title: concise title
- overview: 2 sentences explaining the technical concepts
- nodes: array of 4-6 objects with: id, label, category, description, status ("core" | "active" | "synced")
- keyTakeaways: array of 3 actionable insights
- svg: a complete, beautiful standalone SVG string with:
  * viewBox="0 0 900 520"
  * dark cybernetic background (#060913 or radial gradients)
  * futuristic neon glowing paths and node rectangles with rounded corners
  * cyan (#00f2fe), teal (#05d5b3), and purple (#b150e2) accents
  * legible white/light text and telemetry labels
  * clean visual connectors and arrows
  * no unclosed tags or syntax errors`;

    const response = await invokeLLM({
      model: ENV.nvidiaModel,
      messages: [
        {
          role: "system",
          content: "You are an expert technical illustrator and AI visual architect. You produce clean, valid JSON with beautifully styled SVG diagrams.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "visual_blueprint",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              overview: { type: "string" },
              nodes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    label: { type: "string" },
                    category: { type: "string" },
                    description: { type: "string" },
                    status: { type: "string" },
                  },
                  required: ["id", "label", "category", "description", "status"],
                  additionalProperties: false,
                },
              },
              keyTakeaways: {
                type: "array",
                items: { type: "string" },
              },
              svg: { type: "string" },
            },
            required: ["title", "overview", "nodes", "keyTakeaways", "svg"],
            additionalProperties: false,
          },
        },
      },
    });

    const raw = response.choices?.[0]?.message?.content;
    if (typeof raw !== "string" || !raw.trim()) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    if (!parsed.svg || !parsed.svg.includes("<svg") || !Array.isArray(parsed.nodes)) {
      return fallback;
    }

    return {
      title: parsed.title || fallback.title,
      topic,
      style,
      overview: parsed.overview || fallback.overview,
      nodes: parsed.nodes.length ? parsed.nodes : fallback.nodes,
      keyTakeaways: parsed.keyTakeaways?.length ? parsed.keyTakeaways : fallback.keyTakeaways,
      svg: parsed.svg,
    };
  } catch (error) {
    console.warn("[Visual AI] generation fallback triggered:", error instanceof Error ? error.message : error);
    return fallback;
  }
}
