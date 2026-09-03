/**
 * robots.txt parsing/evaluation (Google spec) + crawl-delay parsing.
 * Ported from geo-stuff.
 */

export interface RobotsEvaluation {
  allowed: boolean;
  matchedRule?: string;
}

interface Rule {
  pattern: string;
  regex: RegExp;
  allow: boolean;
  specificity: number;
}

function patternToRegex(pattern: string): RegExp {
  const hasEndAnchor = pattern.endsWith("$");
  const base = hasEndAnchor ? pattern.slice(0, -1) : pattern;
  const escaped = base.replace(/[.+^{}()|[\]\\?]/g, "\\$&");
  const withWildcard = escaped.replace(/\*/g, ".*");
  return new RegExp("^" + withWildcard + (hasEndAnchor ? "$" : ""));
}

function parseRobotsForUserAgent(content: string, requestedUserAgent: string): Rule[] {
  const lines = content.split(/\r?\n/);
  const specificRules: Rule[] = [];
  const wildcardRules: Rule[] = [];
  let inSpecificSection = false;
  let inWildcardSection = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();
    if (!value) continue;

    if (key === "user-agent") {
      const normalized = value.toLowerCase();
      const botNormalized = requestedUserAgent.toLowerCase();
      inSpecificSection = normalized !== "*" && (botNormalized.includes(normalized) || normalized.includes(botNormalized));
      inWildcardSection = normalized === "*";
      continue;
    }
    if (key !== "allow" && key !== "disallow") continue;
    if (!value || value === "") continue;

    const rule: Rule = { pattern: value, regex: patternToRegex(value), allow: key === "allow", specificity: value.length };
    if (inSpecificSection) specificRules.push(rule);
    if (inWildcardSection) wildcardRules.push(rule);
  }
  return specificRules.length > 0 ? specificRules : wildcardRules;
}

export function evaluateRobotsAccess(content: string, requestedUserAgent: string, path: string): RobotsEvaluation {
  const rules = parseRobotsForUserAgent(content, requestedUserAgent).filter((r) => r.pattern !== "");
  let bestMatch: Rule | undefined;
  for (const rule of rules) {
    if (rule.regex.test(path)) {
      if (!bestMatch || rule.specificity > bestMatch.specificity || (rule.specificity === bestMatch.specificity && rule.allow && !bestMatch.allow)) {
        bestMatch = rule;
      }
    }
  }
  if (!bestMatch) return { allowed: true };
  return { allowed: bestMatch.allow, matchedRule: `${bestMatch.allow ? "Allow" : "Disallow"}: ${bestMatch.pattern}` };
}

export function parseCrawlDelay(content: string): number | null {
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, "").trim().toLowerCase();
    if (line.startsWith("crawl-delay:")) {
      const value = line.slice("crawl-delay:".length).trim();
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return null;
}
