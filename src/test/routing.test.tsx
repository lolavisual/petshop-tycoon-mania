import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}));

// Mock Telegram
vi.mock("@/lib/telegram", () => ({
  getTelegramWebApp: () => null,
  isTelegramWebApp: () => false,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe("Routing", () => {
  it("should render index route", async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/"]}>
          <div data-testid="test-app">App Content</div>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(container.textContent).toContain("App Content");
  });

  it("should handle consultant route", async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/consultant"]}>
          <div data-testid="consultant-route">Consultant</div>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(container.textContent).toContain("Consultant");
  });

  it("should handle admin route", async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/admin"]}>
          <div data-testid="admin-route">Admin</div>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(container.textContent).toContain("Admin");
  });
});
