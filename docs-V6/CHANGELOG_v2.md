# CHANGELOG v2.0 (2026-10-02) — owner review by Mehran
## Problems found in v1 and fixes
| # | v1 problem | v2 fix | Where |
|---|---|---|---|
| 1 | Practice entry: book-first, assumed per-question time, forced reason picker after each session | Wizard subject → book → range → list → approximate total time; reasons deferrable | spec 20, ADR-028 |
| 2 | Seed books have empty ranges → practice blocked | Ask range once, save to node; continue suggestion | spec 20 |
| 3 | Rewards: thin points table, no real-life value | XP/levels, coins + personal shop, quests, decaying mastery badges, records, weekly report, anti-gaming | spec 11, ADR-029 |
| 4 | Behavior adaptation = energy check-in + one global ratio | Constrained Thompson sampling per decision, drift detection, time-of-day/fatigue models, per-subject ratios, explain & override | spec 22, ADR-031 |
| 5 | No personality/habit understanding (Big Five postponed to R2) | Learner profile: Mini-IPIP + 7 instruments (opt-in) + 15 behavioral signals + adaptation hypotheses; still no types | spec 21, ADR-030 |
| 6 | Analytics descriptive only | Points-lost, guess efficiency, blank opportunity, pace, forgetting curve, transfer gap, learning velocity, insight engine | spec 23, ADR-033 |
| 7 | Prediction ignored forgetting, untaught/untested topics and blueprints; prep not linked to planner | Blueprints, FSRS forgetting to exam date, priors for untaught/untested, readiness index, gap tabs, gain-per-minute plan → planner draft, what-if | spec 24, ADR-032 |
| 8 | Assistant = flat intent list | Telegram-style flows with buttons, commands, coach KB with sources, search, proactive messages | spec 12, ADR-034 |
| 9 | Calculus 1 missing | `seed/calculus1_olgoo.ssb` (5 chapters, 56 topic leaves) | ADR-035 |
| 10 | Exam organizer enum too small | added mehrmah, khilisabz; `blueprintId` | schema |
## New files
specs/20–24 · assistant/*.json · schemas/assistant_flow.schema.json · psy/instrument_mini_ipip.json · tests/test_vectors_v2.json · seed/calculus1_olgoo.ssb · reference/RESEARCH_BASIS.md · reference/SS_v2_changes_fa.md
## Data
dataVersion 1 → 2 with migration (new tables listed in spec 06).
