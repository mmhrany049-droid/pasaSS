# CHANGELOG v3.0 (2026-10-02)
- Audit of all modules: `AUDIT_v3.md` (33 items, status per item).
- New specs: 25 data integrity & edge cases · 26 statistical safety · 27 security/backup/privacy · 28 performance & QA · 29 future features (OCR, notebook, focus timer, rank).
- Fixed: v1 workload vector; readiness clamp; gain formula for blanks; FSRS curve source; dailyLoad vs cap; chronotype default; raw TOC patterns (درس/بخش ordinal).
- Added: 10 assistant flows (13 total) + schema button `action`; 8 questionnaires with Persian items; safety lexicon file.
- Added: `reference_engine/engine.js` + `run_vectors.mjs` (61 checks) + `raw_toc_check.mjs` (your 3 TOCs → seeds, exact match).
- Added: `prototype_src/` React prototype (published as ClickUp artifact).
