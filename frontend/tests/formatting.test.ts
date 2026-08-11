import { describe, expect, it } from "vitest";

import { inputSignature, MAX_TOTAL_UPLOAD_BYTES, validateFiles } from "@/lib/formatting";
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

  it("bounds aggregate uploads across generated file-count combinations", () => {
    for (const count of [1, 2, 5]) {
      const withinLimit = Array.from({ length: count }, (_, index) => new File(
        [new Uint8Array(1024)],
        `resume-${index}.txt`,
        { type: "text/plain" },
      ));
      expect(validateFiles(withinLimit)).toBeNull();
    }
    const oversized = Array.from({ length: 3 }, (_, index) => new File(
      [new Uint8Array(Math.floor(MAX_TOTAL_UPLOAD_BYTES / 3) + 1)],
      `large-${index}.txt`,
      { type: "text/plain" },
    ));
    expect(validateFiles(oversized)).toContain("25 MB");
  });
});
