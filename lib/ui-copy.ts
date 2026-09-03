/**
 * Single source of truth for user-visible error copy.
 * Generic failures (including paid-API outages such as exhausted Mindcase
 * credits) always show the generic message below. Specific, already-handled
 * states (bad email, bad URL, rate limit) keep their own copy.
 */

export const GENERIC_ERROR = "Something went wrong. Please try again later.";

export const RATE_LIMITED_MSG = "Please try again in some time.";
