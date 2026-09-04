/**
 * Guards the Convex email-tool registry against drift from the features side.
 *
 * Convex is a self-contained deployment unit and cannot import features/
 * metas, so convex/toolRegistry.ts mirrors the email tools' slugs and display
 * names. If the two sides disagree (a tool renamed, added, or moved between
 * families), these tests fail and the mirror is fixed deliberately.
 */

import { describe, expect, it } from "vitest";
import { toolMetas } from "@/features/tools";
import { EMAIL_TOOL_CONFIG, emailToolConfig, isEmailTool } from "../../convex/toolRegistry";

describe("convex email-tool registry vs features meta", () => {
  const emailTools = toolMetas.filter((t) => t.family === "email");
  const instantTools = toolMetas.filter((t) => t.family === "instant");

  it("covers exactly the email tools from features", () => {
    const slugs = emailTools.map((t) => t.slug).sort();
    expect(Object.keys(EMAIL_TOOL_CONFIG).sort()).toEqual(slugs);
  });

  it("mirrors each email tool's display name exactly", () => {
    for (const tool of emailTools) {
      expect(emailToolConfig(tool.slug)?.name).toBe(tool.name);
    }
  });

  it("rejects instant tools and unknown slugs as pipeline tools", () => {
    for (const tool of instantTools) {
      expect(isEmailTool(tool.slug)).toBe(false);
      expect(emailToolConfig(tool.slug)).toBeUndefined();
    }
    expect(isEmailTool("definitely-not-a-tool")).toBe(false);
  });
});
