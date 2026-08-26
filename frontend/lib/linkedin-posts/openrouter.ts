import type { MindcasePost } from "./mindcase";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT =
  "You are a B2B content marketing analyst. Given a set of a person's or company's recent LinkedIn " +
  "posts, summarize their content strategy: recurring themes and topics, tone/voice, formats used " +
  "(text, image, article, repost), posting cadence, what seems to drive engagement, and any hooks " +
  "or patterns worth copying. Be specific and concise, using markdown.";

function getConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) {
    throw new Error("OPENROUTER_API_KEY / OPENROUTER_MODEL are not configured");
  }
  return { apiKey, model };
}

export async function summarizeContentStrategy(profileUrl: string, posts: MindcasePost[]): Promise<string> {
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
        { role: "user", content: `Profile: ${profileUrl}\n\nPosts (JSON):\n${JSON.stringify(posts, null, 2)}` },
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
