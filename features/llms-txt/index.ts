/**
 * llms.txt Validator — module interface. meta: listing/page copy + identity.
 * api: the server surface the API route adapter calls.
 * The engine lives in ./engine and stays pure (tests cross its seam).
 */

import { meta } from "./meta";
import { normalizeSiteUrl } from "@/lib/shared/site-input";
import { runLlmsTxtAudit } from "./engine/validator";

export { meta };

export const api = {
  validate: normalizeSiteUrl,
  run: runLlmsTxtAudit,
};
