/**
 * F1 — Cold Email Deliverability Auditor.
 * Shared types for the audit engine.
 *
 * Correctness over severity: DNS failures → UNKNOWN, never a false FAIL.
 */

export type AuditStatus = "PASS" | "WARN" | "FAIL" | "INFO" | "UNKNOWN";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
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
