import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CoverageRing } from "@/components/results/coverage-ring";

describe("CoverageRing", () => {
  it("exposes the final score immediately while only the ring arc settles", () => {
    render(<CoverageRing score={66.7} />);

    expect(screen.getByRole("img", { name: "66.7% keyword coverage" })).toBeInTheDocument();
    expect(screen.getByText("66.7%")).toBeInTheDocument();
  });

  it("renders the final value immediately when reduced motion is requested", () => {
    render(<CoverageRing score={66.7} reducedMotion />);
    expect(screen.getByText("66.7%")).toBeInTheDocument();
  });
});
