/**
 * Mini funnel-automation preview for the hero right column.
 * Shows a realistic-looking pipeline board with lead rows and automation steps.
 * Per SKILL.md §4.8: real component previews when no image-gen tool is available.
 */

const leads = [
  {
    name: "Mara Solis",
    company: "Brightpath",
    status: "Qualified",
    statusBg: "bg-success",
  },
  {
    name: "Devon Hale",
    company: "Nuvora",
    status: "Enriched",
    statusBg: "bg-brand-ochre",
  },
  {
    name: "Priya Nair",
    company: "Stackline",
    status: "New",
    statusBg: "bg-brand-lavender",
  },
  {
    name: "Luca Ferri",
    company: "Onward.io",
    status: "Sequenced",
    statusBg: "bg-brand-pink",
  },
];

const automationSteps = [
  "Capture",
  "Enrich",
  "Sequence",
  "Notify rep",
];

export function HeroProductPreview() {
  return (
    <div
      className="rounded-[24px] bg-surface-soft p-5 sm:p-6"
      aria-hidden="true"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Funnel automations
        </span>
        <span className="rounded-pill bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
          Live
        </span>
      </div>

      {/* Lead rows */}
      <div className="mb-5 space-y-2">
        {leads.map((lead) => (
          <div
            key={lead.name}
            className="flex items-center justify-between rounded-[12px] bg-canvas px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {lead.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {lead.company}
              </p>
            </div>
            <span
              className={`${lead.statusBg} shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-semibold text-on-primary`}
            >
              {lead.status}
            </span>
          </div>
        ))}
      </div>

      {/* Automation pipeline */}
      <div>
        <span className="mb-2 block text-xs font-semibold text-muted-foreground">
          Pipeline
        </span>
        <div className="flex flex-wrap gap-1.5">
          {automationSteps.map((step, i) => (
            <div key={step} className="flex items-center gap-1.5">
              <span className="rounded-[8px] bg-surface-card px-2 py-1 text-[11px] font-medium text-body-strong">
                {step}
              </span>
              {i < automationSteps.length - 1 && (
                <span
                  className="text-xs text-muted-soft"
                  aria-hidden="true"
                >
                  &rarr;
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
