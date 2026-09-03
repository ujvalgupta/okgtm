"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { isValidEmail } from "@/lib/email";
import { isConvexConfigured } from "@/lib/convex";
import { GENERIC_ERROR } from "@/lib/ui-copy";
import { PaperPlaneTilt } from "@phosphor-icons/react";

/**
 * Footer newsletter form. Validates email format client-side, then records
 * the lead in Convex. On success: "We'll stay in touch."
 */
function NewsletterFormInner() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const subscribe = useMutation(api.newsletter.subscribeNewsletter);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const hp = String(fd.get("hp_website") ?? "");
    if (!isValidEmail(email)) {
      setErrorMessage("That email doesn't look right. Double-check it.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const result = await subscribe({ email, hp });
      if (result.ok) {
        setStatus("done");
      } else if (result.error === "invalid_email") {
        setErrorMessage("That email doesn't look right. Double-check it.");
        setStatus("error");
      } else {
        // Any unhandled server failure: generic message only.
        setErrorMessage(GENERIC_ERROR);
        setStatus("error");
      }
    } catch {
      setErrorMessage(GENERIC_ERROR);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="mx-auto mt-6 flex min-h-11 max-w-[320px] items-center justify-center text-center text-sm font-medium text-ink">
        We&apos;ll stay in touch.
      </p>
    );
  }

  return (
    <form
      className="relative mx-auto mt-6 max-w-[320px]"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Newsletter signup"
    >
      <label htmlFor="footer-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-email"
        type="email"
        required
        placeholder="Enter your email"
        className="h-11 w-full rounded-[12px] border border-hairline bg-canvas pr-12 pl-4 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        type="submit"
        aria-label="Subscribe"
        disabled={status === "sending"}
        className="absolute top-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary transition-transform hover:scale-105 hover:bg-primary-active disabled:opacity-60"
      >
        <PaperPlaneTilt size={16} weight="bold" />
      </button>
      {status === "error" && errorMessage && (
        <p className="mt-2 text-xs font-medium text-error">{errorMessage}</p>
      )}
    </form>
  );
}

export function NewsletterForm() {
  if (!isConvexConfigured) {
    return (
      <form
        className="relative mx-auto mt-6 max-w-[320px]"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Newsletter signup"
      >
        <label htmlFor="footer-email" className="sr-only">
          Email address
        </label>
        <input
          id="footer-email"
          type="email"
          required
          placeholder="Enter your email"
          className="h-11 w-full rounded-[12px] border border-hairline bg-canvas pr-12 pl-4 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className="absolute top-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary transition-transform hover:scale-105 hover:bg-primary-active"
        >
          <PaperPlaneTilt size={16} weight="bold" />
        </button>
      </form>
    );
  }
  return <NewsletterFormInner />;
}
