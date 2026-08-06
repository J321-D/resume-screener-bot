import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import { Analyzer } from "@/components/analysis/analyzer";
import { Hero } from "@/components/shell/hero";

describe("accessibility foundation", () => {
  it("has no automated violations in the hero and input workspace", async () => {
    const { container } = render(<><Hero /><Analyzer /></>);
    // jsdom does not implement canvas, which axe needs for its color-contrast rule.
    // Contrast is verified separately in the real-browser smoke pass.
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
