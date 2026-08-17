import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "@/components/shell/hero";

describe("hero visual system", () => {
  it("renders the original analysis core and ordered boot contract", () => {
    const { container } = render(<Hero />);
    const hero = container.querySelector("[data-hero-sequence='system-boot']");

    expect(hero).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Analysis core showing five deterministic lexical dimensions" })).toBeInTheDocument();
    expect(container.querySelectorAll(".core-segment")).toHaveLength(5);
    expect(container.querySelector(".core-feed-resume")).toBeInTheDocument();
    expect(container.querySelector(".core-feed-role")).toBeInTheDocument();
    expect(container.querySelector(".core-scan-plane")).toBeInTheDocument();
    expect(container.querySelector(".boot-stage-1")).toBeInTheDocument();
    expect(container.querySelector(".boot-stage-4")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cinematic demo" })).toHaveAttribute("href", "/?demo=cinematic#workspace");
  });

  it("keeps the reduced-motion hero visible without delayed movement", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

    expect(css).toContain(".hero-boot .boot-stage,.hero-boot .visual-grid,.analysis-core,.energy-trace");
    expect(css).toContain("animation:none!important;animation-delay:0ms!important;opacity:1;filter:none;");
    expect(css).toContain(".analysis-core { transform:translate(-50%,-50%); }");
    expect(css).toContain(".core-feed span,.core-scan-plane { animation:none!important; }");
  });
});
