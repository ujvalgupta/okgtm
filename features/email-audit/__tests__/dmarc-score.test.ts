import { describe, it, expect } from "vitest";
import { parseDmarcRecord, dmarcEffectiveTags } from "@/features/email-audit/engine/parsers/dmarc";
import { computeScore, gradeFor, sortChecks, summarizeChecks } from "@/features/email-audit/engine/score";
import type { CheckResult } from "@/features/email-audit/engine/types";

function check(partial: Partial<CheckResult> & Pick<CheckResult, "id" | "status" | "scoreImpact">): CheckResult {
  return {
    category: "x",
    severity: "INFO",
    title: partial.id,
    summary: "",
    ...partial,
  } as CheckResult;
}

describe("parseDmarcRecord", () => {
  it("parses a full valid record", () => {
    const r = parseDmarcRecord("v=DMARC1; p=reject; rua=mailto:d@example.com; sp=quarantine; pct=50; adkim=s; aspf=s");
    expect(r.valid).toBe(true);
    expect(r.tags.p).toBe("reject");
    expect(r.tags.sp).toBe("quarantine");
    expect(r.tags.pct).toBe(50);
    expect(r.tags.adkim).toBe("s");
  });

  it("is case-insensitive on keys and values", () => {
    const r = parseDmarcRecord("V=DMARC1; P=REJECT");
    expect(r.valid).toBe(true);
    expect(r.tags.p).toBe("reject");
  });

  it("rejects a record without a policy", () => {
    const r = parseDmarcRecord("v=DMARC1; rua=mailto:a@example.com");
    expect(r.valid).toBe(false);
  });

  it("rejects a non-DMARC TXT value", () => {
    const r = parseDmarcRecord("v=spf1 -all");
    expect(r.valid).toBe(false);
  });

  it("rejects an unknown policy value", () => {
    const r = parseDmarcRecord("v=DMARC1; p=maybe");
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("policy"))).toBe(true);
  });

  it("applies RFC defaults for absent tags", () => {
    const r = parseDmarcRecord("v=DMARC1; p=quarantine");
    const eff = dmarcEffectiveTags(r.tags);
    expect(eff.sp).toBe("quarantine");
    expect(eff.pct).toBe(100);
    expect(eff.adkim).toBe("r");
  });
});

describe("score engine", () => {
  it("scores a clean domain at 100 / Excellent", () => {
    const checks: CheckResult[] = [
      check({ id: "a", status: "PASS", scoreImpact: 25 }),
      check({ id: "b", status: "PASS", scoreImpact: 15 }),
    ];
    expect(computeScore(checks)).toEqual({ score: 100, grade: "Excellent" });
  });

  it("deducts full weight on FAIL", () => {
    const checks: CheckResult[] = [check({ id: "dmarc", status: "FAIL", scoreImpact: 12 })];
    const { score } = computeScore(checks);
    expect(score).toBe(88);
  });

  it("deducts half weight on WARN", () => {
    const checks: CheckResult[] = [check({ id: "spf", status: "WARN", scoreImpact: 4 })];
    const { score } = computeScore(checks);
    expect(score).toBe(98);
  });

  it("never penalizes UNKNOWN", () => {
    const checks: CheckResult[] = [check({ id: "x", status: "UNKNOWN", scoreImpact: 15 })];
    const { score } = computeScore(checks);
    expect(score).toBe(100);
  });

  it("clamps at zero", () => {
    const checks: CheckResult[] = [check({ id: "a", status: "FAIL", scoreImpact: 70 }), check({ id: "b", status: "FAIL", scoreImpact: 70 })];
    const { score } = computeScore(checks);
    expect(score).toBe(0);
  });

  it("is deterministic across repeated calls", () => {
    const checks: CheckResult[] = [
      check({ id: "dmarc", status: "FAIL", scoreImpact: 12 }),
      check({ id: "spf", status: "WARN", scoreImpact: 4 }),
      check({ id: "ok", status: "PASS", scoreImpact: 5 }),
    ];
    const a = computeScore(checks);
    const b = computeScore(checks);
    expect(a).toEqual(b);
  });

  it("maps grade bands correctly", () => {
    expect(gradeFor(100)).toBe("Excellent");
    expect(gradeFor(92)).toBe("Excellent");
    expect(gradeFor(89)).toBe("Good");
    expect(gradeFor(75)).toBe("Good");
    expect(gradeFor(74)).toBe("Needs attention");
    expect(gradeFor(50)).toBe("Needs attention");
    expect(gradeFor(49)).toBe("Poor");
    expect(gradeFor(25)).toBe("Poor");
    expect(gradeFor(24)).toBe("Critical");
  });

  it("summarizes severities and unknowns", () => {
    const checks: CheckResult[] = [
      check({ id: "a", status: "FAIL", scoreImpact: 1 }),
      check({ id: "b", status: "UNKNOWN", scoreImpact: 1 }),
    ];
    const s = summarizeChecks(checks);
    expect(s.high).toBe(0);
    expect(s.unknown).toBe(1);
  });

  it("sorts critical findings to the front", () => {
    const low = check({ id: "low", status: "FAIL", scoreImpact: 1 });
    const crit = { ...check({ id: "crit", status: "FAIL", scoreImpact: 1 }), severity: "CRITICAL" as const };
    const sorted = sortChecks([low, crit]);
    expect(sorted[0].id).toBe("crit");
  });
});
