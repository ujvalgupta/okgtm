import { describe, it, expect } from "vitest";
import { parseFullName, predictEmails } from "../../lib/email-predict/patterns";

describe("parseFullName", () => {
  it("parses a plain two-token name", () => {
    const p = parseFullName("Jane Smith");
    expect(p?.first).toBe("jane");
    expect(p?.last).toBe("smith");
    expect(p?.middleInitial).toBeNull();
  });

  it("handles case and punctuation", () => {
    const p = parseFullName("  UJVAL  GUPTA,  ");
    expect(p?.first).toBe("ujval");
    expect(p?.last).toBe("gupta");
  });

  it("extracts a middle initial", () => {
    const p = parseFullName("Jane Q. Public");
    expect(p?.first).toBe("jane");
    expect(p?.middleInitial).toBe("q");
    expect(p?.last).toBe("public");
  });

  it("keeps multi-word surnames joined for email use", () => {
    const p = parseFullName("Jane van der Berg");
    expect(p?.first).toBe("jane");
    expect(p?.last).toBe("vanderberg");
  });

  it("strips titles and suffixes and parenthetical roles", () => {
    const p = parseFullName("Dr. Jane Smith, PhD (CEO)");
    expect(p?.first).toBe("jane");
    expect(p?.last).toBe("smith");
  });

  it("handles apostrophes and accents", () => {
    const p = parseFullName("Máire O'Brien");
    expect(p?.first).toBe("maire");
    expect(p?.last).toBe("obrien");
  });

  it("returns null for empty input", () => {
    expect(parseFullName("")).toBeNull();
    expect(parseFullName("   ")).toBeNull();
  });

  it("signals a single-token name", () => {
    const p = parseFullName("Cher");
    expect(p?.first).toBe("cher");
    expect(p?.last).toBe("");
  });
});

describe("predictEmails", () => {
  it("generates ranked candidates for a normal name", () => {
    const r = predictEmails("Jane Smith", "acme.com");
    if ("error" in r) throw new Error(r.error);
    expect(r.emails.length).toBeLessThanOrEqual(10);
    expect(r.emails[0].email).toBe("jane.smith@acme.com");
    expect(r.emails[0].rank).toBe(1);
    expect(r.emails[1].email).toBe("jane@acme.com");
    // All unique
    expect(new Set(r.emails.map((e) => e.email)).size).toBe(r.emails.length);
  });

  it("respects the domain as typed and normalizes it", () => {
    const r = predictEmails("Jane Smith", "https://acme.com/path");
    if ("error" in r) throw new Error(r.error);
    expect(r.emails.every((e) => e.email.endsWith("@acme.com"))).toBe(true);
  });

  it("inserts middle-initial patterns when a middle initial exists", () => {
    const r = predictEmails("Jane Q Public", "acme.com");
    if ("error" in r) throw new Error(r.error);
    const emails = r.emails.map((e) => e.email);
    expect(emails).toContain("jane.q.public@acme.com");
    expect(emails).toContain("jqpublic@acme.com");
  });

  it("errors on a missing last name", () => {
    const r = predictEmails("Cher", "acme.com");
    expect("error" in r).toBe(true);
  });

  it("errors on a junk domain", () => {
    const r = predictEmails("Jane Smith", "notadomain");
    expect("error" in r).toBe(true);
  });

  it("caps output at ten candidates", () => {
    const r = predictEmails("Jonathan Alexander", "longcompanyname.com");
    if ("error" in r) throw new Error(r.error);
    expect(r.emails.length).toBeLessThanOrEqual(10);
  });

  it("ranks deterministically across calls", () => {
    const a = predictEmails("Jane Smith", "acme.com");
    const b = predictEmails("Jane Smith", "acme.com");
    if ("error" in a || "error" in b) throw new Error("unexpected");
    expect(a.emails.map((e) => e.email)).toEqual(b.emails.map((e) => e.email));
  });
});
