export type LearningResource = {
  title: string;
  provider: string;
  type: "Course" | "Guide" | "Practice";
  level: "Beginner" | "Intermediate";
  duration: string;
  summary: string;
  url: string;
  skills: string[];
  careerSlugs: string[];
  featured?: boolean;
};

export const LEARNING_RESOURCES: LearningResource[] = [
  {
    title: "User Experience: The Beginner’s Guide",
    provider: "Interaction Design Foundation",
    type: "Course",
    level: "Beginner",
    duration: "Self-paced",
    summary: "A structured introduction to user-centred design, UX processes, and practical design thinking.",
    url: "https://ixdf.org/courses/user-experience-the-beginners-guide",
    skills: ["UX foundations", "Research", "Design process"],
    careerSlugs: ["product-designer"],
    featured: true,
  },
  {
    title: "Personas and User Research",
    provider: "Interaction Design Foundation",
    type: "Course",
    level: "Intermediate",
    duration: "Self-paced",
    summary: "Learn how to frame research, identify user needs, and translate findings into practical product decisions.",
    url: "https://ixdf.org/courses/personas-user-research-design-products-people-need",
    skills: ["User interviews", "Personas", "Synthesis"],
    careerSlugs: ["product-designer"],
  },
  {
    title: "Figma Learn",
    provider: "Figma",
    type: "Guide",
    level: "Beginner",
    duration: "Flexible",
    summary: "Official tutorials, product lessons, and practical starting points for interface and prototype work.",
    url: "https://help.figma.com/hc/en-us/categories/360002051613-Get-started",
    skills: ["Figma", "Prototyping", "Design systems"],
    careerSlugs: ["product-designer"],
  },
  {
    title: "Google Data Analytics Professional Certificate",
    provider: "Coursera",
    type: "Course",
    level: "Beginner",
    duration: "Flexible",
    summary: "A guided program covering analytical thinking, spreadsheets, SQL, visualisation, and a capstone-style approach.",
    url: "https://www.coursera.org/professional-certificates/google-data-analytics",
    skills: ["Spreadsheets", "SQL", "Data storytelling"],
    careerSlugs: ["data-analyst"],
    featured: true,
  },
  {
    title: "Microsoft Learn: Power BI",
    provider: "Microsoft Learn",
    type: "Guide",
    level: "Beginner",
    duration: "Flexible",
    summary: "Official learning modules for preparing data, modelling information, and designing decision-ready reports.",
    url: "https://learn.microsoft.com/en-us/training/powerplatform/power-bi/",
    skills: ["Power BI", "Visualisation", "Data modelling"],
    careerSlugs: ["data-analyst"],
  },
  {
    title: "Kaggle Learn",
    provider: "Kaggle",
    type: "Practice",
    level: "Beginner",
    duration: "Short modules",
    summary: "Hands-on micro-courses and datasets for practising Python, data cleaning, visualisation, and SQL.",
    url: "https://www.kaggle.com/learn",
    skills: ["Python", "SQL", "Practice projects"],
    careerSlugs: ["data-analyst"],
  },
  {
    title: "MDN Learn Web Development",
    provider: "MDN Web Docs",
    type: "Guide",
    level: "Beginner",
    duration: "Self-paced",
    summary: "A structured set of tutorials and challenges covering the essential skills and practices of front-end development.",
    url: "https://developer.mozilla.org/en-US/docs/Learn_web_development",
    skills: ["HTML", "CSS", "JavaScript"],
    careerSlugs: ["frontend-engineer"],
    featured: true,
  },
  {
    title: "React Learn",
    provider: "React",
    type: "Guide",
    level: "Beginner",
    duration: "Self-paced",
    summary: "Official interactive documentation for building component-based interfaces with modern React.",
    url: "https://react.dev/learn",
    skills: ["React", "Components", "State"],
    careerSlugs: ["frontend-engineer"],
  },
  {
    title: "Responsive Web Design",
    provider: "freeCodeCamp",
    type: "Practice",
    level: "Beginner",
    duration: "Self-paced",
    summary: "Project-based web development practice focused on semantic HTML, CSS, accessibility, and responsive layouts.",
    url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    skills: ["Responsive design", "Accessibility", "Projects"],
    careerSlugs: ["frontend-engineer"],
  },
];

export function getResourcesForCareer(careerSlug: string) {
  return LEARNING_RESOURCES.filter((resource) => resource.careerSlugs.includes(careerSlug));
}
