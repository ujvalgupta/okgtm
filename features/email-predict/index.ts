/**
 * Email Predictor — module interface. meta: listing/page copy + identity.
 * api: the server surface (domain mail probe) the API route adapter calls.
 * The pattern engine (./engine/patterns) is pure and runs in the browser;
 * the domain probe (./engine/domain) runs server-side.
 * tests/convex/email-tools-config.test.ts. */

import { meta } from "./meta";
import { validateDomain } from "@/lib/shared/domain-input";
import { checkDomainMail } from "./engine/domain";

export { meta };

export const api = {
  validate: validateDomain,
  checkDomain: checkDomainMail,
};
