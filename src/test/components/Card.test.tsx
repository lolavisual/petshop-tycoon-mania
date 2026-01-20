import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

describe("Card components", () => {
  it("should render Card component", () => {
    const { container } = render(<Card data-testid="card">Card content</Card>);
    expect(container.textContent).toContain("Card content");
  });

  it("should render complete card structure", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter>Test Footer</CardFooter>
      </Card>
    );

    expect(container.textContent).toContain("Test Title");
    expect(container.textContent).toContain("Test Description");
    expect(container.textContent).toContain("Test Content");
    expect(container.textContent).toContain("Test Footer");
  });
});
