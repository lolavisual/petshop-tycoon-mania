import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button component", () => {
  it("should render button with text", () => {
    const { container } = render(<Button>Click me</Button>);
    const button = container.querySelector("button");
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain("Click me");
  });

  it("should render with default variant", () => {
    const { container } = render(<Button>Default</Button>);
    const button = container.querySelector("button");
    expect(button).toBeTruthy();
  });

  it("should render with destructive variant", () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const button = container.querySelector("button");
    expect(button?.textContent).toContain("Delete");
  });

  it("should render with outline variant", () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const button = container.querySelector("button");
    expect(button).toBeTruthy();
  });

  it("should be disabled when disabled prop is true", () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const button = container.querySelector("button");
    expect(button?.disabled).toBe(true);
  });

  it("should render different sizes", () => {
    const { container: smallContainer } = render(<Button size="sm">Small</Button>);
    expect(smallContainer.querySelector("button")).toBeTruthy();

    const { container: largeContainer } = render(<Button size="lg">Large</Button>);
    expect(largeContainer.querySelector("button")).toBeTruthy();
  });
});
