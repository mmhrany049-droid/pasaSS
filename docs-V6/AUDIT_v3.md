# Audit v3 (2026-10-02): every known problem, its status and where it is fixed
Status: ✅ fixed (spec + code/test) · 🟡 fixed in spec, code pending in build · 🔵 needs owner decision (default applied)

| ID | Problem | Status | Fix / location |
|---|---|---|---|
| A-01 | No running code, only documents | ✅ | Working prototype (`prototype_src/`, published artifact) + `reference_engine/engine.js` with 61 passing checks (`node reference_engine/run_vectors.mjs`) |
| A-02 | v1 test vector bug: workload ratio 0.7125 labelled "overloaded" (spec says ok < 0.8) | ✅ | `tests/test_vectors.json` corrected + tight/overloaded cases added |
| A-03 | Practice entry order & forced per-question time/reasons | ✅ | spec 20 + prototype wizard (درس ← کتاب ← بازه ← پاسخ‌برگ ← زمان) |
| A-04 | Seed books have no ranges → first session blocked | ✅ | ask-once range capture with overlap check (spec 20, prototype) |
| A-05 | Calculus 1 missing; raw TOC detector could not read «درس/بخش اول» | ✅ | `seed/calculus1_olgoo.ssb`; spec 08 patterns; `rawTocToNodes()` reproduces all 3 seeds from your TOC files exactly (`raw_toc_check.mjs`) |
| A-06 | Physics «پرسش‌ها» leaves all had the same name in lists | ✅ | display label = parent section (prototype `label()`) |
| A-07 | Multi-topic questions double-counted evidence | 🟡 | spec 25 §1 (1/k split) + BKT half-evidence test in engine |
| A-08 | Key changes: no history, rewards could be revoked visibly | 🟡 | spec 25 §2 KeyRevision + compensating events |
| A-09 | Deleting/editing sessions, nodes, books undefined | 🟡 | spec 25 §3 |
| A-10 | Repeats inflated coverage and mastery | 🟡 | spec 25 §4 (coverage distinct; 24 h repeat weight 0.5, implemented in engine `mastery`) |
| A-11 | Descriptive exams could leak into percent | 🟡 | spec 25 §5 |
| A-12 | U/legacy handling inconsistent across modules | 🟡 | spec 25 §6 |
| A-13 | Midnight/timezone/Jalali edge cases | 🟡 | spec 25 §7 |
| A-14 | Input validation scattered | ✅ | spec 25 §8 + `parseAnswerString`, digit normalization in prototype |
| A-15 | Predictions shown with false precision | ✅ | spec 26 §1–2; prototype shows interval first + «کم‌داده/تقریبی» |
| A-16 | No backtest / recalibration of prediction | 🟡 | spec 26 §4 |
| A-17 | Selection & practice-vs-exam bias | 🟡 | spec 26 §3 |
| A-18 | Readiness A could go negative | ✅ | clamp in spec 24 + engine |
| A-19 | Gain-per-minute formula wrong for blanks | ✅ | spec 24 §6 (W→C 4/3, B→C 1) |
| A-20 | Hardcoded FSRS curve (breaks with FSRS-6) | ✅ | spec 24: use ts-fsrs forgetting_curve |
| A-21 | Adaptation `dailyLoad` could exceed daily cap | ✅ | spec 22 table: always ≤ cap |
| A-22 | Lock/encryption, backup format, restore safety undefined | 🟡 | spec 27 |
| A-23 | Minors' consent | 🟡 | spec 27 §5 |
| A-24 | No performance budgets / fixtures | 🟡 | spec 28 |
| A-25 | Device/RTL/a11y QA matrix missing | 🟡 | spec 28 |
| A-26 | Middle dot «·» looks like Persian zero «۰» in Vazirmatn | ✅ | all separators replaced by «،» (prototype); add to spec 28 RTL checklist |
| A-27 | Answer-sheet photo, mistake notebook, focus timer, rank estimate unspecified | 🟡 | spec 29 F1–F4 |
| A-28 | Only 3 of 11 assistant flows existed | ✅ | 13 flow JSON files, 0 dead links |
| A-29 | Only Mini-IPIP had items; 7 instruments empty | ✅ | `psy/instrument_*.json` (9 instruments, Persian items) + safety lexicon |
| A-30 | rMEQ license unknown | ✅/🔵 | custom chronotype default; OPEN-11 |
| A-31 | Persian translation of Mini-IPIP unvalidated | 🔵 | flagged in UI; OPEN-06 |
| A-32 | Help numbers unverified | 🔵 | configurable; OPEN-07 |
| A-33 | Coin ratio, blueprints, targets, minutes per section | 🔵 | defaults 3:1, user-made, last-3+5 (prototype 60), 45 min; OPEN-12..15 |

## What the prototype proves (run in the artifact)
1. Log a session in ≤ 6 taps + answers + one time chip; uncorrected answers become U and auto-correct when keys arrive.
2. Analytics: points lost per reason, mastery map with confidence, guarded weekly insights, per-subject trend.
3. Exam: blueprint → per-subject P10–P90, readiness index with 5 components, gap tabs, gain-per-minute priorities, day-by-day prep draft (approve/discard; last day light review; mock in final 20%).
4. Rewards: XP/levels, coins, deterministic daily quests (one swap/day), personal shop, anti-gaming flag.
5. Profile: 6 behavioral signals with min-data guards, Mini-IPIP with error bands, explained suggestions.
6. Assistant: button menu, quick log inside chat, exam readiness, weak topics, leak, coach with sources, safety check.

## Not in the prototype (left for the real build, specified)
IndexedDB/Dexie + migrations, FSRS review queue, weekly planner with availability grid, adaptation bandit, backup/encryption, PWA offline cache, OCR. The prototype stores data in the browser only.
