/**
 * Results email via Resend. Always a clean, structured plain-text/HTML email.
 */

import { Resend } from "resend";

const FROM_ADDRESS = process.env.LEAD_FROM_ADDRESS ?? "OkGTM <tools@okgtm.com>";

function htmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Send the analysis results to the user's email (clean format). */
export async function sendResultsEmail(params: {
  to: string;
  toolName: string;
  profileUrl: string;
  report: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const resend = new Resend(apiKey);
  const html =
    `<div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">` +
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#3a3a3a">Here are your results for <strong>${htmlEscape(params.profileUrl)}</strong>:</p>` +
    `<div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#1a1a1a">${htmlEscape(
      params.report
    )}</div>` +
    `<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0" />` +
    `<p style="margin:0;font-size:12px;color:#9a9a9a">Sent by OkGTM · GTM OS for modern revenue teams</p>` +
    `</div>`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: `Your ${params.toolName} results are ready`,
    html,
    text: `Here are your results for ${params.profileUrl}:\n\n${params.report}\n\nSent by OkGTM`,
  });
}

/** Tell the user no results were found (clean, no noise). */
export async function sendNotFoundEmail(params: {
  to: string;
  toolName: string;
  profileUrl: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: `No results found for ${params.toolName}`,
    text: `We ran ${params.toolName} on ${params.profileUrl}, but no results were found.\n\nTry a different profile or check back later.\n\nSent by OkGTM`,
    html:
      `<p style="font-family:Inter,system-ui,sans-serif;color:#1a1a1a;font-size:15px;line-height:1.55">` +
      `We ran <strong>${htmlEscape(params.toolName)}</strong> on <strong>${htmlEscape(
        params.profileUrl
      )}</strong>, but no results were found.</p>` +
      `<p style="font-family:Inter,system-ui,sans-serif;color:#3a3a3a;font-size:14px">Try a different profile, or check back later.</p>`,
  });
}
