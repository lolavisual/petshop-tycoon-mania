import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("perplexity-search - should return error without query", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/perplexity-search`, {
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
  assertEquals(data.error, "Query is required");
});

Deno.test("perplexity-search - should handle CORS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/perplexity-search`, {
    method: "OPTIONS",
    headers: {
      "Origin": "http://localhost:3000",
    },
  });

  await response.text();
  assertEquals(response.status, 200);
  assertExists(response.headers.get("access-control-allow-origin"));
});
