import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * OkGTM Convex schema.
 * - leads: deduplicated contact list — ONE row per unique email (upserted in
 *   code; Convex has no native unique index). The lead magnet's business value.
 * - emailRateLimits: global per-email 60s window across ALL tools (paid
 *   3rd-party protection). Also keyed by email.
 * - analysisJobs: one row per RUN (the activity log) with abstracted inputs,
 *   so future tools with different input shapes need no schema change.
 */
export default defineSchema({
  leads: defineTable({
    email: v.string(),
    firstSource: v.string(), // tool slug or "newsletter" that first captured them
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    runCount: v.number(), // how many tool runs this email has triggered
  }).index("by_email", ["email"]),

  emailRateLimits: defineTable({
    email: v.string(),
    lastCallAt: v.number(), // epoch ms of last successful paid third-party trigger
  }).index("by_email", ["email"]),

  apiUsage: defineTable({
    windowKey: v.string(), // "usage-<minuteTimestamp>"
    count: v.number(),
  }).index("by_window", ["windowKey"]),

  analysisJobs: defineTable({
    email: v.string(), // join key to leads (email is unique there)
    tool: v.string(),
    inputs: v.record(v.string(), v.string()), // per-tool input map, e.g. { profileUrl } | { company }
    status: v.string(), // "queued" | "running" | "completed" | "failed"
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_tool", ["tool"]),
});
