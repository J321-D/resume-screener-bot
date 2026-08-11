import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReviewWorkspace } from "@/components/review/review-workspace";
import { actionChecklist, type ReviewDecisions } from "@/components/review/review-state";

const opportunities = [
  { term: "SQL", count: 3, category: "Tools/software" },
  { term: "GMP", count: 2, category: "Quality/regulatory" },
  { term: "cell-culture", count: 1, category: "Technical skills" },
  { term: "Node.js", count: 1, category: "Tools/software" },
];

describe("ReviewWorkspace", () => {
  it("starts unreviewed and tracks every status and status change", async () => {
    const user = userEvent.setup();
    render(<ReviewWorkspace opportunities={opportunities} stale={false} />);

    expect(screen.getByText("0 of 4")).toBeInTheDocument();
    expect(screen.getByText("reviewed · 4 remaining")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Review status for SQL"), "add");
    await user.selectOptions(screen.getByLabelText("Review status for GMP"), "represented");
    await user.selectOptions(screen.getByLabelText("Review status for cell-culture"), "not_relevant");
    await user.selectOptions(screen.getByLabelText("Review status for Node.js"), "later");

    expect(screen.getByText("4 of 4")).toBeInTheDocument();
    for (const label of ["Add to résumé", "Already represented", "Not relevant", "Review later"]) {
      expect(screen.getByText(label, { selector: "dt" }).nextElementSibling).toHaveTextContent("1");
    }

    await user.selectOptions(screen.getByLabelText("Review status for SQL"), "later");
    expect(screen.getByText("Add to résumé", { selector: "dt" }).nextElementSibling).toHaveTextContent("0");
    expect(screen.getByText("Review later", { selector: "dt" }).nextElementSibling).toHaveTextContent("2");
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  it("filters and searches without changing engine order", async () => {
    const user = userEvent.setup();
    render(<ReviewWorkspace opportunities={opportunities} stale={false} />);
    await user.selectOptions(screen.getByLabelText("Review status for SQL"), "add");
    await user.selectOptions(screen.getByLabelText("Review status for cell-culture"), "add");
    await user.click(screen.getByRole("radio", { name: "Add to résumé" }));

    const list = screen.getByLabelText("Opportunity review list");
    await waitFor(() => expect(within(list).getAllByRole("article")).toHaveLength(2));
    const orderedRows = within(list).getAllByRole("article").map((item) => item.textContent ?? "");
    expect(orderedRows[0]).toContain("SQL");
    expect(orderedRows[1]).toContain("cell-culture");

    await user.clear(screen.getByPlaceholderText("Search terms"));
    await user.type(screen.getByPlaceholderText("Search terms"), "cell");
    await waitFor(() => expect(within(list).getAllByRole("article")).toHaveLength(1));
    expect(within(list).getByText("cell-culture")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Unreviewed" }));
    expect(await within(list).findByText(/No opportunities match this view/)).toBeInTheDocument();
  });

  it("requires confirmation to reset decisions", async () => {
    const user = userEvent.setup();
    render(<ReviewWorkspace opportunities={opportunities} stale={false} />);
    await user.selectOptions(screen.getByLabelText("Review status for SQL"), "add");
    await user.click(screen.getByRole("button", { name: "Reset decisions" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Reset$/ })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByLabelText("Review status for SQL")).toHaveValue("add");
    await waitFor(() => expect(screen.getByRole("button", { name: "Reset decisions" })).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "Reset decisions" }));
    await user.click(screen.getByRole("button", { name: /^Reset$/ }));
    expect(screen.getByLabelText("Review status for SQL")).toHaveValue("");
    expect(screen.getByText("0 of 4")).toBeInTheDocument();
  });

  it("renders stale and reduced-motion states without exposing old decisions", () => {
    render(<ReviewWorkspace opportunities={opportunities} stale reducedMotion />);
    expect(screen.getByText(/review decisions were cleared/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Review status for SQL")).toBeDisabled();
    expect(screen.getByRole("button", { name: /download markdown checklist/i })).toBeDisabled();
    expect(screen.getByText("0 of 4")).toBeInTheDocument();
  });

  it("copies only explicitly selected terms as plain text", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    render(<ReviewWorkspace opportunities={opportunities} stale={false} />);
    await user.selectOptions(screen.getByLabelText("Review status for SQL"), "add");
    await user.selectOptions(screen.getByLabelText("Review status for GMP"), "later");
    await user.click(screen.getByRole("button", { name: "Copy selected terms" }));

    expect(writeText).toHaveBeenCalledWith("SQL");
    expect(screen.getByText("Selected terms copied.")).toBeInTheDocument();
  });
});

describe("actionChecklist", () => {
  it("preserves engine order and includes only Add to résumé decisions", () => {
    const decisions: ReviewDecisions = { "0": "add", "1": "later", "2": "add" };
    const checklist = actionChecklist(opportunities, decisions);
    expect(checklist.indexOf("SQL")).toBeLessThan(checklist.indexOf("cell-culture"));
    expect(checklist).toContain("- [ ] SQL");
    expect(checklist).toContain("- [ ] cell-culture");
    expect(checklist).not.toContain("GMP");
  });

  it("keeps user-derived terms on one inert Markdown checklist line", () => {
    const checklist = actionChecklist(
      [{ term: "[term]\n# injected heading", count: 1, category: null }],
      { "0": "add" },
    );
    expect(checklist).toContain("- [ ] \\[term\\] # injected heading");
    expect(checklist).not.toContain("\n# injected heading");
  });
});
