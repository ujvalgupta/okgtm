import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { isValidEmail, normalizeEmail } from "./emailGate";

/**
 * Newsletter subscription = lead capture ("Stay Connected" form).
 * Upserts into the deduplicated leads table (one row per unique email).
 */
export const subscribeNewsletter = mutation({
  args: { email: v.string(), hp: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.hp && args.hp.length > 0) {
      return { ok: true as const }; // silent fake-ok for bots
    }
    const email = normalizeEmail(args.email);
    if (!isValidEmail(email)) {
      return { ok: false as const, error: "invalid_email" as const };
    }
    const now = Date.now();
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: now });
    } else {
      await ctx.db.insert("leads", {
        email,
        firstSource: "newsletter",
        firstSeenAt: now,
        lastSeenAt: now,
        runCount: 0,
      });
    }
    return { ok: true as const };
  },
});
