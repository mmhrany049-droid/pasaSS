# Scope and Releases (v4)

> v4 changes: Planner, Review, Settings, History import, Curriculum catalog (both streams, grades 10–11; 12 empty) are **mandatory in R1**. New **R1.5 SS Network** (file bundles + aggregator, no hosting). Neural models move from 'R2 GRU on one device' to **population models trained on pooled data** (spec 34/35).

## Release 1 — SS Personal (BUILD NOW)
Single user, single device (with export/import), fully offline.

| Module | Code | Included in R1 |
|---|---|---|
| Core (db, events, jalali, scoring, digits, backup) | CORE | Yes |
| Test books + topic tree + keys + difficulty | TKS | Yes |
| Answer sessions, bubble sheet, correction, legacy records | VKS | Yes |
| Taught/self-studied topics | MTS | Yes |
| Exams (MCQ + descriptive /20), repeats, images | EXS | Yes |
| Review queue (FSRS) + error reasons | MRS | Yes |
| Analytics (coverage, percent, trends, mastery, calibration) | DNAS | Yes |
| Exam prediction + prep list + strategy | PAAS | Yes |
| Weekly + long-term planner (proposal → approve) | PLN | Yes (v1 algorithm) |
| Rewards (behavior-based, optional) | RWD | Yes |
| Self-regulation check-ins + optional questionnaires + safety | PSY | Yes (core set) |
| Local assistant (rules + templates + local search) | AST | Yes (v2 guided flows, no LLM) |
| Learner profile (questionnaires + behavior) | PRF | Yes (v2, opt-in) |
| Behavioral adaptation engine | ADP | Yes (v2) |
| Focus timer (spec 29 F3) | FOC | Yes (v3) |
| Answer-sheet photo, mistake notebook (spec 29 F1–F2) | OCR/NB | R1.5 |
| Rank/تراز estimation (spec 29 F4) | RNK | R2 |
| Curriculum catalog + cross-stream links (spec 30) | CUR | Yes (v4) |
| Test-book rules v4, SSB v2 + prompt conversion (spec 31/32) | TKS | Yes (v4) |
| History import L1/L2/L3 + past exams (spec 33) | HIS | Yes (v4) |
| Learner Brain core: event log, LSG, propagation, fusion (spec 34) | BRN | Yes (v4, P0–P1 models) |
| Export bundle .ssx / import pack .ssp (spec 35/36) | NET-C | Yes (client side, v4) |
| Skill graph + BKT per skill | INT-1 | Yes (behind "advanced analytics" toggle, on by default) |
| Neural models (KT/GNN) | INT-2 | Inference of shipped ONNX models from a pack: Yes (v4); training: aggregator (R1.5) |
| Multi-user, school, classes, hub, sync | HUB | No — schema fields reserved (`ownerId`, `orgId`, `syncState`) |
| Telegram bot | TG | R1.5 (design with owner, spec 35) |
| Content studio (authoring/review/publish) | CST | No (R1 has personal book editor only) |

## Release 1.5 — SS Network (no hosting)
Aggregator (Python, owner PC): ingest .ssx, dedupe, privacy checks, G1 statistics (IRT, base rates, link re-estimation), build signed .ssp. Mailbox bot (Telegram or swappable adapter). Exit: NET-T1..T5, first pack with ≥ 10 members.

## Release 2 — SS Intelligence
INT-2: population neural models (pyKT family + GNN, spec 34 G2/G3) trained on aggregator data, shipped in packs behind the ship gate; IRT calibration; contextual-bandit recommender; FSRS per-user parameter optimization. Exit: neural beats BKT/IRT/PFA baseline on temporal split with equal-or-better calibration (spec 13).

## Release 3 — SS School (LAN hub, multi-user)
Hub server on school LAN, roles, schools, classes, shared extracurricular classes, assignments, class question sets, discussions (moderated), parent view, outbox/cursor sync. Exit: acceptance scenarios HUB-* in spec 17.

## Release 4 — SS Connect
Telegram adapter, optional domestic hosted deployment, content studio with review/publish, optional federated training. Exit: TG-* scenarios.

## Explicitly out of scope (all releases unless re-approved)
Commercial AI APIs · public leaderboards · diagnosis of mental health conditions · MBTI/learning-style typing · proctoring/cheating detection by camera · redistribution of copyrighted publisher content · VPN/obfuscation features.
