import { getJobStatus } from "@/lib/linkedin-engagement/mindcase";

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

    // Never surface comments the profile left on their own posts — only on others'.
    const engagements = (job.data ?? []).filter((comment) => !comment.onOwnPost);

    return Response.json({ ok: true, status: "completed", profileUrl, engagements });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }
}
