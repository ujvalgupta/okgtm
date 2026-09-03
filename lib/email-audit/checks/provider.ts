import type { ProviderDetection } from "../types";
import { inferProviderFromMx } from "./mx";
import type { AuditContext } from "./helpers";

const SPF_PROVIDERS: { needle: string; name: string }[] = [
  { needle: "_spf.google.com", name: "Google Workspace" },
  { needle: "spf.protection.outlook.com", name: "Microsoft 365" },
  { needle: "sendgrid.net", name: "SendGrid" },
  { needle: "amazonses.com", name: "Amazon SES" },
  { needle: "mailgun.org", name: "Mailgun" },
  { needle: "spf.mandrillapp.com", name: "Mandrill" },
  { needle: "zoho.com", name: "Zoho" },
  { needle: "hubspot", name: "HubSpot" },
  { needle: "salesforce.com", name: "Salesforce" },
  { needle: "mailchimp", name: "Mailchimp" },
  { needle: "emailsrvr.com", name: "Rackspace" },
  { needle: "fastmail", name: "Fastmail" },
];

export function detectProvider(ctx: AuditContext): ProviderDetection | undefined {
  const evidence: string[] = [];
  const mxProvider = inferProviderFromMx(ctx.mx.values);
  if (mxProvider) evidence.push(...mxProvider.evidence);

  let spfName: string | undefined;
  for (const v of ctx.txt.values) {
    const lower = v.toLowerCase();
    for (const p of SPF_PROVIDERS) {
      if (lower.includes(p.needle)) {
        spfName = p.name;
        evidence.push(`SPF include references ${p.name}`);
        break;
      }
    }
    if (spfName) break;
  }

  const name = mxProvider?.name ?? spfName;
  if (!name) return undefined;

  // Confidence: MX match is strongest; SPF-only is medium.
  const confidence = mxProvider ? 0.9 : 0.6;
  return { name, confidence, evidence: [...new Set(evidence)] };
}
