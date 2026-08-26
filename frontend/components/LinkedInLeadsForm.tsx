"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { LINKEDIN_LEADS_CONFIG } from "@/config/linkedin-leads";

type Step = "idle" | "loading" | "email" | "otp" | "analyzing" | "results";
type AnalyzingPhase = "posts" | "comments";

interface CommentJobRef {
  postUrl: string;
  postedDate: string | null;
  commentJobId: string;
}

interface Lead {
  commenterName: string;
  commenterUrl: string;
  commenterHeadline?: string | null;
  comment: string;
  commentedAt?: string | null;
  postUrl: string;
  postedDate: string | null;
}

interface AnalysisResult {
  profileUrl: string;
  leads: Lead[];
}

export interface LinkedInLeadsFormProps {
  inputLabel: string;
  inputPlaceholder: string;
  submitLabel: string;
  scanningMessage: string;
  analyzingPostsMessage: string;
  analyzingCommentsMessage: string;
  emptyStateMessage: string;
  resultsHeadingPrefix: string;
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function LinkedInLeadsForm(props: LinkedInLeadsFormProps) {
  const [step, setStep] = useState<Step>("idle");
  const [analyzingPhase, setAnalyzingPhase] = useState<AnalyzingPhase>("posts");
  const [profileUrl, setProfileUrl] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const loaderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      if (loaderTimer.current) clearTimeout(loaderTimer.current);
      cancelledRef.current = true;
    };
  }, []);

  function handleStart(e: FormEvent) {
    e.preventDefault();
    if (!profileUrl.trim()) return;
    setError(null);
    setStep("loading");
    loaderTimer.current = setTimeout(() => {
      if (LINKEDIN_LEADS_CONFIG.requireEmailVerification) {
        setStep("email");
      } else {
        void runAnalysis();
      }
    }, LINKEDIN_LEADS_CONFIG.fakeLoaderDelayMs);
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);

    try {
      const res = await fetch("/api/linkedin-leads/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, profileUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Could not send a verification code");
      }
      setToken(data.token);
      setStep("otp");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    void runAnalysis();
  }

  async function pollStatus(url: string, jobId: string) {
    let phase: AnalyzingPhase = "posts";
    let commentJobs: CommentJobRef[] = [];

    for (let attempt = 1; attempt <= LINKEDIN_LEADS_CONFIG.maxPollAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, LINKEDIN_LEADS_CONFIG.pollIntervalMs));
      if (cancelledRef.current) return;

      const body = phase === "posts" ? { phase, profileUrl: url, jobId } : { phase, profileUrl: url, commentJobs };

      const res = await fetch("/api/linkedin-leads/analyze/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Analysis failed");
      }

      if (data.status === "completed") {
        setResult(data);
        setStep("results");
        return;
      }

      if (data.phase === "comments" && phase === "posts") {
        phase = "comments";
        commentJobs = data.commentJobs;
        setAnalyzingPhase("comments");
      }
    }
    throw new Error("This is taking longer than expected. Please try again in a bit.");
  }

  async function runAnalysis() {
    setError(null);
    setStep("analyzing");
    setAnalyzingPhase("posts");

    try {
      const res = await fetch("/api/linkedin-leads/analyze/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, profileUrl, code, token }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Could not start analysis");
      }
      await pollStatus(data.profileUrl, data.jobId);
    } catch (err) {
      setError((err as Error).message);
      setStep(LINKEDIN_LEADS_CONFIG.requireEmailVerification ? "otp" : "idle");
    }
  }

  if (step === "results" && result) {
    return (
      <div className="space-y-6">
        <div>
          <span className="inline-flex items-center rounded-pill bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            {result.leads.length} leads found
          </span>
          <h2 className="mt-3 font-display text-2xl font-medium tracking-tight text-ink">
            {props.resultsHeadingPrefix} {result.profileUrl}
          </h2>
        </div>

        {result.leads.length === 0 ? (
          <div className="rounded-[16px] border border-hairline bg-canvas p-6 text-sm leading-relaxed text-body">
            {props.emptyStateMessage}
          </div>
        ) : (
          <div className="grid gap-4">
            {result.leads.map((lead) => {
              const date = formatDate(lead.commentedAt ?? lead.postedDate);
              return (
                <div className="rounded-[16px] border border-hairline bg-canvas p-6 space-y-3" key={`${lead.postUrl}-${lead.commenterUrl}`}>
                  <h4 className="text-base font-semibold text-ink">{lead.commenterName}</h4>
                  {lead.commenterHeadline && (
                    <span className="inline-flex rounded-pill bg-surface-card px-3 py-1 text-xs font-medium text-muted-foreground">
                      {lead.commenterHeadline}
                    </span>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">&ldquo;{lead.comment}&rdquo;</p>
                  {date && (
                    <span className="inline-flex rounded-pill bg-surface-card px-3 py-1 text-xs font-medium text-muted-foreground">
                      {date}
                    </span>
                  )}
                  <div className="flex gap-2">
                    <a
                      href={lead.commenterUrl}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex h-9 items-center rounded-[12px] border border-hairline bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-soft active:scale-[0.98]"
                    >
                      View profile
                    </a>
                    <a
                      href={lead.postUrl}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex h-9 items-center rounded-[12px] border border-hairline bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-soft active:scale-[0.98]"
                    >
                      View post
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (step === "loading" || step === "analyzing") {
    const message =
      step === "loading"
        ? props.scanningMessage
        : analyzingPhase === "posts"
          ? props.analyzingPostsMessage
          : props.analyzingCommentsMessage;
    return (
      <div className="flex flex-col items-center justify-center rounded-[16px] border border-hairline bg-canvas px-6 py-16 text-center">
        <div className="tool-spinner" />
        <p className="mt-5 text-sm leading-relaxed text-body">{message}</p>
      </div>
    );
  }

  if (step === "email") {
    return (
      <form className="rounded-[16px] border border-hairline bg-canvas p-6 md:p-8" onSubmit={handleEmailSubmit}>
        <p className="text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground">One more step</p>
        <p className="mt-3 mb-5 text-sm leading-relaxed text-body">
          Enter your email and we&apos;ll send a code to verify it before running the analysis.
        </p>
        {error && <p className="mb-4 text-sm font-medium text-error">{error}</p>}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink" htmlFor="leads-email">
            Email
          </label>
          <input
            id="leads-email"
            className="h-11 w-full rounded-[12px] border border-hairline bg-canvas px-4 text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98]"
        >
          Send code
        </button>
      </form>
    );
  }

  if (step === "otp") {
    return (
      <form className="rounded-[16px] border border-hairline bg-canvas p-6 md:p-8" onSubmit={handleOtpSubmit}>
        <p className="text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground">Verify your email</p>
        <p className="mt-3 mb-5 text-sm leading-relaxed text-body">We sent a 6-digit code to {email}.</p>
        {error && <p className="mb-4 text-sm font-medium text-error">{error}</p>}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink" htmlFor="leads-code">
            Verification code
          </label>
          <input
            id="leads-code"
            className="h-11 w-full rounded-[12px] border border-hairline bg-canvas px-4 text-center text-lg font-semibold tracking-[0.3em] text-ink placeholder:text-muted-soft placeholder:tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-ink/20"
            inputMode="numeric"
            maxLength={6}
            required
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <button
          type="submit"
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98]"
        >
          Verify &amp; analyze
        </button>
      </form>
    );
  }

  return (
    <form className="rounded-[16px] border border-hairline bg-canvas p-6 md:p-8" onSubmit={handleStart}>
      {error && <p className="mb-4 text-sm font-medium text-error">{error}</p>}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-ink" htmlFor="leads-profile-url">
          {props.inputLabel}
        </label>
        <input
          id="leads-profile-url"
          className="h-11 w-full rounded-[12px] border border-hairline bg-canvas px-4 text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
          type="text"
          required
          placeholder={props.inputPlaceholder}
          value={profileUrl}
          onChange={(e) => setProfileUrl(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98]"
      >
        {props.submitLabel}
      </button>
    </form>
  );
}
