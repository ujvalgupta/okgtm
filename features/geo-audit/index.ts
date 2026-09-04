/**
 * GEO & AI Crawl Checker — module interface. meta: listing/page copy +
 * identity. api: the server surface the API route adapter calls.
 * The engine lives in ./engine and stays pure (tests cross its seam).
 * tests/convex/email-tools-config.test.ts. */

import { meta } from "./meta";
import { normalizeSiteUrl } from "@/lib/shared/site-input";
import { runGeoAudit } from "./engine/orchestrator";
import { GeoResultCache } from "./engine/cache";

export { meta };

export const api = {
  validate: normalizeSiteUrl,
  run: runGeoAudit,
  Cache: GeoResultCache,
};
