import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conditional class names", () => {
    const result = cn("base-class", true && "conditional-class");
    expect(result).toBe("base-class conditional-class");
  });

  it("should handle falsy values", () => {
    const result = cn("base-class", false && "should-not-appear", null, undefined);
    expect(result).toBe("base-class");
  });

  it("should merge conflicting tailwind classes correctly", () => {
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });
});
