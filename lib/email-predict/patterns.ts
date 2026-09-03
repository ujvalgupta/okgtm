/**
 * Email Predictor — pure pattern generation.
 *
 * Inputs: a person's full name + a company domain.
 * Output: the most likely email addresses for that person, ranked by how
 * commonly each pattern is used in real-world corporate email (based on
 * industry pattern frequency research, e.g. First.Last and First initial +
 * Last being the most widespread). Capped at 10 candidates.
 *
 * Deterministic and free. Patterns are educated guesses, never verified
 * addresses — the tool says so in its copy.
 */

export interface ParsedName {
  first: string;
  last: string;
  middleInitial: string | null;
  raw: string;
}

export interface PredictedEmail {
  email: string;
  /** Pattern id, e.g. "first.last". */
  pattern: string;
  /** Human-readable pattern label, e.g. "First.Last". */
  label: string;
  rank: number; // 1 = most likely
}

const TITLES = new Set(["mr", "mrs", "ms", "miss", "dr", "prof", "sir", "madam", "mx"]);
const SUFFIXES = new Set(["sr", "snr", "jr", "jnr", "ii", "iii", "iv", "v", "phd", "md", "cpa", "esq"]);
const CONNECTORS = new Set(["van", "der", "den", "de", "von", "del", "la", "di", "el", "al", "ben", "bin", "da", "ter", "op", "te", "st"]);

/** Fold to ASCII (drops diacritics), lowercase, and keep only letters/hyphens. */
function normalizeToken(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’‘`"´]/g, "")
    .replace(/[^a-z-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseFullName(raw: string): ParsedName | null {
  if (!raw) return null;
  // Drop parenthetical roles and quoted bits: "Jane Doe (CEO)", "John (Sales)"
  const cleaned = raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[.,]/g, " ");
  const tokens = cleaned.split(/\s+/).map(normalizeToken).filter(Boolean);
  if (tokens.length === 0) return null;

  // Strip leading titles and trailing suffixes
  while (tokens.length > 1 && TITLES.has(tokens[0])) tokens.shift();
  while (tokens.length > 1 && SUFFIXES.has(tokens[tokens.length - 1])) tokens.pop();
  if (tokens.length === 0) return null;

  const first = tokens[0];
  if (tokens.length === 1) {
    return { first, last: "", middleInitial: null, raw };
  }

  // Multi-word surnames: "Jane van der Berg", "Ujval de la Cruz"
  const connectorIdx = tokens.findIndex((t, i) => i >= 1 && CONNECTORS.has(t));
  if (connectorIdx !== -1) {
    const lastParts = tokens.slice(connectorIdx);
    return {
      first,
      last: lastParts.join(" ").replace(/\s+/g, ""), // vandenberg, delacruz
      middleInitial: null,
      raw,
    };
  }

  const last = tokens[tokens.length - 1];
  let middleInitial: string | null = null;
  if (tokens.length === 3) {
    middleInitial = tokens[1][0] ?? null;
  } else if (tokens.length > 3) {
    middleInitial = tokens[1][0] ?? null;
  }
  return { first, last, middleInitial, raw };
}

function foldForEmail(name: string): string {
  return name.replace(/\s+/g, "");
}

export function predictEmails(fullName: string, domain: string): { parsed: ParsedName; emails: PredictedEmail[] } | { error: string } {
  const parsed = parseFullName(fullName);
  if (!parsed) return { error: "Enter a name." };
  if (!parsed.first || !parsed.last) {
    return { error: "We need both a first and a last name to build patterns." };
  }

  const d = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.+$/, "");
  if (!d || !d.includes(".")) return { error: "Enter a company domain like acme.com." };

  const f = foldForEmail(parsed.first);
  const l = foldForEmail(parsed.last);
  const fi = f[0] ?? "";
  const li = l[0] ?? "";
  const mi = parsed.middleInitial ?? "";

  // Ordered from most common in the industry to least. Middle-initial
  // variants slot in only when we have a middle initial.
  const specs: { pattern: string; fn: (at: string) => string }[] = [
    { pattern: "first.last", fn: () => `${f}.${l}` },
    { pattern: "first", fn: () => f },
    { pattern: "flast", fn: () => `${fi}${l}` },
    { pattern: "firstlast", fn: () => `${f}${l}` },
    { pattern: "firstl", fn: () => `${f}${li}` },
    { pattern: "f.last", fn: () => `${fi}.${l}` },
    { pattern: "last.first", fn: () => `${l}.${f}` },
    ...(mi ? [{ pattern: "first.mi.last", fn: () => `${f}.${mi}.${l}` }] : []),
    ...(mi ? [{ pattern: "fmi.last", fn: () => `${fi}${mi}${l}` }] : []),
    { pattern: "first_last", fn: () => `${f}_${l}` },
    { pattern: "f_last", fn: () => `${fi}_${l}` },
    { pattern: "last", fn: () => l },
    { pattern: "lastf", fn: () => `${l}${fi}` },
  ];

  const emails: PredictedEmail[] = [];
  const seen = new Set<string>();
  let rank = 0;
  for (const spec of specs) {
    const local = spec.fn(d);
    if (!local) continue;
    const email = `${local}@${d}`;
    if (seen.has(email)) continue;
    seen.add(email);
    rank += 1;
    emails.push({
      email,
      pattern: spec.pattern,
      label: humanLabel(spec.pattern),
      rank,
    });
    if (emails.length >= 10) break;
  }

  return { parsed, emails };
}

function humanLabel(pattern: string): string {
  const map: Record<string, string> = {
    "first.last": "First.Last",
    first: "First name",
    flast: "First initial + last",
    firstlast: "First + last (no separator)",
    firstl: "First + last initial",
    "f.last": "First initial.Last",
    "last.first": "Last.First",
    "first.mi.last": "First.Middle initial.Last",
    "fmi.last": "First+middle initial + last",
    first_last: "First_Last",
    f_last: "First initial_Last",
    last: "Last name",
    lastf: "Last + first initial",
  };
  return map[pattern] ?? pattern;
}
