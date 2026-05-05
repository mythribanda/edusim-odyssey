export type Subject = {
  id: string;
  name: string;
  icon: string;
  description: string;
  chapters: number;
};

export type ClassInfo = {
  id: number;
  name: string;
  description: string;
  subjects: Subject[];
};

const mk = (id: string, name: string, icon: string, description: string, chapters: number): Subject => ({
  id,
  name,
  icon,
  description,
  chapters,
});

export const CLASSES: ClassInfo[] = [
  { id: 1, name: "Class 1", description: "Foundations of numbers and counting", subjects: [mk("math", "Math", "Calculator", "Numbers, shapes & basic operations", 10)] },
  { id: 2, name: "Class 2", description: "Building early arithmetic skills", subjects: [mk("math", "Math", "Calculator", "Addition, subtraction & patterns", 12)] },
  { id: 3, name: "Class 3", description: "Curiosity meets early science", subjects: [
    mk("math", "Math", "Calculator", "Multiplication, division, fractions", 14),
    mk("evs", "EVS", "Leaf", "Explore the world around you", 14),
  ] },
  { id: 4, name: "Class 4", description: "Sharpen logic and observation", subjects: [
    mk("math", "Math", "Calculator", "Decimals, geometry, measurement", 15),
    mk("evs", "EVS", "Leaf", "Plants, animals & environment", 15),
  ] },
  { id: 5, name: "Class 5", description: "Bridging primary to middle school", subjects: [
    mk("math", "Math", "Calculator", "Advanced arithmetic & geometry", 16),
    mk("evs", "EVS", "Leaf", "General science foundations", 16),
  ] },
  { id: 6, name: "Class 6", description: "Step into structured science", subjects: [
    mk("math", "Math", "Calculator", "Algebra basics & integers", 14),
    mk("science", "Science", "Atom", "General science fundamentals", 16),
  ] },
  { id: 7, name: "Class 7", description: "Deepen scientific reasoning", subjects: [
    mk("math", "Math", "Calculator", "Rational numbers & equations", 15),
    mk("science", "Science", "Atom", "Physics, chemistry & biology", 17),
  ] },
  { id: 8, name: "Class 8", description: "Specialized science begins", subjects: [
    mk("math", "Math", "Calculator", "Algebra, mensuration & graphs", 15),
    mk("physics", "Physics", "Zap", "Force, motion, sound & light", 12),
    mk("biology", "Biology", "Dna", "Cells, life processes & more", 11),
  ] },
  { id: 9, name: "Class 9", description: "Conceptual depth & problem solving", subjects: [
    mk("math", "Math", "Calculator", "Polynomials, geometry, statistics", 15),
    mk("physics", "Physics", "Zap", "Motion, gravitation, energy", 12),
    mk("biology", "Biology", "Dna", "Tissues, diversity, ecology", 11),
  ] },
  { id: 10, name: "Class 10", description: "Mastery for board excellence", subjects: [
    mk("math", "Math", "Calculator", "Trigonometry, probability, calculus", 14),
    mk("physics", "Physics", "Zap", "Electricity, magnetism, optics", 12),
    mk("biology", "Biology", "Dna", "Heredity, evolution, life processes", 10),
  ] },
];

export const getClass = (id: number) => CLASSES.find((c) => c.id === id);
export const getSubject = (classId: number, subjectId: string) =>
  getClass(classId)?.subjects.find((s) => s.id === subjectId);

export const getTopics = (chapter: number, subject: string): string[] => {
  const base = [
    "Introduction & Overview",
    "Core Concepts",
    "Worked Examples",
    "Interactive Exploration",
    "Real-world Applications",
    "Practice & Quiz",
  ];
  return base.map((t) => `${t} — ${subject} Ch.${chapter}`);
};
