import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge component", () => {
  it("should render badge with text", () => {
    const { container } = render(<Badge>New</Badge>);
    expect(container.textContent).toContain("New");
  });

  it("should render with default variant", () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.textContent).toContain("Default");
  });

  it("should render with secondary variant", () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(container.textContent).toContain("Secondary");
  });

  it("should render with destructive variant", () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    expect(container.textContent).toContain("Error");
  });

  it("should render with outline variant", () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.textContent).toContain("Outline");
  });
});
