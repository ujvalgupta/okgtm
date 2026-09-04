# Marketing copy is authored in tracked markdown, not code

Status: accepted

Content is written and owned as markdown (`features/<slug>/copy.md`, `content/home/copy.md`),
tracked in the repo and colocated with what it describes, because the copywriter pipeline is
markdown-based and prose belongs in documents, not data files. Code keeps only the strings it
must render (`meta.ts`) and syncs them with copy.md by a documented manual hand-off noted in
both files. We deliberately did NOT single-source rendered copy in code data: that forces the
copywriter to edit code and converts every content tweak into a deploy. We accept that the
hand-off can drift (it caused the ad-spy copy bug under the old god-file); the mitigation is
colocation — copy.md and meta.ts sit side by side in the same tool folder — not elimination.
Scraped competitor reference material stays out of the repo entirely (gitignored `artifacts/`).
