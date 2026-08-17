import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CommandPalette } from "@/components/shell/command-palette";

describe("CommandPalette", () => {
  it("opens with the platform shortcut and restores trigger focus on Escape", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("dialog", { name: "Go directly to the next task." })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("searchbox", { name: "Search commands" })).toHaveFocus());
    expect(screen.queryByText("Review missing terms")).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /commands/i })).toHaveFocus());
  });

  it("discovers current result actions and focuses the review region", async () => {
    const user = userEvent.setup();
    render(<><CommandPalette /><section className="review-workspace" tabIndex={-1}>Review queue</section><section className="analysis-playback">Walkthrough</section><details id="living-report"><summary>Living Report</summary></details><button id="gap-mode-trigger">Review unresolved gaps</button><button id="download-report">Download</button></>);

    await user.click(screen.getByRole("button", { name: /commands/i }));
    expect(screen.getByText("Review missing terms")).toBeInTheDocument();
    expect(screen.getByText("Export PDF report")).toBeInTheDocument();
    expect(screen.getByText("Open Gap Mode")).toBeInTheDocument();
    expect(screen.getByText("Walk through result")).toBeInTheDocument();
    expect(screen.getByText("Open Living Report")).toBeInTheDocument();
    await user.click(screen.getByText("Review missing terms"));

    expect(screen.getByText("Review queue")).toHaveFocus();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("filters commands and provides an explicit no-results state", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    await user.click(screen.getByRole("button", { name: /commands/i }));
    await user.type(screen.getByRole("searchbox", { name: "Search commands" }), "not a command");
    expect(screen.getByText(/No commands match/)).toBeInTheDocument();
  });

  it("discovers session-only Resume Lab actions without creating storage", async () => {
    const user = userEvent.setup();
    render(<><CommandPalette /><section id="resume-lab">Resume Lab</section><section id="diff-reactor">Diff Reactor</section><a id="add-resume-variant" href="#workspace">Add résumé variant</a><button id="clear-resume-lab">Clear Resume Lab session</button></>);
    await user.click(screen.getByRole("button", { name: /commands/i }));
    expect(screen.getByText("Open Resume Lab")).toBeInTheDocument();
    expect(screen.getByText("Compare current runs")).toBeInTheDocument();
    expect(screen.getByText("Clear comparison session")).toBeInTheDocument();
  });

  it("notifies its navigation shell after a contextual command runs", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<><CommandPalette onNavigate={onNavigate} /><section id="revision-workspace" tabIndex={-1}>Temporary revision</section></>);
    await user.click(screen.getByRole("button", { name: /commands/i }));
    await user.click(screen.getByText("Open Revision Workspace"));
    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
