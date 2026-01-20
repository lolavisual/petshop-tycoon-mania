import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Progress } from "@/components/ui/progress";

describe("Progress component", () => {
  it("should render progress bar", () => {
    const { container } = render(<Progress value={50} data-testid="progress" />);
    expect(container.querySelector('[role="progressbar"]')).toBeTruthy();
  });

  it("should render with 0% value", () => {
    const { container } = render(<Progress value={0} data-testid="progress-0" />);
    expect(container.querySelector('[role="progressbar"]')).toBeTruthy();
  });

  it("should render with 100% value", () => {
    const { container } = render(<Progress value={100} data-testid="progress-100" />);
    expect(container.querySelector('[role="progressbar"]')).toBeTruthy();
  });

  it("should have correct aria attributes", () => {
    const { container } = render(<Progress value={75} data-testid="progress-aria" />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toBeTruthy();
    expect(progress?.getAttribute("aria-valuenow")).toBe("75");
  });
});
