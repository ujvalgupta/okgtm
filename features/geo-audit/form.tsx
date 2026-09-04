"use client";

import { useRef, useState } from "react";
import type { GeoAuditResult, GeoCheckResult } from "@/features/geo-audit/engine/types";
import { GENERIC_ERROR } from "@/lib/ui-copy";

type Phase = "idle" | "running" | "done" | "error";

const PHASES = [
  "Fetching the page and following redirects",
  "Reading robots.txt and simulating AI crawlers",
  "Parsing JSON-LD, E-E-A-T and Open Graph",
  "Checking canonical, sitemap and llms.txt",
  "Sampling other pages on the site",
  "Scoring and building fixes",
];

const STATUS_STYLE: Record<string, string> = {
  PASS: "bg-[#e7f6ec] text-[#177245]",
  WARNING: "bg-[#fdf3dd] text-[#92610a]",
  FAIL: "bg-[#fdeaea] text-[#b3202a]",
  SKIPPED: "bg-surface-strong text-body",
};

/** Engine text can contain em dashes — the brand copy style does not. */
function clean(s: string): string {
  return (s ?? "").replace(/\s+—\s+/g, ", ").replace(/—/g, "-").trim();
}

function StatusBadge({ status }: { status: GeoCheckResult["status"] }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status] ?? "bg-surface-strong text-body"}`}>
      {status === "SKIPPED" ? "Not assessed" : status}
    </span>
  );
}

function metadataRows(metadata: Record<string, unknown>): { label: string; value: string }[] {
  const SKIP = new Set(["simulations", "pages", "redirectChain", "evaluations", "fieldChecks", "signals", "textSample"]);
  const out: { label: string; value: string }[] = [];
  for (const [k, v] of Object.entries(metadata)) {
    if (SKIP.has(k) || v === undefined || v === null) continue;
    let value: string;
    if (typeof v === "boolean") value = v ? "yes" : "no";
    else if (typeof v === "number" || typeof v === "string") value = String(v);
    else if (Array.isArray(v)) {
      const prims = v.filter((x) => typeof x !== "object");
      value = prims.slice(0, 6).join(", ") + (prims.length < v.length ? ` (+${v.length - prims.length} more)` : "");
    } else value = JSON.stringify(v).slice(0, 220);
    if (!value) continue;
    out.push({ label: k.replace(/([a-z])([A-Z])/g, "$1 $2"), value });
  }
  return out.slice(0, 12);
}

function CheckRow({ check }: { check: GeoCheckResult }) {
  const [open, setOpen] = useState(false);
  const rows = metadataRows(check.metadata);
  return (
    <div className="rounded-[16px] border border-hairline bg-canvas">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <StatusBadge status={check.status} />
        <span className="flex-1">
          <span className="block text-sm font-semibold text-ink">{check.title}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-body">{clean(check.reason)}</span>
        </span>
        <span className={`mt-1 text-xs text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-hairline-soft px-4 py-3">
          {check.recommendation ? (
            <p className="text-sm leading-relaxed text-body">
              <span className="font-semibold text-ink">Fix: </span>
              {clean(check.recommendation)}
            </p>
          ) : null}
          {rows.length ? (
            <details className="group">
              <summary className="cursor-pointer list-none text-xs font-semibold text-muted-foreground hover:text-ink">
                <span className="group-open:hidden">Technical detail ▸</span>
                <span className="hidden group-open:inline">Technical detail ▾</span>
              </summary>
              <dl className="mt-2 space-y-1.5">
                {rows.map((r) => (
                  <div key={r.label} className="flex gap-3 text-xs">
                    <dt className="w-36 shrink-0 text-muted-foreground">{r.label}</dt>
                    <dd className="min-w-0 break-words text-body">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ScoreHero({ result }: { result: GeoAuditResult }) {
  const { score, classification, overallStatus } = result;
  const color = score >= 80 ? "text-[#177245]" : score >= 60 ? "text-[#92610a]" : score >= 40 ? "text-[#b9790a]" : "text-error";
  const skipped = result.checks.filter((c) => c.status === "SKIPPED").length;
  const failing = result.checks.filter((c) => c.status === "FAIL").length;
  const warning = result.checks.filter((c) => c.status === "WARNING").length;
  const passing = result.checks.filter((c) => c.status === "PASS").length;

  const facts: { label: string; value: string }[] = [
    { label: "Status", value: overallStatus },
    { label: "Checked", value: result.url },
    { label: "Duration", value: `${(result.durationMs / 1000).toFixed(1)}s` },
    { label: "Checks", value: `${result.checks.length} (${passing} pass, ${warning} warn, ${failing} fail${skipped ? `, ${skipped} not assessed` : ""})` },
  ];

  return (
    <div className="rounded-[24px] bg-surface-card p-6 md:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="flex items-end gap-3">
            <span className={`font-display text-[88px] font-medium leading-none tracking-tight md:text-[104px] ${color}`}>
              {score}
            </span>
            <span className="mb-3 text-sm font-semibold text-muted-foreground">/ 100</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-ink">{classification}</p>
        </div>
        <div className="mx-auto w-full max-w-[560px] lg:mx-0 lg:max-w-none lg:shrink-0">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:w-[480px]">
            {facts.map((f) => (
              <div key={f.label} className="flex flex-col rounded-[12px] bg-canvas px-3 py-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                <dd className={`mt-0.5 text-sm text-body ${f.label === "Checked" ? "break-all" : ""}`}>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      {skipped > 0 ? (
        <p className="mt-6 rounded-[12px] bg-canvas px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          Two browser-only checks (JavaScript rendering, Core Web Vitals) need a real browser to run, so they were not
          assessed and are excluded from the score. Use Lighthouse or PageSpeed Insights for those.
        </p>
      ) : null}
    </div>
  );
}

function CategoryBars({ result }: { result: GeoAuditResult }) {
  return (
    <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {result.categories.map((cat) => {
        const pct = Math.round(cat.score * 100);
        const fill = cat.available ? (pct >= 75 ? "bg-[#2e8b57]" : pct >= 40 ? "bg-[#d99a1b]" : "bg-[#c0392b]") : "bg-surface-strong";
        return (
          <div key={cat.key}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-ink">
                {cat.label}
                {!cat.available ? <span className="ml-2 text-xs font-normal text-muted-foreground">not assessed</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">{cat.available ? `${pct}% · ${cat.weight}% of score` : "excluded from score"}</p>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-strong">
              <div className={`h-full rounded-full ${fill}`} style={{ width: `${cat.available ? pct : 0}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GeoAuditForm() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [result, setResult] = useState<GeoAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = input.trim();
    if (!value) return;
    setResult(null);
    setError(null);
    setPhase("running");
    setPhaseIndex(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setPhaseIndex((i) => (i + 1) % PHASES.length), 1800);

    try {
      const res = await fetch("/api/geo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      if (timerRef.current) clearInterval(timerRef.current);
      if (res.status === 429) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setPhase("error");
        setError(data?.error ?? "Too many audits. Try again later.");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setPhase("error");
        setError(res.status === 400 ? (data?.error ?? GENERIC_ERROR) : GENERIC_ERROR);
        return;
      }
      const data = (await res.json()) as { report: GeoAuditResult };
      setResult(data.report);
      setPhase("done");
    } catch {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("error");
      setError(GENERIC_ERROR);
    }
  };

  const issues = result?.topIssues ?? [];

  return (
    <div className="space-y-6">
      <form onSubmit={run} className="mx-auto w-full max-w-[560px] space-y-3">
        <div className="space-y-2">
          <label htmlFor="geo-url" className="block text-center text-sm font-semibold text-ink">
            Your website URL
          </label>
          <input
            id="geo-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="yourcompany.com or a full page URL"
            className="h-12 w-full rounded-[14px] border border-hairline bg-canvas px-4 text-center text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
          <p className="text-center text-xs text-muted-foreground">
            Deterministic checks only. No signup, nothing stored.
          </p>
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={phase === "running" || !input.trim()}
            className="inline-flex h-11 items-center rounded-[12px] bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98] disabled:opacity-60"
          >
            {phase === "running" ? "Checking…" : "Run check"}
          </button>
        </div>
      </form>

      {phase === "running" ? (
        <div className="rounded-[20px] border border-hairline bg-canvas px-6 py-8 text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-hairline border-t-primary" />
          <p className="text-sm font-semibold text-ink">{PHASES[phaseIndex]}</p>
          <p className="mx-auto mt-1 max-w-[420px] text-xs text-muted-foreground">
            Usually under 15 seconds.
          </p>
        </div>
      ) : null}

      {phase === "error" && error ? (
        <div className="rounded-[20px] border border-hairline bg-canvas px-6 py-6 text-center">
          <p className="text-sm font-medium text-error">{error}</p>
          <button type="button" onClick={() => setPhase("idle")} className="mt-3 text-sm font-semibold text-ink underline underline-offset-4">
            Try again
          </button>
        </div>
      ) : null}

      {result && phase === "done" ? (
        <div className="space-y-8">
          <ScoreHero result={result} />
          <div className="rounded-[20px] border border-hairline bg-canvas p-6 md:p-8">
            <h2 className="mb-5 text-left font-display text-xl font-semibold text-ink md:text-2xl">Module breakdown</h2>
            <CategoryBars result={result} />
          </div>

          {issues.length ? (
            <section aria-label="What to fix first">
              <h2 className="text-left font-display text-xl font-semibold text-ink md:text-2xl">What to fix first</h2>
              <div className="mt-4 grid items-start gap-3 lg:grid-cols-2">
                {issues.map((issue) => (
                  <div key={`${issue.id}-${issue.status}`} className="rounded-[16px] border border-hairline bg-canvas p-4">
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${issue.severity === "HIGH" ? "bg-[#c0392b]" : "bg-[#d99a1b]"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">{issue.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-body">{clean(issue.what)}</p>
                        <p className="mt-2 text-sm leading-relaxed text-body">
                          <span className="font-semibold text-ink">Fix: </span>
                          {clean(issue.fix)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section aria-label="Full report">
            <h2 className="text-left font-display text-xl font-semibold text-ink md:text-2xl">All checks</h2>
            <div className="mt-4 space-y-3">
              {result.checks.map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
            </div>
          </section>

          <details className="group rounded-[16px] border border-hairline bg-canvas px-4 py-3">
            <summary className="cursor-pointer list-none text-xs font-semibold text-muted-foreground hover:text-ink">
              <span className="group-open:hidden">Raw JSON report ▸</span>
              <span className="hidden group-open:inline">Raw JSON report ▾</span>
            </summary>
            <pre className="mt-3 max-h-[420px] overflow-auto rounded-[12px] bg-canvas px-3 py-2 text-[11px] leading-relaxed text-body">
              {JSON.stringify(result, null, 2).slice(0, 60_000)}
            </pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}
