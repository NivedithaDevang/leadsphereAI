/**
 * Server-only helper for Lovable AI Gateway.
 *
 * Uses raw fetch against the OpenAI-compatible chat endpoint. Simple JSON in,
 * JSON out — we ask for structured JSON in the prompt and parse it.
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface AiChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callAiGateway<T>({
  model,
  messages,
  temperature = 0.4,
}: {
  model: string;
  messages: AiChatMessage[];
  temperature?: number;
}): Promise<T> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "raw-fetch",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) {
      throw new Error("Rate limit reached. Please try again in a moment.");
    }
    if (res.status === 402) {
      throw new Error("AI credits exhausted. Please top up in Workspace Settings.");
    }
    throw new Error(`AI Gateway error ${res.status}: ${text || res.statusText}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned no content");

  try {
    return JSON.parse(content) as T;
  } catch {
    // Try to salvage a JSON block in case the model wrapped it.
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("AI response was not valid JSON");
  }
}
