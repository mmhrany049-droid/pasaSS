# Architecture Decision Records
Status: **LOCKED** (change only with owner approval) · **DEFAULT** (chosen; changeable via setting or later ADR) · **OPEN** (see 19_OPEN_QUESTIONS).

| ID | Decision | Status |
|---|---|---|
| ADR-001 | Product form: local-first PWA served from localhost; installable; no hosting. Desktop wrapper (Tauri 2) optional in M12. | LOCKED |
| ADR-002 | Language: TypeScript 5 strict. Node 20 LTS for tooling. | LOCKED |
| ADR-003 | UI: React 18 + Vite + Tailwind CSS (logical properties for RTL) + Radix UI primitives + Framer Motion. | DEFAULT |
| ADR-004 | Storage: IndexedDB via Dexie 4. Call `navigator.storage.persist()`. Images → WebP compressed, stored as Blobs. | LOCKED |
| ADR-005 | State: Zustand for UI state; domain access only through repositories; `liveQuery` for reactive reads. | DEFAULT |
| ADR-006 | Dates: store `at` as ISO-8601 UTC and `localDate` as `YYYY-MM-DD` in Asia/Tehran; display Jalali via `date-fns-jalali`. | LOCKED |
| ADR-007 | Engines (DNAS, PAAS, PLN, INT) run in a Web Worker via Comlink. | DEFAULT |
| ADR-008 | Charts: Apache ECharts (+ echarts-gl for 3D). Every 3D chart has a 2D twin. | DEFAULT |
| ADR-009 | Review scheduler: FSRS via `ts-fsrs` (default params, desired retention 0.90, max interval 365d). Replaces Leitner from v0.1. | LOCKED |
| ADR-010 | Percent formula `P=(3C−W)/(3N)×100`; range [−33.33, 100]; N=0 → null. | LOCKED |
| ADR-011 | Guess (`isGuess`): counts as C/W normally for percent (exam truth). For mastery, a correct guess has weight 0.5 and creates/keeps a ReviewItem. | LOCKED (resolves v0.2 "half correct" ambiguity) |
| ADR-012 | Result codes: C (correct), W (wrong), B (blank), U (uncorrected — no key yet). U auto-corrects when key arrives. | LOCKED |
| ADR-013 | Numbering: `numberingRoot` per node (global / perChapter / perNode). Question id = `${bookId}:${scopeNodeId|'g'}:${number}`. | LOCKED |
| ADR-014 | Physics "درس‌نامه" = node kind `theory` (no questions); "پرسش‌ها" = `topic` leaf. | LOCKED |
| ADR-015 | Taught states: `taughtAtSchool`, `selfStudied`, `mastered`. Coverage uses `selfStudied`+`mastered`. | LOCKED |
| ADR-016 | Checkup/comprehensive/final nodes are not topics; results distributed to `coversNodeIds` (weight 1/|covers|) unless `topicNodeIds` set. `mixed` counts toward parent. | LOCKED |
| ADR-017 | Repeat exams: weight 0.4 in prediction, shown separately. | DEFAULT |
| ADR-018 | Organizer bias correction for predictions (per organizer, EWMA of error, α=0.3, min 2 exams). | DEFAULT |
| ADR-019 | Mastery: time-decayed Dirichlet shrinkage per topic (spec 07 §4) **and** BKT per skill (spec 13). UI shows topic mastery; BKT drives recommendations. | LOCKED |
| ADR-020 | No remote AI APIs. Assistant R1 = rule engine + Persian templates + MiniSearch local index. Optional self-hosted LLM only in R4 behind admin flag. | LOCKED |
| ADR-021 | ML (R2): train in Python/PyTorch offline; export ONNX; run with onnxruntime-web (WASM). Classical models remain as permanent fallback. | LOCKED |
| ADR-022 | Personality: no types. ~~Optional dimensional questionnaires only, off by default~~ → **amended by ADR-030**. Never used to restrict content. | LOCKED |
| ADR-023 | Hub (R3): Node 20 + Fastify + PostgreSQL 16 (SQLite allowed for single-school). Sync = outbox + cursor + tombstones; grades/roles server-authoritative. | DEFAULT |
| ADR-024 | Telegram (R4): grammY; webhook or long-polling; outbound connection via configurable standard HTTP(S)/SOCKS5 proxy setting (operator responsible for legal compliance); bot never carries grades/sensitive data. | DEFAULT |
| ADR-025 | Testing: Vitest, fast-check (property tests for engines), Playwright, axe-core. | LOCKED |
| ADR-026 | Week starts Saturday; Friday weekend; Iranian holidays come from editable calendar data, not hardcoded. | LOCKED |
| ADR-027 | Curriculum rules (final-exam subjects, coefficients, konkur weights) stored as dated data records with source + effective range. | LOCKED |

## v2 decisions (2026-10-02, owner review)
| ID | Decision | Status |
|---|---|---|
| ADR-028 | Practice entry = wizard subject → book → range → answer list → approximate total time (spec 20). Per-question time is not required; `Session.timeSource` + derived `secPerQ`; engines use `userMedianSecPerQ`. Error analysis deferrable (`ErrorAnalysisTask`). | LOCKED |
| ADR-029 | Rewards v2: XP (levels) + Coins (personal real-life reward shop) + quests + decaying mastery badges + flexible consistency; rewards only for learning behaviors/gains; anti-gaming rules (spec 11). | LOCKED |
| ADR-030 | Learner profile (spec 21): Layer A opt-in questionnaires incl. Mini-IPIP Big Five in **R1** (was R2), Layer B behavioral signals, Layer C adaptation hypotheses. Still no types/labels; behavior outweighs questionnaires. | LOCKED |
| ADR-031 | Adaptation engine (spec 22): constrained Thompson sampling per decision point with probability clipping [0.1,0.9], CUSUM drift detection, per-user time-of-day and fatigue models; all decisions logged with propensity. | DEFAULT |
| ADR-032 | PAAS v2 (spec 24): exam blueprints, FSRS-curve forgetting to exam date, untaught/untested priors, readiness index, gain-per-minute action plan sent to planner as draft. | LOCKED |
| ADR-033 | Analytics v2 (spec 23): points-lost decomposition, guess efficiency, transfer gap, forgetting curve, learning velocity, insight engine with Bayesian + BH-FDR guards, max 5 insights/week. | DEFAULT |
| ADR-034 | Assistant v2 (spec 12): Telegram-style guided flows (JSON Flow DSL) + inline buttons + slash commands + coach KB with sources; same flows reused by R4 Telegram adapter. | LOCKED |
| ADR-035 | Seed books: Physics 2 (Kheili Sabz), Chemistry 2 (Mobtakeran), **Calculus 1 (Nashr-e Olgoo)** added; OPEN-03 closed. | LOCKED |

## v4 decisions (2026-10-02)
| ID | Decision | Status |
|---|---|---|
| ADR-040 | Curriculum catalog (official textbooks, edition 1405) is the anchor for all analytics and pooling; test-book nodes map many-to-many with weights (spec 30). Grade 12 empty until owner input. | LOCKED |
| ADR-041 | Equal split `1/|covers|` for exam-like questions removed; probabilistic attribution + one-tap tagging (spec 31 TB-5). Mixed/exam-like evidence feeds transfer, not blocked mastery. | LOCKED |
| ADR-042 | Immutable internal `qid`; printed number is a label in a numbering scope; book editions first-class (spec 31). | LOCKED |
| ADR-043 | History import has three levels (item, aggregate, report card) with approximate dates (spec 33). | LOCKED |
| ADR-044 | One Learner Brain (event-sourced LSG) is the only place that computes learner state; consumers subscribe to diffs (spec 34). | LOCKED |
| ADR-045 | Neural networks are trained on pooled population data only and fused with personal Bayesian models; no full on-device training (spec 34). | LOCKED |
| ADR-046 | Multi-user = signed file bundles via a mailbox bot and an aggregator on the owner's PC; no hosting; transport swappable (spec 35/36). | LOCKED |
| ADR-047 | Prompt-based conversion of TOCs/exams to SSB/SSE happens outside the app (user copies prompt); app validates + stages. Hard rule 1 unchanged. | LOCKED |
| ADR-048 | v3 `prototype_src/` and `reference_engine/` are UI/behavior references only; spec 38 fixes are mandatory when porting. | LOCKED |
