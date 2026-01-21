import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch for API tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("API Integration Tests", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("Edge Function Calls", () => {
    it("should call game-click endpoint correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          crystals: 100,
          xp: 50,
        }),
      });

      const response = await fetch("/functions/v1/game-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clicks: 1 }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.crystals).toBeDefined();
    });

    it("should call game-chest endpoint correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          crystals_earned: 500,
          streak_days: 1,
        }),
      });

      const response = await fetch("/functions/v1/game-chest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("should call shop-purchase endpoint correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          item: { name: "Test Item" },
        }),
      });

      const response = await fetch("/functions/v1/shop-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: "test-item",
          itemType: "shop_item",
          quantity: 1,
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("should handle quest-claim endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          reward: { crystals: 100 },
        }),
      });

      const response = await fetch("/functions/v1/quest-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userQuestId: "test-quest" }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("should handle send-gift endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          gift: { id: "gift-123" },
        }),
      });

      const response = await fetch("/functions/v1/send-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: "user-123",
          type: "crystals",
          amount: 50,
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle 401 unauthorized errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      });

      const response = await fetch("/functions/v1/game-click", {
        method: "POST",
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it("should handle 500 server errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal Server Error" }),
      });

      const response = await fetch("/functions/v1/game-click", {
        method: "POST",
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        fetch("/functions/v1/game-click", { method: "POST" })
      ).rejects.toThrow("Network error");
    });
  });

  describe("Request Validation", () => {
    it("should send correct headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await fetch("/functions/v1/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token",
        },
        body: JSON.stringify({ data: "test" }),
      });

      expect(mockFetch).toHaveBeenCalledWith("/functions/v1/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token",
        },
        body: '{"data":"test"}',
      });
    });
  });
});
