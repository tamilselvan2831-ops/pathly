export type CareerPath = {
  slug: string;
  title: string;
  category: string;
  description: string;
  match: number;
  accent: string;
  requiredSkills: string[];
  milestones: { title: string; detail: string; duration: string }[];
  education: string[];
  roles: string[];
  tools: string[];
  applications: string[];
};

const sharedMilestones = (first: string, second: string, third: string) => [
  { title: "Build foundations", detail: first, duration: "Weeks 1–3" },
  { title: "Practice with a real brief", detail: second, duration: "Weeks 4–7" },
  { title: "Ship proof of work", detail: third, duration: "Weeks 8–10" },
];

export const CAREER_PATHS: CareerPath[] = [
  {
    slug: "product-designer", title: "Product Designer", category: "Design & strategy", description: "Turn human insight into useful, inclusive digital products.", match: 92, accent: "coral",
    requiredSkills: ["User research", "Figma", "Prototyping", "Interaction design", "Storytelling", "Accessibility"], education: ["UX research foundations", "Interaction design studio", "Portfolio critique"], roles: ["Product designer", "UX designer", "Design strategist"], tools: ["Figma", "FigJam", "Maze"], applications: ["SaaS products", "Consumer apps", "Service design"],
    milestones: sharedMilestones("Learn research, visual hierarchy, interaction patterns, and accessible design.", "Interview users and turn findings into a tested journey and prototype.", "Document one end-to-end case study with decisions, evidence, and outcomes."),
  },
  {
    slug: "data-analyst", title: "Data Analyst", category: "Data & decision-making", description: "Use evidence, queries, and stories to help teams make confident decisions.", match: 87, accent: "violet",
    requiredSkills: ["SQL", "Excel", "Data visualization", "Python", "Statistics", "Communication"], education: ["SQL for analysis", "Business statistics", "Dashboard design"], roles: ["Data analyst", "Product analyst", "Business analyst"], tools: ["SQL", "Excel", "Python", "Tableau"], applications: ["Product analytics", "Operations", "Marketing insights"],
    milestones: sharedMilestones("Develop confidence in spreadsheets, SQL, descriptive statistics, and data storytelling.", "Clean a real dataset, answer a business question, and explain your assumptions.", "Publish two concise case studies with a clear decision and recommendation."),
  },
  {
    slug: "frontend-engineer", title: "Frontend Engineer", category: "Technology & craft", description: "Build thoughtful, accessible interfaces that turn product ideas into reality.", match: 84, accent: "mint",
    requiredSkills: ["HTML", "CSS", "JavaScript", "React", "Accessibility", "Git"], education: ["Modern JavaScript", "React systems", "Web accessibility"], roles: ["Frontend engineer", "UI engineer", "Design technologist"], tools: ["React", "TypeScript", "Vite", "Playwright"], applications: ["Web products", "Design systems", "Interactive tools"],
    milestones: sharedMilestones("Build responsive pages with semantic HTML, modern CSS, JavaScript, and Git.", "Create reusable React components and manage product state with tests.", "Ship an accessible portfolio project with performance and deployment notes."),
  },
  {
    slug: "ai-engineer", title: "AI Engineer", category: "Artificial intelligence", description: "Turn models into useful, reliable products with strong evaluation and engineering practice.", match: 81, accent: "violet",
    requiredSkills: ["Python", "Machine learning", "APIs", "Data pipelines", "Evaluation", "Prompt design"], education: ["Python for data", "ML foundations", "Applied LLM systems"], roles: ["AI engineer", "ML engineer", "Applied scientist"], tools: ["Python", "PyTorch", "Docker", "Vector databases"], applications: ["Assistants", "Recommendations", "Automation"],
    milestones: sharedMilestones("Learn Python, data preparation, probability, model evaluation, and responsible AI basics.", "Build a small model or assistant with a test set, error analysis, and clear limitations.", "Deploy a portfolio demo with an evaluation report, monitoring plan, and user story."),
  },
  {
    slug: "cybersecurity-analyst", title: "Cybersecurity Analyst", category: "Security & resilience", description: "Help teams understand risk, protect systems, and respond thoughtfully to incidents.", match: 76, accent: "coral",
    requiredSkills: ["Networking", "Linux", "Threat modeling", "Identity", "Log analysis", "Communication"], education: ["Networking essentials", "Security operations", "Risk and governance"], roles: ["SOC analyst", "Security analyst", "GRC analyst"], tools: ["Linux", "Wireshark", "SIEM", "Python"], applications: ["Cloud security", "Incident response", "Security assurance"],
    milestones: sharedMilestones("Understand networks, operating systems, identity, common threats, and safe lab practice.", "Investigate a simulated log set and write an incident timeline with containment steps.", "Publish a defensible security case study without exposing real secrets or personal data."),
  },
  {
    slug: "cloud-devops", title: "Cloud & DevOps Engineer", category: "Infrastructure & delivery", description: "Make software delivery repeatable, observable, and resilient across environments.", match: 74, accent: "mint",
    requiredSkills: ["Linux", "Networking", "Containers", "CI/CD", "Cloud fundamentals", "Observability"], education: ["Linux and networking", "Containers", "Infrastructure as code"], roles: ["DevOps engineer", "Cloud engineer", "Platform engineer"], tools: ["Docker", "GitHub Actions", "Terraform", "Kubernetes"], applications: ["Cloud platforms", "Developer tooling", "Reliability engineering"],
    milestones: sharedMilestones("Learn Linux, networking, version control, and deployment fundamentals.", "Containerize a small service and automate tests, deployment, logs, and rollback.", "Document an architecture with security, cost, and reliability trade-offs."),
  },
  {
    slug: "data-engineer", title: "Data Engineer", category: "Data platforms", description: "Build the reliable pipelines and systems that make trustworthy analysis possible.", match: 72, accent: "violet",
    requiredSkills: ["SQL", "Python", "Data modeling", "ETL", "Testing", "Cloud storage"], education: ["SQL and modeling", "Python pipelines", "Distributed data concepts"], roles: ["Data engineer", "Analytics engineer", "Platform engineer"], tools: ["PostgreSQL", "dbt", "Airflow", "Spark"], applications: ["Warehouses", "Streaming", "Decision systems"],
    milestones: sharedMilestones("Learn relational modeling, SQL, Python, data quality, and reproducible development.", "Build an ingestion pipeline with validation, retries, lineage, and a small warehouse model.", "Publish a pipeline architecture and show how a stakeholder can trust the output."),
  },
  {
    slug: "embedded-robotics", title: "Embedded & Robotics Engineer", category: "Hardware & automation", description: "Bridge software, electronics, sensors, and physical systems to create responsive machines.", match: 69, accent: "coral",
    requiredSkills: ["C/C++", "Electronics", "Microcontrollers", "Control systems", "Debugging", "Systems thinking"], education: ["Digital electronics", "C/C++ systems", "Robotics fundamentals"], roles: ["Embedded engineer", "Robotics engineer", "Firmware engineer"], tools: ["Arduino", "Raspberry Pi", "PlatformIO", "Oscilloscope"], applications: ["Industrial automation", "IoT", "Assistive devices"],
    milestones: sharedMilestones("Understand circuits, C/C++, microcontrollers, serial protocols, and safe lab practice.", "Build a sensor-driven prototype with clear interfaces, tests, and failure handling.", "Document a physical demo with schematics, firmware, and a measured result."),
  },
  {
    slug: "renewable-energy", title: "Renewable Energy Engineer", category: "Energy & sustainability", description: "Design and evaluate systems that make energy cleaner, more efficient, and more resilient.", match: 65, accent: "mint",
    requiredSkills: ["Engineering math", "Energy systems", "Data analysis", "CAD", "Safety", "Technical writing"], education: ["Energy fundamentals", "Power systems", "Sustainability analysis"], roles: ["Energy engineer", "Sustainability analyst", "Systems engineer"], tools: ["Python", "CAD", "Simulation software", "GIS"], applications: ["Solar and wind", "Grid planning", "Energy efficiency"],
    milestones: sharedMilestones("Learn energy flows, measurement, engineering math, safety, and environmental trade-offs.", "Analyze a public energy dataset and model one practical system improvement.", "Publish a transparent design brief with assumptions, constraints, and impact measures."),
  },
];

export function calculateSkillGap(currentSkills: string[], careerSlug: string) {
  const career = CAREER_PATHS.find((item) => item.slug === careerSlug) ?? CAREER_PATHS[0];
  const normalized = currentSkills.map((skill) => skill.trim().toLowerCase());
  const strengths = career.requiredSkills.filter((skill) => normalized.includes(skill.toLowerCase()));
  const gaps = career.requiredSkills.filter((skill) => !normalized.includes(skill.toLowerCase()));
  const readiness = Math.round((strengths.length / career.requiredSkills.length) * 100);
  return { career, strengths, gaps, readiness };
}

export function createGuidanceFallback(message: string, careerSlug = "product-designer") {
  const { career, gaps, readiness } = calculateSkillGap(["Figma", "Storytelling", "HTML"], careerSlug);
  return `You are building a credible path toward **${career.title}**. Your current readiness is **${readiness}%**. Focus first on **${gaps.slice(0, 2).join("** and **")}**; pair each learning session with a small portfolio artifact. For your question, “${message},” the best next step is to choose one scoped practice project this week and document both your process and what you learned.`;
}
