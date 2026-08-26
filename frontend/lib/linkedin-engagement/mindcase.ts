const RUN_ENDPOINT = "https://api.mindcase.co/v1/data/linkedin/profile-comments/run";
const JOBS_BASE = "https://api.mindcase.co/v1/jobs";

export interface MindcaseProfileComment {
  commentId: string;
  comment: string;
  commentUrl: string;
  commentedAt?: string | null;
  commenterUrl: string;
  onOwnPost: boolean;
  postUrl: string;
  postText?: string | null;
  postDate?: string | null;
  postAuthor?: string | null;
  postAuthorUrl?: string | null;
  postAuthorHeadline?: string | null;
  postAuthorType?: string | null;
  postReactions?: number | null;
  postComments?: number | null;
}

export interface MindcaseJobStatus {
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  data?: MindcaseProfileComment[];
  error?: string;
}

function getApiKey(): string {
  const apiKey = process.env.MINDCASE_API_KEY;
  if (!apiKey) {
    throw new Error("MINDCASE_API_KEY is not configured");
  }
  return apiKey;
}

/** Kicks off a job pulling a profile's own comments across LinkedIn and returns its job id. */
export async function startProfileCommentsJob(profileUrl: string, maxResults: number): Promise<string> {
  const response = await fetch(RUN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ params: { profiles: profileUrl, maxResults } }),
  });

  if (!response.ok) {
    throw new Error(`mindcase profile-comments request failed (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { job_id?: string };
  if (!data.job_id) {
    throw new Error("mindcase profile-comments response did not include a job_id");
  }
  return data.job_id;
}

/** Checks a job's status once (no polling loop) — callers poll this themselves. */
export async function getJobStatus(jobId: string): Promise<MindcaseJobStatus> {
  const response = await fetch(`${JOBS_BASE}/${jobId}/results`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  if (!response.ok) {
    throw new Error(`mindcase job status check failed (${response.status}): ${await response.text()}`);
  }

  return (await response.json()) as MindcaseJobStatus;
}
