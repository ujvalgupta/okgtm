/**
 * LLM layer between the third-party response and the email shown to the user.
 * Cheap model via OpenRouter (deepseek/deepseek-v4-flash).
 */

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** Strip markdown/LLM artifacts that would look like junk in an email:
 *  bold/italic markers, emphasis, list bullets, stray dashes, code fences. */
export function cleanForEmail(text: string): string {
  return text
    .replace(/\*\*|__/g, "") // bold/italic markers
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, (m) => m.replace(/`/g, "")) // inline code fences
    .replace(/^\s*[-*+]\s+/gm, "") // list bullets
    .replace(/^\s*#{1,6}\s*/gm, "") // headings
    .replace(/[ \t]{2,}/g, " ") // double spaces
    .replace(/\n{3,}/g, "\n\n") // collapse blank lines
    .trim();
}

export async function structureResults(
  tool: string,
  profileUrl: string,
  raw: unknown
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) throw new Error("OPENROUTER_API_KEY / OPENROUTER_MODEL not configured");

  const systemPrompt =
    "You are a B2B GTM analyst. Structure the raw tool output into a clean, " +
    "scannable plain-text report for a founder/CMO. Use short sections with " +
    "plain labels (no markdown, no bold, no asterisks, no bullet dashes). " +
    "If the raw output contains NO real results (empty, no data), reply exactly " +
    "with: NOT_FOUND";

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Tool: ${tool}\nProfile: ${profileUrl}\n\nRaw output:\n${JSON.stringify(raw, null, 2)}`,
        },
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
  return cleanForEmail(content);
}
