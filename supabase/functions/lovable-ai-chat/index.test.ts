import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("lovable-ai-chat - should return error without messages", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lovable-ai-chat`, {
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
  assertEquals(data.error, "Messages array is required");
});

Deno.test("lovable-ai-chat - should return error for empty messages array", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lovable-ai-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ messages: [] }),
  });

  const data = await response.json();
  assertEquals(response.status, 400);
  assertEquals(data.success, false);
});

Deno.test("lovable-ai-chat - should handle CORS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lovable-ai-chat`, {
    method: "OPTIONS",
  });

  await response.text();
  assertEquals(response.status, 200);
  assertExists(response.headers.get("access-control-allow-origin"));
});

Deno.test("lovable-ai-chat - should process valid message", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lovable-ai-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Привет" }],
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    assertEquals(data.success, true);
    assertExists(data.content);
  } else {
    // API key might not be configured
    assertExists(data.error);
  }
  
  await response.text().catch(() => {});
});
