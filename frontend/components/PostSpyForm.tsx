"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { LINKEDIN_POSTS_CONFIG } from "@/config/linkedin-posts";

type Step = "idle" | "loading" | "email" | "otp" | "analyzing" | "results";

interface PostResult {
  postId: string;
  postUrl: string;
  postText?: string | null;
  postedDate?: string | null;
  reactions?: number | null;
  comments?: number | null;
  shares?: number | null;
  authorName?: string | null;
  postMediaUrl?: string | null;
  postMediaType?: string | null;
  articleUrl?: string | null;
}

interface AnalysisResult {
  profileUrl: string;
  posts: PostResult[];
  summary: string;
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function PostSpyForm() {
  const [step, setStep] = useState<Step>("idle");
  const [profileUrl, setProfileUrl] = useState("");
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
    if (!profileUrl.trim()) return;
    setError(null);
    setStep("loading");
    loaderTimer.current = setTimeout(() => {
      if (LINKEDIN_POSTS_CONFIG.requireEmailVerification) {
        setStep("email");
      } else {
        void runAnalysis();
      }
    }, LINKEDIN_POSTS_CONFIG.fakeLoaderDelayMs);
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);

    try {
      const res = await fetch("/api/linkedin-posts/otp/request", {
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

  async function pollStatus(jobId: string, url: string) {
    for (let attempt = 1; attempt <= LINKEDIN_POSTS_CONFIG.maxPollAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, LINKEDIN_POSTS_CONFIG.pollIntervalMs));
      if (cancelledRef.current) return;
      setPollAttempt(attempt);

      const res = await fetch(
        `/api/linkedin-posts/analyze/status?jobId=${encodeURIComponent(jobId)}&profileUrl=${encodeURIComponent(url)}`,
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
      const res = await fetch("/api/linkedin-posts/analyze/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, profileUrl, code, token }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Could not start analysis");
      }
      await pollStatus(data.jobId, data.profileUrl);
    } catch (err) {
      setError((err as Error).message);
      setStep(LINKEDIN_POSTS_CONFIG.requireEmailVerification ? "otp" : "idle");
    }
  }

  if (step === "results" && result) {
    return (
      <div className="space-y-6">
        <div>
          <span className="inline-flex items-center rounded-pill bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            {result.posts.length} posts found
          </span>
          <h2 className="mt-3 font-display text-2xl font-medium tracking-tight text-ink">
            {result.posts[0]?.authorName ?? result.profileUrl}
          </h2>
        </div>

        <div className="whitespace-pre-wrap rounded-[16px] border border-hairline bg-canvas p-6 text-sm leading-relaxed text-body">
          {result.summary}
        </div>

        {result.posts.length === 0 ? (
          <div className="rounded-[16px] border border-hairline bg-canvas p-6 text-sm leading-relaxed text-body">
            No posts found for this profile. It may be a private profile, an inactive
            page, or the URL may not have resolved. Double-check the profile or company
            URL and try again.
          </div>
        ) : (
        <div className="grid gap-4">
          {result.posts.map((post) => {
            const date = formatDate(post.postedDate);
            return (
              <div className="rounded-[16px] border border-hairline bg-canvas p-6 space-y-3" key={post.postId}>
                {date && (
                  <span className="inline-flex rounded-pill bg-surface-card px-3 py-1 text-xs font-medium text-ink">
                    {date}
                  </span>
                )}
                {post.postText && <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">{post.postText}</p>}
                {post.postMediaUrl && post.postMediaType === "IMAGE" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.postMediaUrl}
                    alt=""
                    className="w-full rounded-[12px]"
                  />
                )}
                <span className="inline-flex rounded-pill bg-surface-card px-3 py-1 text-xs font-medium text-muted-foreground">
                  {post.reactions ?? 0} reactions · {post.comments ?? 0} comments · {post.shares ?? 0} shares
                </span>
                <div>
                  <a
                    href={post.postUrl}
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
    const elapsedSeconds = Math.round((pollAttempt * LINKEDIN_POSTS_CONFIG.pollIntervalMs) / 1000);
    return (
      <div className="flex flex-col items-center justify-center rounded-[16px] border border-hairline bg-canvas px-6 py-16 text-center">
        <div className="tool-spinner" />
        <p className="mt-5 text-sm leading-relaxed text-body">
          {step === "loading"
            ? "Pulling recent LinkedIn posts…"
            : `Analyzing content strategy… this can take a couple of minutes (${elapsedSeconds}s)`}
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
          <label className="block text-sm font-semibold text-ink" htmlFor="postspy-email">
            Email
          </label>
          <input
            id="postspy-email"
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
          <label className="block text-sm font-semibold text-ink" htmlFor="postspy-code">
            Verification code
          </label>
          <input
            id="postspy-code"
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
        <label className="block text-sm font-semibold text-ink" htmlFor="postspy-profile-url">
          Competitor&apos;s LinkedIn URL
        </label>
        <input
          id="postspy-profile-url"
          className="h-11 w-full rounded-[12px] border border-hairline bg-canvas px-4 text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
          type="text"
          required
          placeholder="linkedin.com/in/founder or linkedin.com/company/acme"
          value={profileUrl}
          onChange={(e) => setProfileUrl(e.target.value)}
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
