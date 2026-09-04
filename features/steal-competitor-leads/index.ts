/**
 * steal-competitor-leads — email tool module. meta: listing/page copy + identity + gate config.
 * The execution pipeline is shared Convex infrastructure (email tools are
 * parameterized instances of it); per-tool pipeline config (name + strategy)
 * lives in convex/toolRegistry.ts — mirrored from meta.ts here and enforced by
 * tests/convex/email-tools-config.test.ts. */

import { meta } from "./meta";

export { meta };
