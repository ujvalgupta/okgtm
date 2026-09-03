/**
 * DMARC parser (RFC 7489).
 * Handles malformed records, unknown tags, duplicate tags, and extracts the
 * tags the audit needs. Never infers policy from a malformed record.
 */

export interface DmarcTags {
  version?: string;
  p?: "none" | "quarantine" | "reject";
  sp?: "none" | "quarantine" | "reject";
  pct?: number;
  rua?: string;
  ruf?: string;
  adkim?: "r" | "s";
  aspf?: "r" | "s";
  fo?: string;
  ri?: number;
}

export interface DmarcRecord {
  found: boolean;
  raw?: string;
  valid: boolean;
  errors: string[];
  tags: DmarcTags;
}

const POLICY_VALUES = new Set(["none", "quarantine", "reject"]);
const ALIGN_VALUES = new Set(["r", "s"]);

export function parseDmarcRecord(record: string): DmarcRecord {
  const errors: string[] = [];
  const tags: DmarcTags = {};

  if (!record.trim().toLowerCase().startsWith("v=dmarc1")) {
    return { found: true, raw: record, valid: false, errors: ["Record does not begin with v=DMARC1"], tags: {} };
  }

  const parts = record.split(";");
  for (const part of parts) {
    const piece = part.trim();
    if (!piece) continue;
    const sep = piece.indexOf("=");
    if (sep === -1) {
      errors.push(`Malformed tag (no '='): ${piece}`);
      continue;
    }
    const key = piece.slice(0, sep).trim().toLowerCase();
    const value = piece.slice(sep + 1).trim();

    switch (key) {
      case "v":
        if (value.toLowerCase() !== "dmarc1") errors.push(`Unsupported version: ${value}`);
        tags.version = value;
        break;
      case "p":
        if (POLICY_VALUES.has(value.toLowerCase())) {
          tags.p = value.toLowerCase() as DmarcTags["p"];
        } else {
          errors.push(`Invalid policy value: ${value}`);
        }
        break;
      case "sp":
        if (POLICY_VALUES.has(value.toLowerCase())) {
          tags.sp = value.toLowerCase() as DmarcTags["sp"];
        } else {
          errors.push(`Invalid subdomain policy value: ${value}`);
        }
        break;
      case "pct":
        tags.pct = Math.min(100, Math.max(0, Number(value)));
        break;
      case "rua":
        tags.rua = value;
        break;
      case "ruf":
        tags.ruf = value;
        break;
      case "adkim":
        if (ALIGN_VALUES.has(value.toLowerCase())) tags.adkim = value.toLowerCase() as "r" | "s";
        else errors.push(`Invalid adkim value: ${value}`);
        break;
      case "aspf":
        if (ALIGN_VALUES.has(value.toLowerCase())) tags.aspf = value.toLowerCase() as "r" | "s";
        else errors.push(`Invalid aspf value: ${value}`);
        break;
      case "fo":
        tags.fo = value;
        break;
      case "ri":
        tags.ri = Number(value);
        break;
      default:
        errors.push(`Unknown tag: ${key}`);
    }
  }

  const valid = !errors.length && !!tags.p;
  if (!tags.p) errors.push("Missing required policy tag (p=)");
  return { found: true, raw: record, valid, errors, tags };
}

/** Defaults per RFC 7489 when a tag is absent. */
export function dmarcEffectiveTags(tags: DmarcTags) {
  return {
    p: tags.p ?? "none",
    sp: tags.sp ?? tags.p ?? "none",
    pct: tags.pct ?? 100,
    adkim: tags.adkim ?? "r",
    aspf: tags.aspf ?? "r",
  };
}
