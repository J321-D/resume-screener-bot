import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PresentationToggle } from "@/components/shell/presentation-toggle";

describe("PresentationToggle", () => {
  it("toggles ephemeral presentation state without persistence", async () => {
    const user = userEvent.setup();
    render(<PresentationToggle />);
    const button = screen.getByRole("button", { name: "Showcase" });
    window.dispatchEvent(new CustomEvent("presentation-mode-change", { detail: { active: true } }));
    expect(await screen.findByRole("button", { name: "Exit showcase" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Exit showcase" }));
    expect(document.documentElement).toHaveAttribute("data-presentation", "standard");
    await user.click(button);
    expect(document.documentElement).toHaveAttribute("data-presentation", "active");
    expect(screen.getByRole("button", { name: "Exit showcase" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveAttribute("data-showcase", "active");
    await user.click(screen.getByRole("button", { name: "Exit showcase" }));
    expect(document.documentElement).toHaveAttribute("data-presentation", "standard");
    expect(localStorage).toHaveLength(0);
  });
});
