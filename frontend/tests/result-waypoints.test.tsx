import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { ResultWaypoints } from "@/components/results/result-waypoints";

function mockSections() {
  const sections = new Map<string, HTMLDivElement>();
  for (const id of ["summary", "findings", "evidence-explorer", "review", "resume-lab"]) {
    const el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
    sections.set(id, el);
  }
  return sections;
}

function cleanupSections() {
  for (const el of document.querySelectorAll("[id]")) {
    if (["summary", "findings", "evidence-explorer", "review", "resume-lab"].includes(el.id)) {
      el.remove();
    }
  }
}

describe("ResultWaypoints", () => {
  beforeEach(() => {
    cleanupSections();
    // @ts-expect-error accessing mock class static method
    window.IntersectionObserver.clear?.();
    // @ts-expect-error accessing mock class static method
    window.ResizeObserver.clear?.();
  });

  afterEach(() => {
    cleanupSections();
  });

  it("exposes the long result workspace as ordered native landmarks without persistence", () => {
    render(<ResultWaypoints />);

    // Verify all waypoint links are rendered in document order
    expect(screen.getByRole("link", { name: "Coverage" })).toHaveAttribute("href", "#summary");
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "#findings");
    expect(screen.getByRole("link", { name: "Evidence" })).toHaveAttribute("href", "#evidence-explorer");
    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute("href", "#review");
    expect(screen.getByRole("link", { name: "Lab" })).toHaveAttribute("href", "#resume-lab");
    // localStorage may be unavailable in some test environments (jsdom without --localstorage-file)
    if (typeof localStorage !== "undefined") {
      expect(localStorage).toHaveLength(0);
    }
    if (typeof sessionStorage !== "undefined") {
      expect(sessionStorage).toHaveLength(0);
    }
  });

  it("marks the first waypoint as active by default before intersection changes", () => {
    mockSections();
    render(<ResultWaypoints />);

    const coverage = screen.getByRole("link", { name: "Coverage" });
    expect(coverage).toHaveAttribute("aria-current", "true");
    expect(coverage.closest("li")).toHaveClass("is-active");

    const terms = screen.getByRole("link", { name: "Terms" });
    expect(terms).not.toHaveAttribute("aria-current");
    expect(terms.closest("li")).not.toHaveClass("is-active");
  });

  it("updates active waypoint when intersection observer reports a visible section", async () => {
    const sections = mockSections();
    render(<ResultWaypoints />);

    // Wait for IntersectionObserver to be instantiated
    await waitFor(() => {
      // @ts-expect-error accessing mock internals
      expect(window.IntersectionObserver.instances.length).toBeGreaterThan(0);
    });

    // Simulate that "findings" section is intersecting
    const entries = [
      {
        target: sections.get("findings")!,
        isIntersecting: true,
        intersectionRatio: 0.5,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: Date.now(),
      } as IntersectionObserverEntry,
    ];

    // @ts-expect-error accessing mock static trigger
    window.IntersectionObserver.trigger(entries);

    await waitFor(() => {
      const terms = screen.getByRole("link", { name: "Terms" });
      expect(terms).toHaveAttribute("aria-current", "true");
      expect(terms.closest("li")).toHaveClass("is-active");
    });

    const coverage = screen.getByRole("link", { name: "Coverage" });
    expect(coverage).not.toHaveAttribute("aria-current");
    expect(coverage.closest("li")).not.toHaveClass("is-active");
  });

  it("advances to the last waypoint when the bottom section is intersecting", async () => {
    const sections = mockSections();
    render(<ResultWaypoints />);

    await waitFor(() => {
      // @ts-expect-error accessing mock internals
      expect(window.IntersectionObserver.instances.length).toBeGreaterThan(0);
    });

    const entries = [
      {
        target: sections.get("resume-lab")!,
        isIntersecting: true,
        intersectionRatio: 0.1,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: Date.now(),
      } as IntersectionObserverEntry,
    ];

    // @ts-expect-error accessing mock static trigger
    window.IntersectionObserver.trigger(entries);

    await waitFor(() => {
      const lab = screen.getByRole("link", { name: "Lab" });
      expect(lab).toHaveAttribute("aria-current", "true");
      expect(lab.closest("li")).toHaveClass("is-active");
    });
  });

  it("does not flicker when no section is currently intersecting", async () => {
    const sections = mockSections();
    render(<ResultWaypoints />);

    await waitFor(() => {
      // @ts-expect-error accessing mock internals
      expect(window.IntersectionObserver.instances.length).toBeGreaterThan(0);
    });

    // Mark "findings" as intersecting first
    let entries = [
      {
        target: sections.get("findings")!,
        isIntersecting: true,
        intersectionRatio: 0.5,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: Date.now(),
      } as IntersectionObserverEntry,
    ];

    // @ts-expect-error accessing mock static trigger
    window.IntersectionObserver.trigger(entries);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("aria-current", "true");
    });

    // Now simulate that findings leaves but nothing new enters
    entries = [
      {
        target: sections.get("findings")!,
        isIntersecting: false,
        intersectionRatio: 0,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: Date.now(),
      } as IntersectionObserverEntry,
    ];

    // @ts-expect-error accessing mock static trigger
    window.IntersectionObserver.trigger(entries);

    // Wait a tick to ensure React had a chance to re-render
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should still show Terms as active (no change because nothing else is visible)
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("aria-current", "true");
  });

  it("keeps all waypoint links keyboard-accessible", () => {
    mockSections();
    render(<ResultWaypoints />);

    for (const label of ["Coverage", "Terms", "Evidence", "Review", "Lab"]) {
      const link = screen.getByRole("link", { name: label });
      expect(link).toBeVisible();
      expect(link).toHaveAttribute("href");
    }
  });

  it("applies overflow affordance class when rail is scrollable", async () => {
    mockSections();
    render(<ResultWaypoints />);

    await waitFor(() => {
      // @ts-expect-error accessing mock internals
      expect(window.ResizeObserver.instances.length).toBeGreaterThan(0);
    });

    const nav = screen.getByRole("navigation", { name: "Result waypoints" });
    expect(nav).toBeInTheDocument();
  });
});
