import type { MindcaseAd } from "./mindcase";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT =
  "You are a B2B marketing analyst. Given a set of a company's LinkedIn ads, summarize their " +
  "ad strategy: recurring messaging themes, formats used, calls to action, positioning, and any " +
  "patterns across the set. Be specific and concise, using markdown.";

function getConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) {
    throw new Error("OPENROUTER_API_KEY / OPENROUTER_MODEL are not configured");
  }
  return { apiKey, model };
}

export async function summarizeAdStrategy(companyName: string, ads: MindcaseAd[]): Promise<string> {
  const { apiKey, model } = getConfig();

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Company: ${companyName}\n\nAds (JSON):\n${JSON.stringify(ads, null, 2)}` },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenRouter response did not include message content");
  }
  return content;
}
