"use client";

import { useState } from "react";
import { predictEmails, parseFullName, type PredictedEmail } from "@/lib/email-predict/patterns";
import { GENERIC_ERROR } from "@/lib/ui-copy";

interface DomainInfo {
  mxPresent: boolean;
  mxHosts?: string[];
  mxStatus?: string;
  domain?: string;
}

interface DomainInfoState {
  state: "idle" | "checking" | "ok" | "error";
  info?: DomainInfo;
  message?: string;
}

type Result =
  | { state: "empty" }
  | { state: "error"; message: string }
  | {
      state: "ok";
      name: string;
      domain: string;
      parsed: ReturnType<typeof parseFullName>;
      emails: PredictedEmail[];
    };

async function checkDomain(domain: string, set: (s: DomainInfoState) => void) {
  set({ state: "checking" });
  try {
    const res = await fetch("/api/email-predict/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      set({ state: "error", message: data?.error ?? GENERIC_ERROR });
      return;
    }
    const data = (await res.json()) as { domain: string; mxPresent: boolean; mxHosts: string[]; mxStatus?: string };
    set({ state: "ok", info: { mxPresent: data.mxPresent, mxHosts: data.mxHosts, mxStatus: data.mxStatus, domain: data.domain } });
  } catch {
    set({ state: "error", message: GENERIC_ERROR });
  }
}

function CopyButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API can be blocked; select-friendly fallback left to the user.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex h-8 shrink-0 items-center rounded-[10px] px-3 text-xs font-semibold transition-colors ${
        copied ? "bg-[#e7f6ec] text-[#177245]" : "bg-surface-strong text-body-strong hover:bg-surface-card"
      }`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function EmailPredictForm() {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<Result>({ state: "empty" });
  const [domainInfo, setDomainInfo] = useState<DomainInfoState>({ state: "idle" });

  const generate = (e?: React.FormEvent) => {
    e?.preventDefault();
    const n = name.trim();
    const d = domain.trim();
    if (!n || !d) return;

    setDomainInfo({ state: "idle" });
    const predicted = predictEmails(n, d);
    if ("error" in predicted) {
      setResult({ state: "error", message: predicted.error });
      return;
    }
    setResult({ state: "ok", name: n, domain: d, parsed: predicted.parsed, emails: predicted.emails });
    // Deliverability check runs server-side; results render instantly regardless.
    void checkDomain(d, setDomainInfo);
  };

  return (
    <div className="space-y-6">
      {/* ── Inputs ── */}
      <form onSubmit={generate} className="mx-auto w-full max-w-[760px] space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="predict-name" className="block text-center text-sm font-semibold text-ink sm:text-left">
              Full name
            </label>
            <input
              id="predict-name"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="h-12 w-full rounded-[14px] border border-hairline bg-canvas px-4 text-center text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20 sm:text-left"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="predict-domain" className="block text-center text-sm font-semibold text-ink sm:text-left">
              Company domain
            </label>
            <input
              id="predict-domain"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="acme.com"
              className="h-12 w-full rounded-[14px] border border-hairline bg-canvas px-4 text-center text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20 sm:text-left"
            />
          </div>
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!name.trim() || !domain.trim()}
            className="inline-flex h-11 items-center rounded-[12px] bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98] disabled:opacity-60"
          >
            Predict emails
          </button>
        </div>
      </form>

      {/* ── Error ── */}
      {result.state === "error" ? (
        <div className="rounded-[20px] border border-hairline bg-canvas px-6 py-6 text-center">
          <p className="text-sm font-medium text-error">{result.message}</p>
        </div>
      ) : null}

      {/* ── Results ── */}
      {result.state === "ok" ? (
        <div className="space-y-6">
          {/* Domain info */}
          <div className="flex flex-col items-center gap-3 text-center">
            {domainInfo.state === "checking" ? (
              <p className="text-xs text-muted-foreground">Checking whether {result.domain} can receive mail…</p>
            ) : null}
            {domainInfo.state === "ok" && domainInfo.info ? (
              domainInfo.info.mxPresent ? (
                <p className="rounded-full bg-[#e7f6ec] px-4 py-1.5 text-xs font-medium text-[#177245]">
                  {domainInfo.info.domain} can receive mail ({domainInfo.info.mxHosts?.length ?? 0} mail host
                  {domainInfo.info.mxHosts?.length === 1 ? "" : "s"} found)
                </p>
              ) : (
                <p className="rounded-full bg-[#fdf3dd] px-4 py-1.5 text-xs font-medium text-[#92610a]">
                  No MX records found for {domainInfo.info.domain} — emails to it would likely bounce
                </p>
              )
            ) : null}
            {domainInfo.state === "error" ? (
              <p className="text-xs text-muted-foreground">{domainInfo.message}</p>
            ) : null}
          </div>

          <div className="rounded-[20px] border border-hairline bg-canvas p-6 md:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">
                {result.emails.length} likely email{result.emails.length === 1 ? "" : "s"} for {result.name}
              </h2>
              <p className="text-xs text-muted-foreground">ranked by how common each pattern is</p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {result.emails.map((item) => (
                <div key={item.email} className="flex items-center justify-between gap-3 rounded-[14px] border border-hairline bg-surface-soft px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{item.email}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.label}
                      {item.rank === 1 ? " · most common" : ""}
                    </p>
                  </div>
                  <CopyButton email={item.email} />
                </div>
              ))}
            </div>
          </div>

          <p className="mx-auto max-w-[720px] text-center text-xs leading-relaxed text-muted-foreground">
            These are industry-standard guesses, not verified addresses. Companies pick their own pattern, so confirm
            the one that bounces back a real name before you send. Use responsibly and only for professional outreach
            to people who expect to hear from you.
          </p>
        </div>
      ) : null}
    </div>
  );
}
