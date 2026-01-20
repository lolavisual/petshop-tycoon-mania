import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDemoMode } from "@/hooks/useDemoMode";

describe("useDemoMode hook", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useDemoMode());
    
    expect(result.current.profile).toBeDefined();
    expect(result.current.profile?.diamonds).toBe(10);
    expect(result.current.profile?.level).toBe(1);
  });

  it("should have handleClick function", () => {
    const { result } = renderHook(() => useDemoMode());
    expect(typeof result.current.handleClick).toBe("function");
  });

  it("should have claimChest function", () => {
    const { result } = renderHook(() => useDemoMode());
    expect(typeof result.current.claimChest).toBe("function");
  });

  it("should increment crystals on click", () => {
    const { result } = renderHook(() => useDemoMode());
    
    const initialCrystals = result.current.profile?.crystals || 0;
    
    act(() => {
      result.current.handleClick();
    });

    expect(result.current.profile?.crystals).toBeGreaterThan(initialCrystals);
  });

  it("should increment total clicks on click", () => {
    const { result } = renderHook(() => useDemoMode());
    
    const initialClicks = result.current.profile?.total_clicks || 0;
    
    act(() => {
      result.current.handleClick();
    });

    expect(result.current.profile?.total_clicks).toBe(initialClicks + 1);
  });
});
