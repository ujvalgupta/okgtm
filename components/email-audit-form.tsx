"use client";

import { useRef, useState } from "react";
import type { AuditResult, CheckResult } from "@/lib/email-audit/types";
import { GENERIC_ERROR } from "@/lib/ui-copy";

type Phase = "idle" | "running" | "done" | "error";

const SCAN_PHASES = [
  "Checking MX and mail routing",
  "Parsing SPF policy and lookup chain",
  "Probing DKIM selectors",
  "Reading DMARC policy and reporting",
  "Verifying MTA-STS and TLS-RPT",
  "Checking DNSSEC and reverse DNS",
];

const STATUS_STYLE: Record<string, string> = {
  PASS: "bg-[#e7f6ec] text-[#177245]",
  WARN: "bg-[#fdf3dd] text-[#92610a]",
  FAIL: "bg-[#fdeaea] text-[#b3202a]",
  INFO: "bg-surface-strong text-body",
  UNKNOWN: "bg-surface-strong text-body",
};

const SEVERITY_LABEL: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  INFO: "Info",
};

function StatusBadge({ status }: { status: CheckResult["status"] }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        STATUS_STYLE[status] ?? "bg-surface-strong text-body"
      }`}
    >
      {status === "UNKNOWN" ? "?" : status}
    </span>
  );
}

function EvidenceList({ evidence }: { evidence: CheckResult["evidence"] }) {
  if (!evidence.length) return <p className="text-sm text-muted-foreground">No evidence recorded.</p>;
  return (
    <ul className="space-y-2">
      {evidence.map((ev, i) => (
        <li key={i} className="text-sm">
          <p className="font-medium text-body-strong">
            {ev.type === "DNS_RECORD" ? "DNS" : ev.type === "HTTP_RESPONSE" ? "HTTPS" : "Derived"} · {ev.source}
          </p>
          {ev.value ? (
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all rounded-[10px] bg-canvas px-3 py-2 text-xs leading-relaxed text-body">
              {ev.value}
            </pre>
          ) : null}
          {ev.explanation ? <p className="mt-1 text-xs text-muted-foreground">{ev.explanation}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function CheckRow({ check, defaultOpen }: { check: CheckResult; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
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
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {check.category} · {SEVERITY_LABEL[check.severity] ?? check.severity}
          </span>
        </span>
        <span className={`mt-1 text-xs text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-hairline-soft px-4 py-3">
          <p className="text-sm leading-relaxed text-body">{check.summary}</p>
          {check.recommendation ? (
            <p className="text-sm leading-relaxed text-body">
              <span className="font-semibold text-ink">Recommendation: </span>
              {check.recommendation}
            </p>
          ) : null}
          {check.exactFix ? (
            <div className="rounded-[12px] bg-surface-soft px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-body-strong">Exact fix</p>
              <p className="mt-1 text-xs text-muted-foreground">{check.exactFix.instructions}</p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-[10px] bg-canvas px-3 py-2 text-xs text-body">
                {check.exactFix.recordType} @ {check.exactFix.hostname}
                {"\n"}
                {check.exactFix.value}
              </pre>
            </div>
          ) : null}
          <details className="group">
            <summary className="cursor-pointer list-none text-xs font-semibold text-muted-foreground hover:text-ink">
              <span className="group-open:hidden">Technical evidence ▸</span>
              <span className="hidden group-open:inline">Technical evidence ▾</span>
            </summary>
            <div className="mt-2">
              <EvidenceList evidence={check.evidence} />
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}

function ScoreHero({ result }: { result: AuditResult }) {
  const { score, grade } = result;
  const scoreColor =
    score >= 90 ? "text-[#177245]" : score >= 75 ? "text-[#92610a]" : score >= 50 ? "text-[#b9790a]" : "text-error";

  const chips: { label: string; value: number; cls: string }[] = [
    { label: "Critical", value: result.summary.critical, cls: "text-[#b3202a]" },
    { label: "High", value: result.summary.high, cls: "text-[#b3202a]" },
    { label: "Medium", value: result.summary.medium, cls: "text-[#92610a]" },
    { label: "Low", value: result.summary.low, cls: "text-[#92610a]" },
    { label: "Info", value: result.summary.info, cls: "text-body" },
    { label: "Uncertain", value: result.summary.unknown, cls: "text-body" },
  ];

  return (
    <div className="rounded-[24px] bg-surface-card p-6 md:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: the number, grade, provider */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="flex items-end gap-3">
            <span className={`font-display text-[88px] font-medium leading-none tracking-tight md:text-[104px] ${scoreColor}`}>
              {score}
            </span>
            <span className="mb-3 text-sm font-semibold text-muted-foreground">/ 100</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-ink">{grade}</p>
          {result.provider ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Detected provider:{" "}
              <span className="font-semibold text-body-strong">{result.provider.name}</span>
              <span className="ml-1 text-xs">({Math.round(result.provider.confidence * 100)}% confidence)</span>
            </p>
          ) : null}
        </div>

        {/* Right: finding counts + meta */}
        <div className="mx-auto w-full max-w-[520px] lg:mx-0 lg:max-w-none lg:shrink-0">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[420px]">
            {chips.map((c) => (
              <div key={c.label} className="rounded-[12px] bg-canvas px-3 py-2 text-center">
                <p className={`text-lg font-bold leading-none ${c.cls}`}>{c.value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>
          <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 font-semibold text-body-strong">Domain</dt>
              <dd className="min-w-0 break-all">{result.normalizedDomain}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 font-semibold text-body-strong">Duration</dt>
              <dd>{(result.durationMs / 1000).toFixed(1)}s</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 font-semibold text-body-strong">Schema</dt>
              <dd>{result.schemaVersion}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default function EmailAuditForm() {
  const [domain, setDomain] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runAudit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = domain.trim();
    if (!value) return;
    setResult(null);
    setError(null);
    setPhase("running");
    setPhaseIndex(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setPhaseIndex((i) => (i + 1) % SCAN_PHASES.length),
      1400
    );

    try {
      const res = await fetch("/api/email-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: value }),
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
        // 400 responses carry helpful validation copy (already handled).
        // Anything else is a generic server failure → generic message only.
        setPhase("error");
        setError(res.status === 400 ? (data?.error ?? GENERIC_ERROR) : GENERIC_ERROR);
        return;
      }
      const data = (await res.json()) as AuditResult;
      setResult(data);
      setPhase("done");
    } catch {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("error");
      setError(GENERIC_ERROR);
    }
  };

  const actionItems = result
    ? result.checks.filter((c) => c.status === "FAIL" || c.status === "WARN")
    : [];
  const topItems = actionItems.slice(0, 4);
  const passChecks = result ? result.checks.filter((c) => c.status === "PASS") : [];
  const unknownCount = result ? result.checks.filter((c) => c.status === "UNKNOWN").length : 0;

  return (
    <div className="space-y-6">
      {/* ── Input ── */}
      <form onSubmit={runAudit} className="mx-auto w-full max-w-[560px] space-y-3">
        <div className="space-y-2">
          <label htmlFor="audit-domain" className="block text-center text-sm font-semibold text-ink">
            Your domain
          </label>
          <input
            id="audit-domain"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="yourcompany.com"
            className="h-12 w-full rounded-[14px] border border-hairline bg-canvas px-4 text-center text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
          <p className="text-center text-xs text-muted-foreground">
            Paste a bare domain or a full URL. No signup, no email required.
          </p>
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={phase === "running" || !domain.trim()}
            className="inline-flex h-11 items-center rounded-[12px] bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98] disabled:opacity-60"
          >
            {phase === "running" ? "Auditing…" : "Run audit"}
          </button>
        </div>
      </form>

      {/* ── Running ── */}
      {phase === "running" ? (
        <div className="rounded-[20px] border border-hairline bg-canvas px-6 py-8 text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-hairline border-t-primary" />
          <p className="text-sm font-semibold text-ink">{SCAN_PHASES[phaseIndex]}</p>
          <p className="mx-auto mt-1 max-w-[420px] text-xs text-muted-foreground">
            Live public DNS checks only. Usually under 10 seconds.
          </p>
        </div>
      ) : null}

      {/* ── Error ── */}
      {phase === "error" && error ? (
        <div className="rounded-[20px] border border-hairline bg-canvas px-6 py-6 text-center">
          <p className="text-sm font-medium text-error">{error}</p>
          <button
            type="button"
            onClick={() => setPhase("idle")}
            className="mt-3 text-sm font-semibold text-ink underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : null}

      {/* ── Results ── */}
      {result && phase === "done" ? (
        <div className="space-y-8">
          <ScoreHero result={result} />

          {unknownCount > 0 ? (
            <p className="text-center text-xs text-muted-foreground">
              {unknownCount} area{unknownCount > 1 ? "s" : ""} could not be resolved over DNS and were not counted
              for or against your score.
            </p>
          ) : null}

          {/* Top issues */}
          {topItems.length > 0 ? (
            <section aria-label="Top findings">
              <h2 className="text-left font-display text-xl font-semibold text-ink md:text-2xl">
                What to fix first
              </h2>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {topItems.map((c) => (
                  <CheckRow key={c.id} check={c} defaultOpen />
                ))}
              </div>
            </section>
          ) : (
            <section aria-label="No issues">
              <div className="rounded-[20px] bg-surface-card px-6 py-8 text-center">
                <p className="font-display text-lg font-semibold text-ink">No failing checks</p>
                <p className="mx-auto mt-2 max-w-[460px] text-sm leading-relaxed text-body">
                  Your published DNS email infrastructure looks well configured. Review the full report below for
                  optional hardening.
                </p>
              </div>
            </section>
          )}

          {/* All checks */}
          <section aria-label="Full report">
            <h2 className="text-left font-display text-xl font-semibold text-ink md:text-2xl">Full report</h2>
            <div className="mt-4 space-y-3">
              {result.checks.map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
            </div>
          </section>

          {passChecks.length > 0 ? (
            <p className="text-center text-xs text-muted-foreground">
              {passChecks.length} check{passChecks.length > 1 ? "s" : ""} passed. Score reflects only what DNS can
              prove; see the fine print below.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
