/**
 * Job lifecycle for the email-tool pipeline: public submission
 * (requestAnalysis), the async run (runAnalysis), and job status plumbing.
 * Raw-data strategies live in ./pipeline; per-tool config in ./toolRegistry.
 */

import {
  mutation,
  query,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { isValidEmail, normalizeEmail } from "./emailGate";
import { rateLimitCheck, globalWindowKey, globalCapAllowed } from "./rateLimits";
import { normalizeLinkedInUrl } from "./profileUrl";
import { fetchToolData } from "./pipeline";
import { emailToolConfig, isEmailTool } from "./toolRegistry";
import { structureResults } from "./llm";
import { sendResultsEmail, sendNotFoundEmail } from "./email";

/**
 * Public entry point from the tool gate forms.
 * 1. validates email format
 * 2. validates the tool is a registered email tool + normalizes its LinkedIn URL
 * 3. upserts the lead (ONE row per unique email)
 * 4. global 60s rate-limit check per email (across ALL tools)
 * 5. enqueues the async paid pipeline (mindcase -> LLM -> email)
 */
export const requestAnalysis = mutation({
  args: {
    email: v.string(),
    tool: v.string(),
    inputs: v.record(v.string(), v.string()),
    hp: v.optional(v.string()), // honeypot: bots fill hidden fields — reject silently
  },
  handler: async (ctx, args) => {
    // 0. honeypot — bots that fill the hidden field get a silent fake-ok
    if (args.hp && args.hp.length > 0) {
      return { ok: true as const, jobId: null as null };
    }

    const email = normalizeEmail(args.email);
    const now = Date.now();

    // 1. email format validation
    if (!isValidEmail(email)) {
      return { ok: false as const, error: "invalid_email" as const };
    }

    // 2. registered email tool? (the gate always sends a URL for these)
    if (!isEmailTool(args.tool)) {
      return { ok: false as const, error: "invalid_url" as const };
    }
    let inputs = { ...args.inputs };
    try {
      inputs.profileUrl = normalizeLinkedInUrl(inputs.profileUrl ?? "");
    } catch {
      return { ok: false as const, error: "invalid_url" as const };
    }

    // 3. global rate limit per email (set BEFORE the paid call fires)
    const rateRow = await ctx.db
      .query("emailRateLimits")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    const check = rateLimitCheck(rateRow?.lastCallAt, now);
    if (!check.allowed) {
      return { ok: false as const, error: "rate_limited" as const };
    }
    if (rateRow) {
      await ctx.db.patch(rateRow._id, { lastCallAt: now });
    } else {
      await ctx.db.insert("emailRateLimits", { email, lastCallAt: now });
    }

    // 3b. GLOBAL cap — max paid calls per minute across ALL users
    const windowKey = globalWindowKey(now);
    const usage = await ctx.db
      .query("apiUsage")
      .withIndex("by_window", (q) => q.eq("windowKey", windowKey))
      .first();
    if (!globalCapAllowed(usage?.count)) {
      return { ok: false as const, error: "rate_limited" as const };
    }
    if (usage) {
      await ctx.db.patch(usage._id, { count: usage.count + 1 });
    } else {
      await ctx.db.insert("apiUsage", { windowKey, count: 1 });
    }

    // 4. upsert lead (one row per unique email; only actual runs bump runCount)
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeenAt: now,
        runCount: (existing.runCount ?? 0) + 1,
      });
    } else {
      await ctx.db.insert("leads", {
        email,
        firstSource: args.tool,
        firstSeenAt: now,
        lastSeenAt: now,
        runCount: 1,
      });
    }

    // 5. enqueue the async paid pipeline
    const jobId = await ctx.db.insert("analysisJobs", {
      email,
      tool: args.tool,
      inputs,
      status: "queued",
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.jobs.runAnalysis, { jobId });

    return { ok: true as const, jobId };
  },
});

/**
 * Async paid pipeline: mindcase -> LLM structure -> clean email.
 * Runs entirely server-side; the user only ever sees "results emailed soon".
 */
export const runAnalysis = internalAction({
  args: { jobId: v.id("analysisJobs") },
  handler: async (ctx, args) => {
    const { jobId } = args;
    const job = await ctx.runQuery(internal.jobs.getJob, { jobId });
    if (!job) return;
    const inputs = job.inputs ?? {};
    const config = emailToolConfig(job.tool);
    if (!config) return;

    await ctx.runMutation(internal.jobs.updateJob, {
      jobId,
      status: "running",
    });

    try {
      const raw = await fetchToolData(config.strategy, inputs);
      const hasResults = Array.isArray(raw) && raw.length > 0;

      if (!hasResults) {
        await sendNotFoundEmail({
          to: job.email,
          toolName: config.name,
          profileUrl: inputs.profileUrl ?? "",
        });
        await ctx.runMutation(internal.jobs.updateJob, {
          jobId,
          status: "completed",
        });
        return;
      }

      // LLM layer: structure the raw third-party output (cheap model)
      const report = await structureResults(job.tool, inputs.profileUrl ?? "", raw);

      await sendResultsEmail({
        to: job.email,
        toolName: config.name,
        profileUrl: inputs.profileUrl ?? "",
        report,
      });

      await ctx.runMutation(internal.jobs.updateJob, {
        jobId,
        status: "completed",
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "unknown error";
      const message = sanitizeError(raw);
      await ctx.runMutation(internal.jobs.updateJob, {
        jobId,
        status: "failed",
        error: message,
      });
    }
  },
});

export const getJob = internalQuery({
  args: { jobId: v.id("analysisJobs") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.jobId);
  },
});

/**
 * Public status for a submitted job. Exposes ONLY the status — never the
 * inputs, email, or persisted error text. Used by the tool gate so a failed
 * run (e.g. paid API credits exhausted) surfaces a generic message instead of
 * a silent "results on their way" promise.
 */
export const getPublicJob = query({
  args: { jobId: v.id("analysisJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    return { status: job?.status ?? null };
  },
});

export const updateJob = internalMutation({
  args: {
    jobId: v.id("analysisJobs"),
    status: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
      error: args.error,
      completedAt:
        args.status === "completed" || args.status === "failed"
          ? Date.now()
          : undefined,
    });
  },
});

/** Strip anything that could be sensitive from persisted error text. */
function sanitizeError(raw: string): string {
  return raw
    .replace(/(sk-[A-Za-z0-9-]+|mk_[A-Za-z0-9_]+|re_[A-Za-z0-9]+)/g, "[REDACTED]")
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .slice(0, 500);
}
