import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("firecrawl - should return error without action", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/firecrawl`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({}),
  });

  const data = await response.json();
  assertEquals(response.status, 400);
  assertEquals(data.success, false);
});

Deno.test("firecrawl - scrape should require url", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/firecrawl`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ action: "scrape" }),
  });

  const data = await response.json();
  assertEquals(response.status, 400);
  assertEquals(data.success, false);
});

Deno.test("firecrawl - search should require query", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/firecrawl`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ action: "search" }),
  });

  const data = await response.json();
  assertEquals(response.status, 400);
  assertEquals(data.success, false);
});

Deno.test("firecrawl - should handle CORS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/firecrawl`, {
    method: "OPTIONS",
  });

  await response.text();
  assertEquals(response.status, 200);
});
