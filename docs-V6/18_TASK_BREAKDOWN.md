# 18 — Task Breakdown (Release 1)
Format: ID · title · depends · done when.

## M0 Foundation
- SS-001 Repo scaffold (Vite+React+TS strict+Tailwind RTL+ESLint+Vitest+Playwright) · — · CI green
- SS-002 CI no-remote-AI check + CSP · 001 · build fails on forbidden SDK
- SS-003 Vazirmatn bundling, theme tokens light/dark · 001
- SS-004 `infra/digits.ts`, `infra/jalali.ts` (Sat-first weeks) · 001 · unit tests
- SS-005 Dexie schema v1 + migration framework + common fields · 001 · migration test
- SS-006 Event bus + domainEvents persistence + cache invalidation · 005
- SS-007 Worker bridge (Comlink) + `engine/prng.ts` · 001 · prng vector passes
- SS-008 App shell, nav, routes, i18n loader, toasts/undo · 003

## M1 Books (TKS)
- SS-010 SSB parser + raw TOC detection + errors · 004 · grammar tests, seeds parse with 0 errors
- SS-011 SSB serializer + round-trip · 010
- SS-012 Book/Node/Question repos + numbering scopes + range validation · 005,010
- SS-013 Seed import on first run · 012
- SS-014 Shelf + book editor tree (drag/drop) + SSB tab · 012 · TKS-1,2
- SS-015 Fast key entry + difficulty ranges + completeness · 012 · TKS-3,4

## M2 Practice (VKS)
- SS-020 `engine/scoring.ts` correct/percent · 007 · vectors
- SS-021 BubbleSheet component (keyboard, virtualized) · 008 · A11Y-2
- SS-022 Session create/save, multiple ranges, timer · 012,020
- SS-023 Correction animation + summary · 021
- SS-024 ReasonPicker + guess/important · 023 · VKS-3,5
- SS-025 U auto-correction on key.changed · 006,022 · VKS-2
- SS-026 Legacy records flow · 022 · VKS-4

## M3 Taught (MTS)
- SS-030 TaughtState/Event repos + tri-state logic · 012
- SS-031 TreeChecklist UI + history timeline · 030 · MTS-1

## M4 Review (MRS)
- SS-040 ReviewItem creation rules · 024
- SS-041 ts-fsrs integration + ratings · 040 · MRS-1
- SS-042 reviewPriority engine + queue UI + card mode · 041 · MRS-2
- SS-043 Reasons/weights settings · 042

## M5 Analytics (DNAS) + INT-1
- SS-050 aggregation (last/all, exam distribution) · 020
- SS-051 coverage · 030,050
- SS-052 mastery (Dirichlet) · 050 · vectors
- SS-053 trend + calibration · 050
- SS-054 BKT + skills (1 per leaf) + skill editor edges/DAG check · 052
- SS-055 Analytics charts (all listed in spec 09) + ExplainPopover · 050–054
- SS-056 Dashboard · 055

## M6 Exams (EXS)
- SS-060 Exam CRUD MCQ/descriptive, sections→topics, keys, images (WebP) · 012
- SS-061 Exam attempts + repeats · 060 · EXS-1..3

## M7 Prediction (PAAS)
- SS-070 Monte-Carlo prediction + bias correction · 052,061 · property tests
- SS-071 strategy + prep list + similar exams · 070 · PAAS-1,2
- SS-072 Workload to exam card · 070

## M8 Planner (PLN)
- SS-080 Goals + availability grid editor · 005
- SS-081 Planner engine v1 (spec 10) · 052,041,080 · property tests
- SS-082 Proposal UI (week view, reasons, approve/edit/discard) · 081 · PLN-1..3
- SS-083 Today list, start/done, actual time, day-end replanning, Friday weekly review · 082 · PLN-4
- SS-084 Long-term milestone view · 081

## M9 Rewards & PSY
- SS-090 Reward events + caps + levels + toggle · 006 · RWD-1,2
- SS-091 Check-in + reflection prompts + procrastination helper · 083
- SS-092 Questionnaire registry + 3 R1 instruments · 091
- SS-093 Safety pathway + lexicon + config numbers · 091 · PSY-1,2

## M10 Assistant
- SS-100 Persian normalizer + intent detector · 004
- SS-101 Handlers + templates for all R1 intents · 100, M5–M9 · AST-1,2

## M11 Backup & settings
- SS-110 Export/import zip + encryption + dry-run · 005 · BAK-1,2
- SS-111 Persist request, backup reminder, PIN lock for D4 · 110

## M12 Hardening & packaging
- SS-120 Performance budgets, 20k-attempt fixture · all
- SS-121 Full e2e + axe pass · all
- SS-122 PWA install + offline caching audit · all · OFF-1
- SS-123 Optional Tauri desktop build · 122
- SS-124 ML dataset export (anonymized JSONL) for R2 · 054

## v3 tickets
- SS-301 [M1] Port reference_engine to src/engine/*.ts; vectors v1+v2 green · 007
- SS-302 [M1] Raw TOC import from pasted publisher text (rawTocToNodes) · 010
- SS-303 [M2] Edge cases spec 25 §1–8 with named tests · 022
- SS-304 [M7] Backtest & recalibration (spec 26 §4) · 070
- SS-305 [M11] Lock, encrypted backup, dry-run restore (spec 27) · 110
- SS-306 [M12] Fixtures + budgets (spec 28) · all
- SS-307 [M9] Focus timer (spec 29 F3) · 083

## v2 tickets (merge into milestones; IDs SS-2xx)
- SS-201 [M2] Practice wizard (spec 20) + continue suggestion + empty-range capture · 022 · VKS-6,7
- SS-202 [M2] Approximate time step, timeSource, secPerQ, userMedianSecPerQ · 201 · VKS-8
- SS-203 [M2] Session drafts autosave/resume · 201 · VKS-10
- SS-204 [M2] ErrorAnalysisTask (deferred reasons) · 024 · VKS-9
- SS-205 [M1] Calculus 1 seed import · 013 · TKS-5
- SS-210 [M5] Analytics v2 metrics (spec 23 §1) · 050–054 · DNAS-1
- SS-211 [M5] Analytics tabs + badges · 210 · DNAS-4
- SS-212 [M5] Insight engine + guards · 210 · DNAS-2,3
- SS-220 [M7] Blueprints + templates · 060
- SS-221 [M7] Topic forecast v2 + simulation per section · 070,220 · PAAS-3,4
- SS-222 [M7] Readiness index + gap tabs + what-if · 221 · PAAS-6
- SS-223 [M7] Action plan → planner drafts · 221,081 · PAAS-5,7
- SS-224 [M7] Exam wrapper + bias update · 221
- SS-230 [M9] Rewards v2 ledger (XP/coins), caps, anti-gaming · 006 · RWD-1,2
- SS-231 [M9] Quests generator (deterministic) · 230,081 · RWD-5
- SS-232 [M9] Badges + decay + maintenance quests · 230,054 · RWD-4
- SS-233 [M9] Reward shop + bundles + contracts · 230 · RWD-3
- SS-234 [M9] Weekly report card · 230,212
- SS-240 [M9] Profile Layer A registry + Mini-IPIP + consent · 092 · PRF-2,4
- SS-241 [M9] Behavioral signals (spec 21 Layer B) · 210 · PRF-1
- SS-242 [M9] Synthesis cards + hypotheses table · 240,241 · PRF-3
- SS-250 [M8] Adaptation engine (bandit, logging, overrides) · 241,081 · ADP-1..4
- SS-251 [M8] CUSUM drift + time-of-day + fatigue models · 250 · ADP-5
- SS-260 [M10] Flow DSL runtime + schema validation + dead-end CI · 100 · AST-4,5
- SS-261 [M10] Required flows (spec 12 §4) · 260 · AST-1..3
- SS-262 [M10] Coach KB (10 areas) with sources · 260 · AST-6
- SS-263 [M10] Proactive messages + quiet hours · 261,250

## v4 tickets (insert by milestone; IDs SS-4xx)
- SS-401 [M0] Brain core skeleton: event log, LSG store, diff bus, replay hash test · 006 · BRN-T1
- SS-402 [M1] Curriculum catalog loader + schema CI + empty-program states · 005 · CUR-T1,T2
- SS-403 [M1] SSB v2 parser (@مرجع, @پوشش, editions, scopes, @حذف, @چندجوابی) · 010 · SSB2-T1..T4
- SS-404 [M1] Prompt panel (copy prompt, paste result, error→fix prompt) + mapping preview · 403
- SS-405 [M1] qid + numbering scopes + BookEdition + EditionMap · 012 · TB-T1,T2
- SS-406 [M2] Probabilistic attribution + one-tap topic tag + transfer context · 401,405 · TB-T4,T5
- SS-407 [M2] Answer sets: cancelled/multi-answer/disputed + KeyRevision · 025 · TB-T3
- SS-408 [M3] History wizard L1/L2/L3 + approximate dates + ImportBatch undo · 026 · HIS-T1..T4
- SS-409 [M6] ExamTemplate/ExamSitting + SSE parser + public exam stats → item priors · 408 · HIS-T3
- SS-410 [M5] Propagation + hysteresis + provenance «چرا؟» · 401 · BRN-T2
- SS-411 [M7] Fusion with pack models (ONNX worker), BAYES_ONLY fallback · 410 · BRN-T4,T5
- SS-412 [M11] .ssx export (consent, signing, incremental cursor, revoke) · 401 · NET-T2,T3
- SS-413 [M11] .ssp import (verify signature, staging, apply catalog/item/model updates) · 412 · NET-T5
- SS-414 [M11] .ssbak encrypted backup + dry-run restore · 412
- SS-415 [all] Spec 38 fixes F-01..F-23 as named tests · —
- SS-416 [M9] Restored features R-01..R-20 (spec 37) · per item
- SS-417 [R1.5] Aggregator (Python): ingest, dedupe, k-anon, IRT, link re-estimation, pack build · —
- SS-418 [R1.5] Mailbox bot (design with owner first) · 417
