"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { isValidEmail } from "@/lib/email";
import { isValidLinkedInUrl } from "@/lib/linkedin-url";
import { isConvexConfigured } from "@/lib/convex";
import { GENERIC_ERROR, RATE_LIMITED_MSG } from "@/lib/ui-copy";

type Step = "url" | "email" | "done";
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done" }
  | { kind: "rate_limited" }
  | { kind: "error"; message: string };

/**
 * Unified free-tool gate: URL -> email capture (lead magnet) -> async paid
 * pipeline. Results are delivered to email only. URL shape is validated
 * client-side BEFORE the email gate (no getting stuck), and the email step
 * always offers a way back to fix the URL.
 */
export function ToolGateForm({
  tool,
  toolName,
  inputLabel,
  inputPlaceholder,
  inputType = "url",
}: {
  tool: string;
  toolName: string;
  inputLabel: string;
  inputPlaceholder: string;
  /** "url" = LinkedIn URL input; "name" = free-text input (e.g. ad-spy company name) */
  inputType?: "url" | "name";
}) {
  const [step, setStep] = useState<Step>("url");
  const [profileUrl, setProfileUrl] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [urlError, setUrlError] = useState<string | null>(null);

  if (!isConvexConfigured) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        This tool is coming online shortly.
      </p>
    );
  }

  return (
    <GateFormInner
      tool={tool}
      toolName={toolName}
      inputLabel={inputLabel}
      inputPlaceholder={inputPlaceholder}
      inputType={inputType}
      step={step}
      setStep={setStep}
      profileUrl={profileUrl}
      setProfileUrl={setProfileUrl}
      email={email}
      setEmail={setEmail}
      status={status}
      setStatus={setStatus}
      urlError={urlError}
      setUrlError={setUrlError}
    />
  );
}

function GateFormInner(props: {
  tool: string;
  toolName: string;
  inputLabel: string;
  inputPlaceholder: string;
  inputType: "url" | "name";
  step: Step;
  setStep: (s: Step) => void;
  profileUrl: string;
  setProfileUrl: (s: string) => void;
  email: string;
  setEmail: (s: string) => void;
  status: Status;
  setStatus: (s: Status) => void;
  urlError: string | null;
  setUrlError: (s: string | null) => void;
}) {
  const {
    tool,
    toolName,
    inputLabel,
    inputPlaceholder,
    inputType,
    step,
    setStep,
    profileUrl,
    setProfileUrl,
    email,
    setEmail,
    status,
    setStatus,
    urlError,
    setUrlError,
  } = props;
  const requestAnalysis = useMutation(api.tools.requestAnalysis);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [jobId, setJobId] = useState<Id<"analysisJobs"> | null>(null);
  // Live job status (server pushes updates — no busy polling). When the async
  // paid pipeline fails (e.g. paid-API credits exhausted) we swap the
  // "results on their way" promise for the generic error message.
  const jobStatus = useQuery(api.tools.getPublicJob, jobId ? { jobId } : "skip");

  // Cursor goes straight into the active input (URL or email step).
  useEffect(() => {
    if (step === "url") urlInputRef.current?.focus();
    if (step === "email") emailInputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step === "done" && jobStatus?.status === "failed") {
      setStatus({ kind: "error", message: GENERIC_ERROR });
    }
  }, [step, jobStatus, setStatus]);

  function handleAnalyze() {
    const input = profileUrl.trim();
    if (!input) return;
    // Validate URL shape BEFORE the email gate so users never get stuck.
    if (inputType === "url" && !isValidLinkedInUrl(input)) {
      setUrlError("Enter a valid LinkedIn profile or company URL.");
      return;
    }
    setUrlError(null);
    setStatus({ kind: "idle" });
    setStep("email");
  }

  async function handleSend(hp: string) {
    if (!isValidEmail(email)) {
      setStatus({ kind: "error", message: "That email doesn't look right. Double-check it." });
      return;
    }
    setStatus({ kind: "sending" });
    setJobId(null);
    try {
      const result = await requestAnalysis({
        email,
        tool,
        inputs:
          inputType === "url"
            ? { profileUrl: profileUrl.trim() }
            : { company: profileUrl.trim() },
        hp,
      });
      if (result.ok) {
        if (result.jobId) setJobId(result.jobId);
        setStatus({ kind: "done" });
        setStep("done");
      } else if (result.error === "rate_limited") {
        setStatus({ kind: "rate_limited" });
      } else if (result.error === "invalid_email") {
        setStatus({ kind: "error", message: "That email doesn't look right. Double-check it." });
      } else if (result.error === "invalid_url") {
        // Server disagreed with our client check (edge case) — send back to the URL step.
        setUrlError("Enter a valid LinkedIn profile or company URL.");
        setStep("url");
      } else {
        setStatus({ kind: "error", message: GENERIC_ERROR });
      }
    } catch {
      setStatus({ kind: "error", message: GENERIC_ERROR });
    }
  }

  return (
    <div className="space-y-5">
      {step === "url" && (
        <form
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
        >
          <div className="space-y-2">
            <label
              htmlFor={`${tool}-url`}
              className="block text-center text-sm font-semibold text-ink"
            >
              {inputLabel}
            </label>
            <input
              ref={urlInputRef}
              id={`${tool}-url`}
              className="h-11 w-full rounded-[12px] border border-hairline bg-canvas px-4 text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
              type="text"
              placeholder={inputPlaceholder}
              value={profileUrl}
              onChange={(e) => {
                setProfileUrl(e.target.value);
                setUrlError(null);
              }}
            />
            {urlError && (
              <p className="text-center text-sm font-medium text-error">{urlError}</p>
            )}
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-[12px] bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98]"
            >
              Analyze
            </button>
          </div>
        </form>
      )}

      {step === "email" && (
        <form
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void handleSend(String(fd.get("hp_website") ?? ""));
          }}
        >
          {/* Honeypot: bots fill hidden fields — server silently rejects */}
          <input
            type="text"
            name="hp_website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          <p className="text-center text-sm text-body">
            We&apos;ll run {toolName} on{" "}
            <span className="font-medium text-ink">{profileUrl.trim()}</span> and email the
            results to you.
          </p>
          <div className="space-y-2">
            <label
              htmlFor={`${tool}-email`}
              className="block text-center text-sm font-semibold text-ink"
            >
              Your email
            </label>
            <input
              ref={emailInputRef}
              id={`${tool}-email`}
              className="h-11 w-full rounded-[12px] border border-hairline bg-canvas px-4 text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="submit"
              disabled={status.kind === "sending"}
              className="inline-flex h-9 items-center rounded-[12px] bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98] disabled:opacity-60"
            >
              {status.kind === "sending" ? "Sending…" : "Send"}
            </button>
            <button
              type="button"
              onClick={() => {
                setUrlError(null);
                setStatus({ kind: "idle" });
                setJobId(null);
                setStep("url");
              }}
              className="inline-flex h-9 items-center rounded-[12px] bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98]"
            >
              Change URL
            </button>
          </div>
        </form>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-5 text-center">
          {status.kind === "done" && (
            <p className="text-sm font-medium text-ink">
              Your results are on their way to {email}. Check your inbox in a few
              minutes.
            </p>
          )}
          {status.kind === "rate_limited" && (
            <p className="text-sm text-body">
              {RATE_LIMITED_MSG}
            </p>
          )}
          {status.kind === "error" && (
            <p className="text-sm font-medium text-error">{status.message}</p>
          )}
          <Link
            href="/tools"
            className="inline-flex h-9 items-center rounded-[12px] bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98]"
          >
            Try other tools
          </Link>
        </div>
      )}

      {(status.kind === "error" || status.kind === "rate_limited") && step !== "done" && (
        <p className="text-center text-sm font-medium text-error">
          {status.kind === "error"
            ? status.message
            : RATE_LIMITED_MSG}
        </p>
      )}
    </div>
  );
}
