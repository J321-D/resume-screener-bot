import type { AnalysisInputs } from "./contracts";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_RESUMES = 5;
const allowedExtensions = new Set(["pdf", "docx", "txt"]);

export function inputSignature(inputs: AnalysisInputs): string {
  const files = inputs.resumeFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`).join("|");
  const job = inputs.jobFile
    ? `${inputs.jobFile.name}:${inputs.jobFile.size}:${inputs.jobFile.lastModified}`
    : "";
  return JSON.stringify([inputs.analysisMode, files, inputs.resumeText, job, inputs.jobText]);
}

export function validateFiles(files: File[], maximum = MAX_RESUMES): string | null {
  if (files.length > maximum) return `Choose no more than ${maximum} résumé files.`;
  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.has(extension)) return `${file.name} must be a PDF, DOCX, or TXT file.`;
    if (file.size === 0) return `${file.name} is empty.`;
    if (file.size > MAX_FILE_BYTES) return `${file.name} exceeds the 10 MB limit.`;
  }
  return null;
}

export function readableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
