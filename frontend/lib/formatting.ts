import type { AnalysisInputs } from "./contracts";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_TEXT_CHARACTERS = 200_000;
export const MAX_RESUMES = 5;
const allowedExtensions = new Set(["pdf", "docx", "txt"]);

export interface FileValidation {
  error: string | null;
  status: string;
}

function opaqueIdentity(value: string): string {
  let first = 2166136261;
  let second = 2246822519;
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    first = Math.imul(first ^ point, 16777619);
    second = Math.imul(second ^ point, 3266489917);
  }
  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
}

export function resumeInputIdentity(inputs: AnalysisInputs): string {
  const files = inputs.resumeFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`).join("|");
  return opaqueIdentity(JSON.stringify([files, inputs.resumeText]));
}

export function jobInputIdentity(inputs: AnalysisInputs): string {
  if (inputs.jobText.trim()) {
    return opaqueIdentity(JSON.stringify(["manual", inputs.jobText]));
  }
  const file = inputs.jobFile ? `${inputs.jobFile.name}:${inputs.jobFile.size}:${inputs.jobFile.lastModified}` : "";
  return opaqueIdentity(JSON.stringify(["upload", file]));
}

export function inputSignature(inputs: AnalysisInputs): string {
  return opaqueIdentity(JSON.stringify([inputs.analysisMode, resumeInputIdentity(inputs), jobInputIdentity(inputs)]));
}

export function validateFile(file: File): FileValidation {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedExtensions.has(extension)) {
    return {
      error: `${file.name} must be a PDF, DOCX, or TXT file.`,
      status: "Unsupported file type",
    };
  }
  if (file.size === 0) return { error: `${file.name} is empty.`, status: "Empty file" };
  if (file.size > MAX_FILE_BYTES) {
    return { error: `${file.name} exceeds the 10 MB limit.`, status: "Exceeds 10 MB" };
  }
  return { error: null, status: "Ready to scan" };
}

export function validateFiles(files: File[], maximum = MAX_RESUMES): string | null {
  if (files.length > maximum) return `Choose no more than ${maximum} résumé files.`;
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_UPLOAD_BYTES) {
    return "The combined upload size must be 25 MB or smaller.";
  }
  for (const file of files) {
    const validation = validateFile(file);
    if (validation.error) return validation.error;
  }
  return null;
}

export function readableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
