import { ConvexReactClient } from "convex/react";

/**
 * Convex client wiring. `NEXT_PUBLIC_CONVEX_URL` is written by `npx convex dev`
 * when the project is connected. Until then the app renders without the
 * provider and the tool forms show a graceful "not configured" state.
 */
export const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
export const isConvexConfigured = CONVEX_URL.length > 0;
export const convexClient = isConvexConfigured
  ? new ConvexReactClient(CONVEX_URL)
  : null;
