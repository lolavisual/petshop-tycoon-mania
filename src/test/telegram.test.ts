import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTelegramWebApp, isTelegramWebApp } from "@/lib/telegram";

describe("Telegram utilities", () => {
  beforeEach(() => {
    // Reset window.Telegram before each test
    (window as any).Telegram = undefined;
  });

  it("should return null when Telegram is not available", () => {
    const result = getTelegramWebApp();
    expect(result).toBeNull();
  });

  it("should return false for isTelegramWebApp when not in Telegram", () => {
    const result = isTelegramWebApp();
    expect(result).toBe(false);
  });

  it("should return WebApp when Telegram is available", () => {
    const mockWebApp = {
      initData: "test",
      initDataUnsafe: {},
      version: "6.0",
      platform: "web",
    };
    
    (window as any).Telegram = {
      WebApp: mockWebApp,
    };

    const result = getTelegramWebApp();
    expect(result).toEqual(mockWebApp);
  });

  it("should return true for isTelegramWebApp when in Telegram with initData", () => {
    (window as any).Telegram = {
      WebApp: {
        initData: "test_init_data",
      },
    };

    const result = isTelegramWebApp();
    expect(result).toBe(true);
  });
});
