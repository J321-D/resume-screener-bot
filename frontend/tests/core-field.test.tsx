import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CoreField } from "@/components/shell/core-field";

describe("CoreField", () => {
  it("draws a bounded decorative field and cancels its animation lifecycle", () => {
    const context = { setTransform: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), arc: vi.fn(), fill: vi.fn(), strokeStyle: "", fillStyle: "", lineWidth: 0 };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    const { container, unmount } = render(<CoreField />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveAttribute("data-render-budget", "18 nodes / 20 fps");
    expect(context.arc).toHaveBeenCalledTimes(18);
    unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
