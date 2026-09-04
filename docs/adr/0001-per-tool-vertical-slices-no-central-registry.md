# Per-tool vertical slices with filesystem enumeration — no central registry

Status: accepted

The dynamic route `/tools/[slug]` needs a slug→module map, and we restructured (Sep 2026) so
that map is an enumeration of imports in `features/tools.ts` pointing at colocated per-tool
folders (`features/<slug>/`), each owning its copy, meta, engine, form, and tests. We rejected
both the previous central data registry (`lib/free-tools.ts`, which merged all tools' copy and
facts into one 718-line god file and silently drifted — the ad-spy copy/URL mismatch) and
scattering each tool across `lib/`, `components/`, and `app/` with no structural signal of
family. Tool facts stay colocated; the enumeration is pointers only, so "add a tool" means
"add a folder and one import line" and "find a tool" means "open one folder."
