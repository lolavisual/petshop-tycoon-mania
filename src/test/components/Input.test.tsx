import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Input } from "@/components/ui/input";

describe("Input component", () => {
  it("should render input element", () => {
    const { container } = render(<Input placeholder="Enter text" />);
    const input = container.querySelector("input");
    expect(input).toBeTruthy();
    expect(input?.placeholder).toBe("Enter text");
  });

  it("should be disabled when disabled prop is true", () => {
    const { container } = render(<Input disabled placeholder="Disabled" />);
    const input = container.querySelector("input");
    expect(input?.disabled).toBe(true);
  });

  it("should handle different types", () => {
    const { container: emailContainer } = render(<Input type="email" placeholder="Email" />);
    expect(emailContainer.querySelector("input")?.type).toBe("email");

    const { container: passwordContainer } = render(<Input type="password" placeholder="Password" />);
    expect(passwordContainer.querySelector("input")?.type).toBe("password");
  });

  it("should have correct className", () => {
    const { container } = render(<Input className="custom-class" placeholder="Input" />);
    const input = container.querySelector("input");
    expect(input?.className).toContain("custom-class");
  });
});
