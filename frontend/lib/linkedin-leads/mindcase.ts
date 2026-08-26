const POSTS_RUN_ENDPOINT = "https://api.mindcase.co/v1/data/linkedin/posts/run";
const COMMENTS_RUN_ENDPOINT = "https://api.mindcase.co/v1/data/linkedin/post-comments/run";
const JOBS_BASE = "https://api.mindcase.co/v1/jobs";

export interface MindcasePost {
  postId: string;
  postUrl: string;
  postText?: string | null;
  postedDate?: string | null;
}

export interface MindcaseComment {
  comment: string;
  postUrl: string;
  isAuthor: boolean;
  commentId: string;
  commentUrl: string;
  commentedAt?: string | null;
  commenterUrl: string;
  commenterName: string;
  commenterHeadline?: string | null;
  commenterFollowers?: number | null;
}

export interface MindcaseJobStatus<T> {
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  data?: T[];
  error?: string;
}

function getApiKey(): string {
  const apiKey = process.env.MINDCASE_API_KEY;
  if (!apiKey) {
    throw new Error("MINDCASE_API_KEY is not configured");
  }
  return apiKey;
}

async function runAgent(endpoint: string, params: Record<string, unknown>): Promise<string> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ params }),
  });

  if (!response.ok) {
    throw new Error(`mindcase request to ${endpoint} failed (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { job_id?: string };
  if (!data.job_id) {
    throw new Error(`mindcase response from ${endpoint} did not include a job_id`);
  }
  return data.job_id;
}

/** Kicks off a LinkedIn posts search job on mindcase and returns its job id immediately. */
export async function startPostsJob(profileUrl: string, maxResults: number): Promise<string> {
  return runAgent(POSTS_RUN_ENDPOINT, { urls: profileUrl, maxResults });
}

/** Kicks off a job pulling comments for a single post and returns its job id immediately. */
export async function startCommentsJob(postUrl: string, maxResults: number): Promise<string> {
  return runAgent(COMMENTS_RUN_ENDPOINT, { posts: postUrl, maxResults });
}

/** Checks a job's status once (no polling loop) — callers poll this themselves. */
export async function getJobStatus<T>(jobId: string): Promise<MindcaseJobStatus<T>> {
  const response = await fetch(`${JOBS_BASE}/${jobId}/results`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  if (!response.ok) {
    throw new Error(`mindcase job status check failed (${response.status}): ${await response.text()}`);
  }

  return (await response.json()) as MindcaseJobStatus<T>;
}
