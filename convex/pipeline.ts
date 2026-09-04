/**
 * Raw-data strategies for the email-tool pipeline. Each email tool is a
 * parameterized instance of one shared pipeline; this file implements the
 * four ways the pipeline gathers data (see convex/toolRegistry.ts for the
 * per-tool strategy mapping). Runs Mindcase agents and waits for results.
 */

import { runAgent, waitForResults } from "./mindcase";
import type { EmailToolStrategy } from "./toolRegistry";

type FetchFn = (inputs: Record<string, string>) => Promise<unknown[]>;

/** 5 most recent posts of a profile/company. */
const fetchPosts: FetchFn = async (inputs) => {
  const jobId = await runAgent("linkedin", "posts", {
    urls: inputs.profileUrl,
    maxResults: 5,
  });
  return waitForResults(jobId);
};

/** Active ads from the LinkedIn Ad Library for a company page. */
const fetchAds: FetchFn = async (inputs) => {
  const jobId = await runAgent("linkedin", "ads-library", {
    urls: inputs.profileUrl, // company page URL, e.g. linkedin.com/company/acme
    maxResults: 5,
  });
  return waitForResults(jobId);
};

/** Posts first, then 1 commenter per post (post-comments takes post URLs). */
const fetchPostsWithCommenters: FetchFn = async (inputs) => {
  const postsJob = await runAgent("linkedin", "posts", {
    urls: inputs.profileUrl,
    maxResults: 5,
  });
  const posts = await waitForResults<{ postUrl?: string }>(postsJob);
  const leads: unknown[] = [];
  for (const post of posts.slice(0, 5)) {
    if (!post.postUrl) continue;
    try {
      const commentsJob = await runAgent("linkedin", "post-comments", {
        posts: post.postUrl,
        maxResults: 1,
      });
      const comments = await waitForResults<unknown>(commentsJob);
      leads.push({ postUrl: post.postUrl, commenter: comments[0] ?? null });
    } catch {
      // skip posts whose comments are inaccessible
    }
  }
  return leads;
};

/** Recent posts a profile has commented on (excluding their own). */
const fetchProfileComments: FetchFn = async (inputs) => {
  const jobId = await runAgent("linkedin", "profile-comments", {
    profiles: inputs.profileUrl,
    maxResults: 5,
  });
  return waitForResults(jobId);
};

const STRATEGIES: Record<EmailToolStrategy, FetchFn> = {
  posts: fetchPosts,
  ads: fetchAds,
  "posts-comments": fetchPostsWithCommenters,
  "profile-comments": fetchProfileComments,
};

/**
 * Returns the raw rows for a tool's strategy, ready for the LLM layer.
 * Throws for tools not in the registry (they are not pipeline tools).
 */
export async function fetchToolData(
  strategy: EmailToolStrategy,
  inputs: Record<string, string>
): Promise<unknown[]> {
  return STRATEGIES[strategy](inputs);
}
