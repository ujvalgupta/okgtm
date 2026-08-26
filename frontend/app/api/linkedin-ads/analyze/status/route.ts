import { getJobStatus } from "@/lib/linkedin-ads/mindcase";
import { summarizeAdStrategy } from "@/lib/linkedin-ads/openrouter";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  const companyName = url.searchParams.get("companyName");

  if (!jobId || !companyName) {
    return Response.json({ ok: false, error: "jobId and companyName are required" }, { status: 400 });
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

    const ads = job.data ?? [];
    const summary = await summarizeAdStrategy(companyName, ads);

    return Response.json({ ok: true, status: "completed", companyName, ads, summary });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }
}
