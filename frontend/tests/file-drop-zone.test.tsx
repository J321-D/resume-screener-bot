import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileDropZone } from "@/components/analysis/file-drop-zone";

describe("FileDropZone", () => {
  it("shows the validation badge only when selected files are valid", () => {
    const onFiles = vi.fn();
    const { rerender } = render(
      <FileDropZone
        label="Résumé files"
        description="Multiple files combine into one lexical comparison."
        files={[]}
        multiple
        onFiles={onFiles}
      />,
    );

    expect(screen.queryByText("Validated")).not.toBeInTheDocument();

    rerender(
      <FileDropZone
        label="Résumé files"
        description="Multiple files combine into one lexical comparison."
        files={[new File(["Python"], "resume.txt", { type: "text/plain" })]}
        multiple
        onFiles={onFiles}
      />,
    );

    expect(screen.getByText("Validated")).toBeInTheDocument();

    rerender(
      <FileDropZone
        label="Résumé files"
        description="Multiple files combine into one lexical comparison."
        files={[new File([], "empty.txt", { type: "text/plain" })]}
        multiple
        onFiles={onFiles}
      />,
    );

    expect(screen.queryByText("Validated")).not.toBeInTheDocument();
  });
});
