import { ToolGateForm } from "@/components/ToolGateForm";

/**
 * Maps each tool slug to its gate props. One modular form component drives
 * every tool (URL -> email gate -> results-by-email).
 */
const toolProps: Record<
  string,
  {
    toolName: string;
    inputLabel: string;
    inputPlaceholder: string;
    inputType?: "url" | "name";
  }
> = {
  "linkedin-post-spy": {
    toolName: "LinkedIn Post Spy",
    inputLabel: "Competitor's LinkedIn URL",
    inputPlaceholder: "linkedin.com/in/founder or linkedin.com/company/acme",
  },
  "linkedin-ad-spy": {
    toolName: "LinkedIn Ad Spy",
    inputLabel: "Competitor's company name",
    inputPlaceholder: "Acme Inc",
    inputType: "name",
  },
  "steal-competitor-leads": {
    toolName: "Steal Competitor Leads",
    inputLabel: "Competitor's LinkedIn URL",
    inputPlaceholder: "linkedin.com/in/founder or linkedin.com/company/acme",
  },
  "find-lost-leads": {
    toolName: "Find Lost Leads",
    inputLabel: "Your LinkedIn URL",
    inputPlaceholder: "linkedin.com/in/you or linkedin.com/company/yours",
  },
  "competitor-engagement-spy": {
    toolName: "Competitor Engagement Spy",
    inputLabel: "Competitor's LinkedIn profile URL",
    inputPlaceholder: "linkedin.com/in/competitor",
  },
  "lead-journey-finder": {
    toolName: "Lead Journey Finder",
    inputLabel: "Lead's LinkedIn profile URL",
    inputPlaceholder: "linkedin.com/in/your-lead",
  },
};

export default function ToolForm({ slug }: { slug: string }) {
  const props = toolProps[slug];
  if (!props) return null;
  return <ToolGateForm tool={slug} {...props} />;
}
