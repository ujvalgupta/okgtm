/**
 * F1 — Cold Email Deliverability Auditor.
 * Shared types for the audit engine.
 *
 * Correctness over severity: DNS failures → UNKNOWN, never a false FAIL.
 */

export type AuditStatus = "PASS" | "WARN" | "FAIL" | "INFO" | "UNKNOWN";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type DNSRecordStatus =
  | "RECORD_FOUND"
  | "NO_RECORD"
  | "NXDOMAIN"
  | "SERVFAIL"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface DNSResult {
  status: DNSRecordStatus;
  /** Answers normalized to strings (hostnames, IPs, raw TXT strings). */
  values: string[];
  /** Raw-ish detail for the technical-evidence panel. */
  raw?: unknown;
}

/** Transport-agnostic resolver so the backend can swap DNS providers. */
export interface DNSResolver {
  resolveA(domain: string): Promise<DNSResult>;
  resolveAAAA(domain: string): Promise<DNSResult>;
  resolveMX(domain: string): Promise<DNSResult>;
  resolveTXT(domain: string): Promise<DNSResult>;
  resolveCNAME(domain: string): Promise<DNSResult>;
  resolveNS(domain: string): Promise<DNSResult>;
  resolvePTR(ip: string): Promise<DNSResult>;
  resolveDS(domain: string): Promise<DNSResult>;
  resolveDNSKEY(domain: string): Promise<DNSResult>;
}

export type EvidenceType = "DNS_RECORD" | "HTTP_RESPONSE" | "DERIVED";

export interface Evidence {
  type: EvidenceType;
  source: string;
  value?: string;
  explanation?: string;
}

export interface ExactFix {
  recordType: "TXT" | "CNAME" | "A" | "AAAA";
  hostname: string;
  value: string;
  instructions: string;
}

export interface CheckResult {
  id: string;
  category: string;
  status: AuditStatus;
  severity: Severity;
  title: string;
  summary: string;
  evidence: Evidence[];
  recommendation?: string;
  exactFix?: ExactFix;
  scoreImpact: number; // max points this check contributes
}

export interface ProviderDetection {
  name: string;
  confidence: number; // 0..1
  evidence: string[];
}

export interface AuditSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  unknown: number;
}

export interface AuditResult {
  schemaVersion: string;
  auditId: string;
  timestamp: string;
  domain: string;
  normalizedDomain: string;
  score: number;
  grade: string;
  provider?: ProviderDetection;
  summary: AuditSummary;
  checks: CheckResult[];
  durationMs: number;
}

export const SCHEMA_VERSION = "f1-v1.0";
