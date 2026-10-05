# SS (Study System) — Coding Handoff Package v4.0

> **v4 (2026-10-02):** full redesign pass on top of v3. Start with `reference/SS_v4_overview_fa.md` (Persian, for the owner) and `CHANGELOG_v4.md` + `AUDIT_v4.md` (for the coding agent). New: curriculum catalog for **both streams, grades 10–11** (grade 12 empty, ready), cross-stream links, test-book rules v4, SSB v2 + conversion prompts, history & past-exam import, the Learner Brain, file-based multi-user network, bundle formats, restored v0.x features, mandatory engine fixes, open-source stack.


> **v3 (2026-10-02):** full audit `AUDIT_v3.md` (33 items). New specs 25–29, all 13 assistant flows, 9 questionnaires, `reference_engine/` (runs: `node reference_engine/run_vectors.mjs` → 61/61), `prototype_src/` (working React prototype), fixed v1 test vector.

> **v2 (2026-10-02):** owner review applied. Start with `CHANGELOG_v2.md`, then the read order below. New specs 20–24, rewritten 11 and 12, new seed `calculus1_olgoo.ssb`, `tests/test_vectors_v2.json`, `assistant/` flows, `psy/` instrument, `reference/RESEARCH_BASIS.md`, Persian summary `reference/SS_v2_changes_fa.md`.

> **فارسی:** این بسته برای تحویل به یک هوش مصنوعی یا تیم کدنویس آماده شده است. سندهای فنی عمداً به انگلیسی نوشته شده‌اند تا ابهام در کدنویسی کم شود؛ همه متن‌های رابط کاربری فارسی‌اند. اول فایل `01_AGENT_BRIEF.md` را به هوش مصنوعی کدنویس بدهید.

Date: 2026-10-01 · Owner: Mehran Mehrani · Status: **Ready for implementation of Release 1 (Personal)**; later releases are specified to the level needed so v1 does not block them.

## Read order (mandatory for the coding agent)

| # | File | Purpose |
|---|---|---|
| 1 | `01_AGENT_BRIEF.md` | Master instructions + hard rules for the coding AI |
| 2 | `02_SCOPE_AND_RELEASES.md` | What to build now vs later, exit criteria |
| 3 | `03_DECISIONS_ADR.md` | Locked technical decisions (do not change silently) |
| 4 | `04_GLOSSARY.md` | Names of modules/entities (use exactly) |
| 5 | `specs/05_ARCHITECTURE.md` | Stack, layers, folder layout, event bus |
| 6 | `specs/06_DOMAIN_MODEL.md` + `schemas/entities.schema.json` | Every entity and field |
| 7 | `specs/07_ALGORITHMS.md` + `tests/test_vectors.json` | Exact formulas + expected numbers |
| 8 | `specs/08_SSB_FORMAT.md` + `seed/*.ssb` | Book import format, grammar, sample books |
| 9 | `specs/09_UI_UX.md` | Screens, components, RTL, keyboard, states |
| 10 | `specs/10_PLANNER.md` | Weekly/long-term planner |
| 11 | `specs/11_REWARDS_AND_PSYCH.md` | Rewards, self-regulation, questionnaires, safety |
| 12 | `specs/12_ASSISTANT.md` | Local assistant (no AI APIs) |
| 13 | `specs/13_INTELLIGENCE_ML.md` | BKT/IRT/PFA, skill graph, GRU/GNN ladder |
| 14 | `specs/14_SYNC_HUB_MULTIUSER.md` + `api/hub_sync.openapi.yaml` | Future: hub, sync, schools, classes |
| 15 | `specs/15_TELEGRAM_BOT.md` | Future: bot adapter + network/proxy settings |
| 16 | `specs/16_SECURITY_PRIVACY_CONTENT.md` | Data classes, consent, rights, backup |
| 17 | `specs/17_ACCEPTANCE_TESTS.md` | Gherkin acceptance criteria |
| 18 | `18_TASK_BREAKDOWN.md` | Milestones → tickets → dependencies → DoD |
| 19 | `19_OPEN_QUESTIONS.md` | Items needing Mehran's answer (do not guess) |
| 20 | `specs/20_PRACTICE_ENTRY_V2.md` | New practice entry wizard (replaces v1 flow) |
| 21 | `specs/21_PROFILE_PERSONALITY.md` + `psy/` | Learner profile: questionnaires + behavior |
| 22 | `specs/22_ADAPTATION_ENGINE.md` | Behavioral adaptation (bandit, drift, time-of-day) |
| 23 | `specs/23_ANALYTICS_V2.md` | Analytics v2 + insight engine |
| 24 | `specs/24_EXAM_READINESS_V2.md` | Prediction, readiness, gap lists, planner link |
| 25–29 | `specs/25..29` | Data integrity, statistical safety, security/backup, performance/QA, future features (v3) |
| 30 | `specs/30_CURRICULUM_CATALOG.md` + `curriculum/` | **v4** textbook catalog, programs, cross-stream links |
| 31 | `specs/31_TEST_BOOK_RULES_V4.md` | **v4** book rules (wins over 06–08, 25 on conflict) |
| 32 | `specs/32_SSB_V2_FORMAT.md` + `prompts/` | **v4** SSB v2 + prompt workflow |
| 33 | `specs/33_HISTORY_IMPORT.md` | **v4** old tests + past exams import |
| 34 | `specs/34_LEARNER_BRAIN.md` | **v4** connected adaptive brain (supersedes 13 ladder) |
| 35 | `specs/35_POPULATION_NETWORK.md` | **v4** multi-user without hosting |
| 36 | `specs/36_BUNDLE_FORMATS.md` + `schemas/bundle_v4.schema.json` | **v4** .ssx/.ssp/.ssbak |
| 37 | `specs/37_RESTORED_FEATURES.md` | **v4** features from v0.1–v0.3 restored + nav |
| 38 | `specs/38_ENGINE_FIXES_V4.md` | **v4** mandatory fixes to v3 engine/prototype |
| 39 | `specs/39_OPEN_SOURCE_STACK.md` | **v4** GitHub building blocks |
| — | `assistant/` + `schemas/assistant_flow.schema.json` | Flow DSL samples |
| — | `reference/RESEARCH_BASIS.md` | Evidence and citations behind every rule |
| — | `tests/test_vectors_v4.json` | v4 vectors (gain, clamp, history L2, approx dates, propagation, fusion) |

Precedence (v4): spec 30–39 > 20–29 > 05–17 > reference docs. `prototype_src/` and `reference_engine/` are v3 references only (ADR-048).

## Source traceability
This package supersedes and consolidates: v0.1 (engineering doc, data model, algorithms, SSB format, UI), v0.2 (review + full engineering doc), v0.3 (senior review v2), the Initial Design Review, and the Master Blueprint (2026-10-01). Where they conflict, **this package wins**; conflicts resolved are listed in `03_DECISIONS_ADR.md`.
