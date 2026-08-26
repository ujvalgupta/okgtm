const RUN_ENDPOINT = "https://api.mindcase.co/v1/data/linkedin/posts/run";
const JOBS_BASE = "https://api.mindcase.co/v1/jobs";

export interface MindcaseMention {
  id?: string | null;
  url?: string | null;
  name?: string | null;
  type?: string | null;
  handle?: string | null;
}

export interface MindcasePost {
  postId: string;
  postUrl: string;
  postText?: string | null;
  postedDate?: string | null;
  reactions?: number | null;
  comments?: number | null;
  shares?: number | null;
  authorUrl?: string | null;
  authorName?: string | null;
  authorHandle?: string | null;
  authorHeadline?: string | null;
  authorType?: string | null;
  authorAvatar?: string | null;
  authorFollowers?: number | null;
  postMediaUrl?: string | null;
  postMediaType?: string | null;
  articleUrl?: string | null;
  repostNote?: string | null;
  mentions?: MindcaseMention[];
}

export interface MindcaseJobStatus {
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  data?: MindcasePost[];
  error?: string;
}

function getApiKey(): string {
  const apiKey = process.env.MINDCASE_API_KEY;
  if (!apiKey) {
    throw new Error("MINDCASE_API_KEY is not configured");
  }
  return apiKey;
}

/** Kicks off a LinkedIn posts search job on mindcase and returns its job id immediately. */
export async function startPostsJob(profileUrl: string, maxResults: number): Promise<string> {
  const response = await fetch(RUN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ params: { urls: profileUrl, maxResults } }),
  });

  if (!response.ok) {
    throw new Error(`mindcase linkedin posts request failed (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { job_id?: string };
  if (!data.job_id) {
    throw new Error("mindcase linkedin posts response did not include a job_id");
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
