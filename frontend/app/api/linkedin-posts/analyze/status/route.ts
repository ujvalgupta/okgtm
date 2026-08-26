import { getJobStatus } from "@/lib/linkedin-posts/mindcase";
import { summarizeContentStrategy } from "@/lib/linkedin-posts/openrouter";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  const profileUrl = url.searchParams.get("profileUrl");

  if (!jobId || !profileUrl) {
    return Response.json({ ok: false, error: "jobId and profileUrl are required" }, { status: 400 });
  }

  try {
    const job = await getJobStatus(jobId);

    if (job.status === "failed" || job.status === "cancelled") {
      return Response.json(
        { ok: false, error: `mindcase job ${job.status}: ${job.error ?? "no error detail"}` },
        { status: 502 },
      );
    }

    if (job.status !== "completed") {
      return Response.json({ ok: true, status: job.status });
    }

    const posts = job.data ?? [];
    const summary = await summarizeContentStrategy(profileUrl, posts);

    return Response.json({ ok: true, status: "completed", profileUrl, posts, summary });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }
}
