import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CoverageRing } from "@/components/results/coverage-ring";

describe("CoverageRing", () => {
  it("announces the final score while the visual count-up settles on it", async () => {
    render(<CoverageRing score={66.7} />);

    expect(screen.getByRole("img", { name: "66.7% keyword coverage" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("66.7%")).toBeInTheDocument(), { timeout: 2500 });
  });

  it("renders the final value immediately when reduced motion is requested", () => {
    render(<CoverageRing score={66.7} reducedMotion />);
    expect(screen.getByText("66.7%")).toBeInTheDocument();
  });
});
