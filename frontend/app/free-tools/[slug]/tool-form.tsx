"use client";

import PostSpyForm from "@/components/PostSpyForm";
import AdSpyForm from "@/components/AdSpyForm";
import LinkedInLeadsForm from "@/components/LinkedInLeadsForm";
import LinkedInEngagementForm from "@/components/LinkedInEngagementForm";

/**
 * Maps each tool slug to its working form component.
 * Props for LinkedInLeadsForm / LinkedInEngagementForm are tuned
 * per-slug so both "steal-competitor-leads" and "find-lost-leads"
 * share the same form with different UI copy.
 */
export default function ToolForm({ slug }: { slug: string }) {
  switch (slug) {
    case "linkedin-post-spy":
      return <PostSpyForm />;

    case "linkedin-ad-spy":
      return <AdSpyForm />;

    case "steal-competitor-leads":
      return (
        <LinkedInLeadsForm
          inputLabel="Competitor's LinkedIn URL"
          inputPlaceholder="linkedin.com/in/founder or linkedin.com/company/acme"
          submitLabel="Find their leads"
          scanningMessage="Scanning their recent posts…"
          analyzingPostsMessage="Pulling recent posts…"
          analyzingCommentsMessage="Scanning comments for leads…"
          emptyStateMessage="No engaged commenters found on their recent posts. Try a different profile or company page."
          resultsHeadingPrefix="Leads from"
        />
      );

    case "find-lost-leads":
      return (
        <LinkedInLeadsForm
          inputLabel="Your LinkedIn URL"
          inputPlaceholder="linkedin.com/in/you or linkedin.com/company/yours"
          submitLabel="Find my lost leads"
          scanningMessage="Scanning your recent posts…"
          analyzingPostsMessage="Pulling your recent posts…"
          analyzingCommentsMessage="Looking for unanswered comments…"
          emptyStateMessage="No unanswered commenters found on your recent posts. Looks like you're on top of things!"
          resultsHeadingPrefix="Lost leads from"
        />
      );

    case "competitor-engagement-spy":
      return (
        <LinkedInEngagementForm
          inputLabel="Competitor's LinkedIn profile URL"
          inputPlaceholder="linkedin.com/in/competitor"
          submitLabel="See who they're warming up"
          scanningMessage="Scanning their activity…"
          analyzingMessage="Analyzing their engagement patterns… this can take a couple of minutes"
          emptyStateMessage="No recent engagement found on other people's posts. They may not be actively commenting."
          resultsHeadingPrefix="Engagement by"
        />
      );

    case "lead-journey-finder":
      return (
        <LinkedInEngagementForm
          inputLabel="Lead's LinkedIn profile URL"
          inputPlaceholder="linkedin.com/in/your-lead"
          submitLabel="Map their interests"
          scanningMessage="Scanning their activity…"
          analyzingMessage="Mapping what they care about… this can take a couple of minutes"
          emptyStateMessage="No recent commenting activity found. This lead may not be actively engaging on LinkedIn."
          resultsHeadingPrefix="Interests of"
        />
      );

    default:
      return null;
  }
}
