const RUN_ENDPOINT = "https://api.mindcase.co/v1/data/linkedin/ads-library/run";
const JOBS_BASE = "https://api.mindcase.co/v1/jobs";

export interface MindcaseAd {
  adId: string;
  adUrl: string;
  advertiserUrl: string;
  paidBy?: string | null;
  format?: string | null;
  headline?: string | null;
  body?: string | null;
  clickUrl?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  started?: string | null;
  ended?: string | null;
  daysActive?: number | null;
  impressions?: string | null;
  impressionsByCountry?: unknown[];
  targetingLocation?: unknown;
}

export interface MindcaseJobStatus {
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  data?: MindcaseAd[];
  error?: string;
}

function getApiKey(): string {
  const apiKey = process.env.MINDCASE_API_KEY;
  if (!apiKey) {
    throw new Error("MINDCASE_API_KEY is not configured");
  }
  return apiKey;
}

/** Kicks off an ads-library search job on mindcase and returns its job id immediately. */
export async function startAdsJob(searchUrl: string, maxResults: number): Promise<string> {
  const response = await fetch(RUN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ params: { urls: searchUrl, maxResults } }),
  });

  if (!response.ok) {
    throw new Error(`mindcase ads-library request failed (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { job_id?: string };
  if (!data.job_id) {
    throw new Error("mindcase ads-library response did not include a job_id");
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
