"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { LINKEDIN_ADS_CONFIG } from "@/config/linkedin-ads";

type Step = "idle" | "loading" | "email" | "otp" | "analyzing" | "results";

interface AdResult {
  adUrl: string;
  adId: string;
  advertiserUrl: string;
  format?: string | null;
  headline?: string | null;
  body?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  started?: string | null;
  ended?: string | null;
  impressions?: string | null;
}

interface AnalysisResult {
  companyName: string;
  ads: AdResult[];
  summary: string;
}

export default function AdSpyForm() {
  const [step, setStep] = useState<Step>("idle");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);
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
    if (!companyName.trim()) return;
    setError(null);
    setStep("loading");
    loaderTimer.current = setTimeout(() => {
      if (LINKEDIN_ADS_CONFIG.requireEmailVerification) {
        setStep("email");
      } else {
        void runAnalysis();
      }
    }, LINKEDIN_ADS_CONFIG.fakeLoaderDelayMs);
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);

    try {
      const res = await fetch("/api/linkedin-ads/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyName }),
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

  async function pollStatus(jobId: string, name: string) {
    for (let attempt = 1; attempt <= LINKEDIN_ADS_CONFIG.maxPollAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, LINKEDIN_ADS_CONFIG.pollIntervalMs));
      if (cancelledRef.current) return;
      setPollAttempt(attempt);

      const res = await fetch(
        `/api/linkedin-ads/analyze/status?jobId=${encodeURIComponent(jobId)}&companyName=${encodeURIComponent(name)}`,
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Analysis failed");
      }
      if (data.status === "completed") {
        setResult(data);
        setStep("results");
        return;
      }
    }
    throw new Error("This is taking longer than expected. Please try again in a bit.");
  }

  async function runAnalysis() {
    setError(null);
    setStep("analyzing");
    setPollAttempt(0);

    try {
      const res = await fetch("/api/linkedin-ads/analyze/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyName, code, token }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Could not start analysis");
      }
      await pollStatus(data.jobId, data.companyName);
    } catch (err) {
      setError((err as Error).message);
      setStep(LINKEDIN_ADS_CONFIG.requireEmailVerification ? "otp" : "idle");
    }
  }

  if (step === "results" && result) {
    return (
      <div className="space-y-6">
        <div>
          <span className="inline-flex items-center rounded-pill bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            {result.ads.length} ads found
          </span>
          <h2 className="mt-3 font-display text-2xl font-medium tracking-tight text-ink">
            {result.companyName}
          </h2>
        </div>

        <div className="whitespace-pre-wrap rounded-[16px] border border-hairline bg-canvas p-6 text-sm leading-relaxed text-body">
          {result.summary}
        </div>

        {result.ads.length === 0 ? (
          <div className="rounded-[16px] border border-hairline bg-canvas p-6 text-sm leading-relaxed text-body">
            No ads found for &ldquo;{result.companyName}&rdquo;. The LinkedIn Ad Library
            matches the exact advertiser name, so try the name exactly as it appears on
            the ad (for example &ldquo;HubSpot, Inc.&rdquo;), or a broader version of the
            company name.
          </div>
        ) : (
        <div className="grid gap-4">
          {result.ads.map((ad) => (
            <div className="rounded-[16px] border border-hairline bg-canvas p-6 space-y-3" key={ad.adId}>
              {ad.format && (
                <span className="inline-flex rounded-pill bg-surface-card px-3 py-1 text-xs font-medium text-ink">
                  {ad.format}
                </span>
              )}
              {ad.headline && <h4 className="text-base font-semibold text-ink">{ad.headline}</h4>}
              {ad.body && <p className="text-sm leading-relaxed text-body">{ad.body}</p>}
              <div>
                <a
                  href={ad.adUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-9 items-center rounded-[12px] border border-hairline bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-soft active:scale-[0.98]"
                >
                  View ad
                </a>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    );
  }

  if (step === "loading" || step === "analyzing") {
    const elapsedSeconds = Math.round((pollAttempt * LINKEDIN_ADS_CONFIG.pollIntervalMs) / 1000);
    return (
      <div className="flex flex-col items-center justify-center rounded-[16px] border border-hairline bg-canvas px-6 py-16 text-center">
        <div className="tool-spinner" />
        <p className="mt-5 text-sm leading-relaxed text-body">
          {step === "loading"
            ? "Scanning LinkedIn Ad Library…"
            : `Analyzing ad strategy… this can take a couple of minutes (${elapsedSeconds}s)`}
        </p>
      </div>
    );
  }

  if (step === "email") {
    return (
      <form onSubmit={handleEmailSubmit}>
        <p className="text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground">One more step</p>
        <p className="mt-3 mb-5 text-sm leading-relaxed text-body">
          Enter your email and we&apos;ll send a code to verify it before running the analysis.
        </p>
        {error && <p className="mb-4 text-sm font-medium text-error">{error}</p>}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink" htmlFor="adspy-email">
            Email
          </label>
          <input
            id="adspy-email"
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
      <form onSubmit={handleOtpSubmit}>
        <p className="text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground">Verify your email</p>
        <p className="mt-3 mb-5 text-sm leading-relaxed text-body">We sent a 6-digit code to {email}.</p>
        {error && <p className="mb-4 text-sm font-medium text-error">{error}</p>}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink" htmlFor="adspy-code">
            Verification code
          </label>
          <input
            id="adspy-code"
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
    <form onSubmit={handleStart}>
      {error && <p className="mb-4 text-sm font-medium text-error">{error}</p>}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-ink" htmlFor="adspy-company-name">
          Competitor&apos;s company name
        </label>
        <input
          id="adspy-company-name"
          className="h-11 w-full rounded-[12px] border border-hairline bg-canvas px-4 text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
          type="text"
          required
          placeholder="Acme Inc"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-[12px] bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98]"
        >
        Analyze
          </button>
      </div>
    </form>
  );
}
