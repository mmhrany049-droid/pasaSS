# CHANGELOG v4.0 (2026-10-02) — owner review round 4
Inputs read: handoff v1/v2/v3, design docs V0.1 (5 docs), V0.2 (2 docs), V0.3 (cover page only; sub-pages missing from export), `books.rar` (22 TOC images, 19 unique, + help.txt).
## Added
- `curriculum/catalog.json` 14 textbooks, 370 nodes (rf.10, tj.10, rf.11, tj.11 verified; rf.12/tj.12 empty) · `links.json` 101 links · `CATALOG_fa.md`.
- Specs 30–39 (catalog, book rules v4, SSB v2, history import, Learner Brain, network, bundle formats, restored features, engine fixes, OSS stack).
- `prompts/PROMPT_TOC_TO_SSB_fa.md`, `prompts/PROMPT_EXAM_TO_SSE_fa.md`.
- `seed/curriculum_map_v4.json` mapping the 3 seed test books to the catalog.
- `schemas/curriculum_v4.schema.json`, `schemas/bundle_v4.schema.json`, `tests/test_vectors_v4.json`.
- ADR-040..048, OPEN-16..23, tickets SS-401..418, glossary entries.
## Changed
- Scope: Planner, Review, Settings, History import, Catalog, Brain core and bundle export/import are R1; new R1.5 Network; neural models trained on pooled data (R2).
- Spec 13 ladder superseded by 34; spec 14/15 annotated; spec 09 nav → spec 37.
## Fixed (documented, to implement)
- 23 defects in v3 engine/prototype (spec 38), including 4 items v3's audit marked as fixed but were not.
## Removed
- Rule "exam-like questions split equally 1/|covers|" (ADR-041).
