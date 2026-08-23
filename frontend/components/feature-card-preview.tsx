/**
 * Mini product-UI fragments for each feature card.
 * Real component previews per SKILL.md §4.8 (no fake div screenshots).
 * All data is illustrative sample data, not fake-precise numbers.
 */

/* ── Lead capture: mini source routing list ── */
export function LeadCapturePreview() {
  const sources = [
    { label: "Website form", count: 12 },
    { label: "LinkedIn", count: 7 },
    { label: "Inbound chat", count: 4 },
  ];
  return (
    <div className="mt-5 space-y-1.5" aria-hidden="true">
      {sources.map((s) => (
        <div
          key={s.label}
          className="flex items-center justify-between rounded-[8px] bg-white/20 px-3 py-1.5 text-[11px]"
        >
          <span className="font-medium">{s.label}</span>
          <span className="opacity-70">{s.count} routed</span>
        </div>
      ))}
    </div>
  );
}

/* ── Enrichment: field enrichment rows ── */
export function EnrichmentPreview() {
  const fields = [
    { field: "Company size", value: "51-200" },
    { field: "Industry", value: "B2B SaaS" },
    { field: "Title", value: "VP Revenue" },
    { field: "Intent score", value: "84" },
  ];
  return (
    <div className="mt-5 space-y-1.5" aria-hidden="true">
      {fields.map((f) => (
        <div
          key={f.field}
          className="flex items-center justify-between rounded-[8px] bg-white/15 px-3 py-1.5 text-[11px]"
        >
          <span className="opacity-70">{f.field}</span>
          <span className="font-medium">{f.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Outbound: sequence step chips ── */
export function OutboundPreview() {
  const steps = ["Day 1: Email", "Day 3: LinkedIn", "Day 7: Follow-up"];
  return (
    <div className="mt-5 flex flex-wrap gap-1.5" aria-hidden="true">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          <span className="rounded-[6px] bg-white/20 px-2.5 py-1 text-[11px] font-medium">
            {s}
          </span>
          {i < steps.length - 1 && (
            <span className="text-[10px] opacity-50" aria-hidden="true">
              &rarr;
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Follow-ups: activity timeline ── */
export function FollowUpPreview() {
  const events = [
    { time: "2h ago", action: "Email opened", active: true },
    { time: "1d ago", action: "Follow-up sent", active: false },
    { time: "3d ago", action: "First touch", active: false },
  ];
  return (
    <div className="mt-5 space-y-2" aria-hidden="true">
      {events.map((e) => (
        <div key={e.action} className="flex items-center gap-2.5 text-[11px]">
          <span className="w-11 shrink-0 opacity-60">{e.time}</span>
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${e.active ? "bg-current" : "bg-current opacity-40"}`}
          />
          <span className="font-medium">{e.action}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Sales handoff: context checklist ── */
export function HandoffPreview() {
  const items = [
    "Enrichment data",
    "Sequence history",
    "Activity log",
  ];
  return (
    <div className="mt-5 space-y-1.5" aria-hidden="true">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-2 text-[11px]">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-white/20 text-[9px]">
            &#10003;
          </span>
          <span className="font-medium">{item}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Reporting: mini funnel bars ── */
export function ReportingPreview() {
  const stages = [
    { label: "Captured", pct: 100 },
    { label: "Enriched", pct: 78 },
    { label: "Sequenced", pct: 61 },
    { label: "Closed", pct: 23 },
  ];
  return (
    <div className="mt-5 space-y-2" aria-hidden="true">
      {stages.map((s) => (
        <div key={s.label} className="text-[11px]">
          <div className="mb-0.5 flex justify-between">
            <span className="font-medium">{s.label}</span>
            <span className="opacity-60">{s.pct}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-current/10">
            <div
              className="h-full rounded-full bg-current opacity-50"
              style={{ width: `${s.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
