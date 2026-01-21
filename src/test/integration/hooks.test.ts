import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        lte: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  },
}));

describe("Hook Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("usePromotions Hook", () => {
    it("should initialize with empty promotions", async () => {
      const { usePromotions } = await import("@/hooks/usePromotions");
      const { result } = renderHook(() => usePromotions());

      expect(result.current.loading).toBe(true);
      
      // Wait for async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.promotions).toEqual([]);
    });

    it("should provide getProductDiscount function", async () => {
      const { usePromotions } = await import("@/hooks/usePromotions");
      const { result } = renderHook(() => usePromotions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const discount = result.current.getProductDiscount("test-product");
      expect(discount).toBeNull();
    });

    it("should provide getProductPromo function", async () => {
      const { usePromotions } = await import("@/hooks/usePromotions");
      const { result } = renderHook(() => usePromotions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const promo = result.current.getProductPromo("test-product");
      expect(promo).toBeNull();
    });
  });

  describe("usePetProducts Hook", () => {
    it("should initialize with loading state", async () => {
      const { usePetProducts } = await import("@/hooks/usePetProducts");
      const { result } = renderHook(() => usePetProducts());

      expect(result.current.loading).toBe(true);
    });

    it("should provide formatPrice function", async () => {
      const { usePetProducts } = await import("@/hooks/usePetProducts");
      const { result } = renderHook(() => usePetProducts());

      const formatted = result.current.formatPrice(1500);
      expect(formatted).toContain("1");
      expect(formatted).toContain("500");
    });

    it("should have category labels", async () => {
      const { categoryLabels } = await import("@/hooks/usePetProducts");
      
      expect(categoryLabels.all.label).toBe("Все товары");
      expect(categoryLabels.cats.label).toBe("Для кошек");
      expect(categoryLabels.dogs.label).toBe("Для собак");
    });
  });

  describe("Product Helper Functions", () => {
    it("isNewProduct should detect new products", async () => {
      const { isNewProduct } = await import("@/hooks/usePetProducts");
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isNewProduct(yesterday.toISOString())).toBe(true);

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      expect(isNewProduct(oldDate.toISOString())).toBe(false);
    });

    it("isHitProduct should detect hit products", async () => {
      const { isHitProduct } = await import("@/hooks/usePetProducts");
      
      expect(isHitProduct({ price: 2000 } as any)).toBe(true);
      expect(isHitProduct({ price: 500 } as any)).toBe(false);
      expect(isHitProduct({ price: 6000 } as any)).toBe(false);
    });
  });
});
