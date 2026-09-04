/**
 * Cold Email Auditor — module interface. meta: listing/page copy + identity.
 * api: the server surface the API route adapter calls (validate → run).
 * The engine lives in ./engine and stays pure (tests cross its seam).
 * tests/convex/email-tools-config.test.ts. */

import { meta } from "./meta";
import { validateDomain } from "@/lib/shared/domain-input";
import { runAudit } from "./engine/orchestrator";
import { DNSCache } from "@/lib/shared/dns";

export { meta };

export const api = {
  validate: validateDomain,
  run: runAudit,
  Cache: DNSCache,
};
