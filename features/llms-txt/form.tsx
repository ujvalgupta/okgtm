"use client";

import { useRef, useState } from "react";
import type { LLMSTxtResult } from "@/features/llms-txt/engine/validator";
import { GENERIC_ERROR } from "@/lib/ui-copy";

type Phase = "idle" | "running" | "done" | "error";

const PHASES = ["Finding the file", "Validating structure", "Checking every linked URL", "Building the report"];

const STYLE: Record<string, string> = {
  PASS: "bg-[#e7f6ec] text-[#177245]",
  WARN: "bg-[#fdf3dd] text-[#92610a]",
  FAIL: "bg-[#fdeaea] text-[#b3202a]",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STYLE[status] ?? "bg-surface-strong text-body"}`}>
      {status}
    </span>
  );
}

function ResultRow({ label, status, detail }: { label: string; status: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-hairline bg-canvas px-4 py-3">
      <StatusBadge status={status} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-body">{detail}</p>
      </div>
    </div>
  );
}

export default function LlmsTxtForm() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [result, setResult] = useState<LLMSTxtResult | null>(null);
  const [checkedUrl, setCheckedUrl] = useState<string | null>(null);
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
    timerRef.current = setInterval(() => setPhaseIndex((i) => (i + 1) % PHASES.length), 2200);

    try {
      const res = await fetch("/api/llms-txt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      if (timerRef.current) clearInterval(timerRef.current);
      if (res.status === 429) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setPhase("error");
        setError(data?.error ?? "Too many checks. Try again later.");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setPhase("error");
        setError(res.status === 400 ? (data?.error ?? GENERIC_ERROR) : GENERIC_ERROR);
        return;
      }
      const data = (await res.json()) as { result: LLMSTxtResult; url: string };
      setResult(data.result);
      setCheckedUrl(data.url);
      setPhase("done");
    } catch {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("error");
      setError(GENERIC_ERROR);
    }
  };

  const fails = result ? result.checks.filter((c) => c.status === "FAIL").length : 0;
  const warns = result ? result.checks.filter((c) => c.status === "WARN").length : 0;

  return (
    <div className="space-y-6">
      <form onSubmit={run} className="mx-auto w-full max-w-[560px] space-y-3">
        <div className="space-y-2">
          <label htmlFor="llms-url" className="block text-center text-sm font-semibold text-ink">
            Your website URL
          </label>
          <input
            id="llms-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="yourcompany.com"
            className="h-12 w-full rounded-[14px] border border-hairline bg-canvas px-4 text-center text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
          <p className="text-center text-xs text-muted-foreground">Deterministic checks. No signup, nothing stored.</p>
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={phase === "running" || !input.trim()}
            className="inline-flex h-11 items-center rounded-[12px] bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98] disabled:opacity-60"
          >
            {phase === "running" ? "Checking…" : "Validate"}
          </button>
        </div>
      </form>

      {phase === "running" ? (
        <div className="rounded-[20px] border border-hairline bg-canvas px-6 py-8 text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-hairline border-t-primary" />
          <p className="text-sm font-semibold text-ink">{PHASES[phaseIndex]}</p>
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
        <div className="space-y-6">
          {/* Verdict header */}
          <div className="flex flex-col items-center rounded-[20px] border border-hairline bg-canvas px-6 py-6 text-center">
            <StatusBadge status={result.found ? (fails > 0 ? "FAIL" : warns > 0 ? "WARN" : "PASS") : "FAIL"} />
            <p className="mt-3 font-display text-xl font-semibold text-ink md:text-2xl">
              {!result.found
                ? "No llms.txt found"
                : fails === 0 && warns === 0
                  ? "Valid llms.txt"
                  : `${fails} problem${fails === 1 ? "" : "s"} and ${warns} warning${warns === 1 ? "" : "s"} found`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{checkedUrl}</p>
            {result.dumpSignal ? (
              <p className="mt-3 max-w-[640px] text-sm leading-relaxed text-body">
                This file reads like a sitemap export, not a curated list. Keep the most valuable pages, organize them
                into sections, and add a one-line description to each link.
              </p>
            ) : null}
          </div>

          {/* Structure checks */}
          <div className="grid gap-3 md:grid-cols-2">
            {result.checks.map((c) => (
              <ResultRow key={c.id} label={c.label} status={c.status} detail={c.detail} />
            ))}
          </div>

          {/* Sections */}
          {result.sections.length > 0 ? (
            <div className="rounded-[20px] border border-hairline bg-canvas p-6 md:p-8">
              <h2 className="text-left font-display text-xl font-semibold text-ink md:text-2xl">Sections</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {result.sections.map((s) => (
                  <div key={s.heading} className="rounded-[14px] bg-surface-soft px-4 py-3">
                    <p className="text-sm font-semibold text-ink">{s.heading}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.linkCount} links</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Link resolution */}
          {result.found ? (
            <div className="rounded-[20px] border border-hairline bg-canvas p-6 md:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">Linked URLs</h2>
                <p className="text-xs text-muted-foreground">
                  {result.linkCheck.ok} reachable · {result.linkCheck.broken} broken · {result.linkCheck.fetched} tested
                  {result.linkCheck.externalSkipped > 0 ? ` · ${result.linkCheck.externalSkipped} external not tested` : ""}
                </p>
              </div>
              {result.linkCheck.broken > 0 ? (
                <div className="mt-4 space-y-2">
                  {result.linkCheck.brokenLinks.slice(0, 12).map((b) => (
                    <div key={b.url} className="flex items-start gap-3 rounded-[12px] bg-[#fdeaea] px-4 py-2.5">
                      <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#b3202a]" />
                      <div className="min-w-0">
                        <p className="break-all text-xs font-semibold text-ink">{b.url}</p>
                        <p className="text-xs text-[#b3202a]">{b.error ?? (b.status ? `HTTP ${b.status}` : "unreachable")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#177245]">Every tested URL responded successfully.</p>
              )}
            </div>
          ) : null}

          {/* Raw file */}
          {result.rawContent ? (
            <details className="group rounded-[16px] border border-hairline bg-canvas px-4 py-3">
              <summary className="cursor-pointer list-none text-xs font-semibold text-muted-foreground hover:text-ink">
                <span className="group-open:hidden">Raw file ({result.filePath}) ▸</span>
                <span className="hidden group-open:inline">Raw file ({result.filePath}) ▾</span>
              </summary>
              <pre className="mt-3 max-h-[420px] overflow-auto rounded-[12px] bg-canvas px-3 py-2 text-[11px] leading-relaxed text-body">
                {result.rawContent.slice(0, 40_000)}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
