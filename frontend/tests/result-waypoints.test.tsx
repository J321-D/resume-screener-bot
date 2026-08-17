import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResultWaypoints } from "@/components/results/result-waypoints";

describe("ResultWaypoints", () => {
  it("exposes the long result workspace as ordered native landmarks without persistence", () => {
    render(<ResultWaypoints />);

    const navigation = screen.getByRole("navigation", { name: "Result waypoints" });
    expect(navigation).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Coverage" })).toHaveAttribute("href", "#summary");
    expect(screen.getByRole("link", { name: "Evidence" })).toHaveAttribute("href", "#evidence-explorer");
    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute("href", "#review");
    expect(screen.getByRole("link", { name: "Lab" })).toHaveAttribute("href", "#resume-lab");
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });
});
