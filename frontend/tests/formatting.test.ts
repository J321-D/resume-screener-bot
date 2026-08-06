import { describe, expect, it } from "vitest";

import { inputSignature, validateFiles } from "@/lib/formatting";
import type { AnalysisInputs } from "@/lib/contracts";

describe("input utilities", () => {
  it("changes the signature when any analysis input changes", () => {
    const initial: AnalysisInputs = {
      analysisMode: "Skills-focused analysis",
      resumeFiles: [],
      resumeText: "Python",
      jobFile: null,
      jobText: "Python SQL",
    };
    expect(inputSignature({ ...initial, jobText: "Python SQL MATLAB" })).not.toBe(inputSignature(initial));
  });

  it("accepts supported document extensions and rejects unsupported ones", () => {
    expect(validateFiles([new File(["Python"], "résumé.txt", { type: "text/plain" })])).toBeNull();
    expect(validateFiles([new File(["binary"], "resume.exe")])).toContain("PDF, DOCX, or TXT");
  });
});
