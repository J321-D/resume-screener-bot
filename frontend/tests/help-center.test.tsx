import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HelpCenter } from "@/components/help/help-center";

describe("HelpCenter", () => {
  it("searches task-oriented answers without persisting or transmitting a query", async () => {
    const user = userEvent.setup();
    render(<HelpCenter />);

    expect(screen.getByRole("status")).toHaveTextContent("17 answers");
    await user.type(screen.getByRole("searchbox", { name: "Search help" }), "66.7");

    expect(screen.getByRole("heading", { name: "What does 66.7% coverage mean?" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Which documents can I use?" })).not.toBeInTheDocument();
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  it("filters by category and provides an accessible no-results recovery", async () => {
    const user = userEvent.setup();
    render(<HelpCenter />);

    await user.click(screen.getByRole("radio", { name: "Documents & privacy" }));
    expect(screen.getByRole("heading", { name: "What happens to my résumé and job description?" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "How should I review opportunities?" })).not.toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "Search help" }), "no-such-topic");
    expect(screen.getByText("No matching answer.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("status")).toHaveTextContent("17 answers");
  });

  it("offers only the privacy-warned external feedback path", () => {
    render(<HelpCenter />);

    const feedback = screen.getByRole("link", { name: /open a github issue/i });
    expect(feedback).toHaveAttribute("href", "https://github.com/J321-D/resume-screener-bot/issues/new");
    expect(feedback).toHaveAttribute("rel", "noreferrer");
    expect(screen.getByText(/never include résumé text/i)).toBeInTheDocument();
    expect(screen.queryByText(/was this helpful/i)).not.toBeInTheDocument();
  });
});
