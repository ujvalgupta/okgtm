/**
 * Mindcase third-party API helpers (run inside Convex actions).
 *
 * Real agent inventory (verified from GET /v1/data/all):
 *   linkedin/posts            {urls | queries, maxResults}
 *   linkedin/ads-library      {urls (ad library or company URL), maxResults}
 *   linkedin/post-comments    {posts (post URL), maxResults, postedLimit}
 *   linkedin/profile-comments {profiles (profile URL), maxResults, postedLimit}
 *   linkedin/profiles | companies | emails | jobs | reactions | employees
 */

const DATA_BASE = "https://api.mindcase.co/v1/data";
const JOBS_BASE = "https://api.mindcase.co/v1/jobs";

function getApiKey(): string {
  const apiKey = process.env.MINDCASE_API_KEY;
  if (!apiKey) throw new Error("MINDCASE_API_KEY is not configured");
  return apiKey;
}

/** Start a mindcase job for group/slug with params; returns the job id. */
export async function runAgent(
  group: string,
  slug: string,
  params: Record<string, unknown>
): Promise<string> {
  const response = await fetch(`${DATA_BASE}/${group}/${slug}/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ params }),
  });
  if (!response.ok) {
    throw new Error(
      `mindcase ${group}/${slug} request failed (${response.status}): ${await response.text()}`
    );
  }
  const data = (await response.json()) as { job_id?: string; jobId?: string };
  const jobId = data.job_id ?? data.jobId;
  if (!jobId) throw new Error("mindcase did not return a job id");
  return jobId;
}

/** Poll a job until terminal, then fetch its results. */
export async function waitForResults<T>(
  jobId: string,
  maxAttempts = 60,
  delayMs = 3000
): Promise<T[]> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${JOBS_BASE}/${jobId}`, {
      headers: { Authorization: `Bearer ${getApiKey()}` },
    });
    if (!response.ok) {
      throw new Error(`mindcase status failed (${response.status}): ${await response.text()}`);
    }
    const status = (await response.json()) as {
      status: "queued" | "running" | "completed" | "failed" | "cancelled";
      error?: string | null;
    };
    if (status.status === "completed") {
      return fetchResults<T>(jobId);
    }
    if (status.status === "failed" || status.status === "cancelled") {
      throw new Error(status.error || `mindcase job ${status.status}`);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("mindcase job timed out");
}

/** Completed jobs expose their rows via GET /v1/jobs/{id}/results. */
async function fetchResults<T>(jobId: string): Promise<T[]> {
  const response = await fetch(`${JOBS_BASE}/${jobId}/results`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
  if (!response.ok) {
    throw new Error(`mindcase results failed (${response.status}): ${await response.text()}`);
  }
  const data = (await response.json()) as { data?: unknown[]; row_count?: number };
  return Array.isArray(data.data) ? (data.data as T[]) : [];
}
