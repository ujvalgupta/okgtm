/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as email from "../email.js";
import type * as emailGate from "../emailGate.js";
import type * as llm from "../llm.js";
import type * as mindcase from "../mindcase.js";
import type * as newsletter from "../newsletter.js";
import type * as profileUrl from "../profileUrl.js";
import type * as rateLimits from "../rateLimits.js";
import type * as tools from "../tools.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  email: typeof email;
  emailGate: typeof emailGate;
  llm: typeof llm;
  mindcase: typeof mindcase;
  newsletter: typeof newsletter;
  profileUrl: typeof profileUrl;
  rateLimits: typeof rateLimits;
  tools: typeof tools;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
