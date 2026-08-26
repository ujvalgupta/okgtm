import { LINKEDIN_LEADS_CONFIG } from "@/config/linkedin-leads";
import { linkedInUrlsMatch } from "@/lib/linkedin-leads/profile-url";
import {
  getJobStatus,
  startCommentsJob,
  type MindcaseComment,
  type MindcasePost,
} from "@/lib/linkedin-leads/mindcase";

interface CommentJobRef {
  postUrl: string;
  postedDate: string | null;
  commentJobId: string;
}

interface Lead {
  commenterName: string;
  commenterUrl: string;
  commenterHeadline?: string | null;
  comment: string;
  commentedAt?: string | null;
  postUrl: string;
  postedDate: string | null;
}

interface StatusPayload {
  phase?: unknown;
  profileUrl?: unknown;
  jobId?: unknown;
  commentJobs?: unknown;
}

function isCommentJobRef(value: unknown): value is CommentJobRef {
  if (typeof value !== "object" || value === null) return false;
  const ref = value as Record<string, unknown>;
  return (
    typeof ref.postUrl === "string" &&
    typeof ref.commentJobId === "string" &&
    (ref.postedDate === null || typeof ref.postedDate === "string")
  );
}

export async function POST(request: Request): Promise<Response> {
  let payload: StatusPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const { phase, profileUrl } = payload;
  if (typeof profileUrl !== "string" || !profileUrl.trim()) {
    return Response.json({ ok: false, error: "profileUrl is required" }, { status: 400 });
  }

  try {
    if (phase === "posts") {
      const { jobId } = payload;
      if (typeof jobId !== "string") {
        return Response.json({ ok: false, error: "jobId is required for phase=posts" }, { status: 400 });
      }

      const job = await getJobStatus<MindcasePost>(jobId);
      if (job.status === "failed" || job.status === "cancelled") {
        return Response.json(
          { ok: false, error: `mindcase job ${job.status}: ${job.error ?? "no error detail"}` },
          { status: 502 },
        );
      }
      if (job.status !== "completed") {
        return Response.json({ ok: true, status: "running", phase: "posts" });
      }

      const posts = (job.data ?? [])
        .filter((post) => typeof post.postUrl === "string" && post.postUrl)
        .slice(0, LINKEDIN_LEADS_CONFIG.maxPosts);

      if (posts.length === 0) {
        return Response.json({ ok: true, status: "completed", profileUrl, leads: [] });
      }

      const commentJobs: CommentJobRef[] = await Promise.all(
        posts.map(async (post) => ({
          postUrl: post.postUrl,
          postedDate: post.postedDate ?? null,
          commentJobId: await startCommentsJob(post.postUrl, LINKEDIN_LEADS_CONFIG.maxCommentsPerPost),
        })),
      );

      return Response.json({ ok: true, status: "running", phase: "comments", commentJobs });
    }

    if (phase === "comments") {
      const { commentJobs } = payload;
      if (!Array.isArray(commentJobs) || !commentJobs.every(isCommentJobRef)) {
        return Response.json({ ok: false, error: "commentJobs is required for phase=comments" }, { status: 400 });
      }

      const results = await Promise.all(
        commentJobs.map(async (ref) => ({ ref, job: await getJobStatus<MindcaseComment>(ref.commentJobId) })),
      );

      const stillRunning = results.some(
        ({ job }) => job.status === "queued" || job.status === "running",
      );
      if (stillRunning) {
        return Response.json({ ok: true, status: "running", phase: "comments" });
      }

      const leads: Lead[] = [];
      for (const { ref, job } of results) {
        if (job.status !== "completed") continue;
        const comment = job.data?.[0];
        if (!comment) continue;
        if (comment.isAuthor) continue;
        if (linkedInUrlsMatch(comment.commenterUrl, LINKEDIN_LEADS_CONFIG.ownerProfileUrl)) continue;

        leads.push({
          commenterName: comment.commenterName,
          commenterUrl: comment.commenterUrl,
          commenterHeadline: comment.commenterHeadline,
          comment: comment.comment,
          commentedAt: comment.commentedAt,
          postUrl: ref.postUrl,
          postedDate: ref.postedDate,
        });
      }

      return Response.json({ ok: true, status: "completed", profileUrl, leads });
    }

    return Response.json({ ok: false, error: "phase must be 'posts' or 'comments'" }, { status: 400 });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }
}
