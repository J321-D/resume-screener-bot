import type { AnalysisInputs } from "@/lib/contracts";

export const SYNTHETIC_DEMO_RESUME = `Bioprocess engineer with experience in Python, SQL, GMP, cell-culture,
quality-control, technical writing, and cross-functional process development.`;

export const SYNTHETIC_DEMO_JOB = `Seeking a bioprocess engineer with Python, SQL, MATLAB, GMP, cell-culture,
quality-control, process validation, Node.js, technical writing, and design of experiments.`;

export function syntheticDemoInputs(): AnalysisInputs {
  return {
    analysisMode: "Skills-focused analysis",
    resumeFiles: [],
    resumeText: SYNTHETIC_DEMO_RESUME,
    jobFile: null,
    jobText: SYNTHETIC_DEMO_JOB,
  };
}
