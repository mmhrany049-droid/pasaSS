# Audit v4 (2026-10-02)
Status: ✅ specified + vectors/tests defined · 🟡 specified, code in build · 🔵 needs owner input (default applied)

## A. Corrections to AUDIT_v3
| v3 ID | v3 claim | Reality | v4 |
|---|---|---|---|
| A-18 | readiness clamp in engine ✅ | clamp only in store | F-04 ✅ |
| A-19 | gain formula fixed ✅ | engine still old; store uses a third formula | F-01/F-02 ✅ |
| A-20 | FSRS curve from ts-fsrs ✅ | still hardcoded | F-03 ✅ |
| A-05 | raw TOC "exact match" ✅ | shape-only check; ordinal bug | F-05 ✅ |
| A-28 | 13 flows ✅ | files exist, prototype ignores them | F-20 🟡 |
| A-01 | working prototype ✅ | missing review, planner, settings, history, catalog | spec 37 🟡 |

## B. New findings (v4)
| ID | Problem | Status | Fix |
|---|---|---|---|
| B-01 | No curriculum layer → books, users, streams not comparable | ✅ | spec 30 + catalog |
| B-02 | Only one stream/grade supported in seeds | ✅ | both streams, grades 10–11; 12 empty-ready |
| B-03 | Cross-stream shared topics not linked (help.txt) | ✅ | links.json (identical/equivalent/partial) 🔵 math depth OPEN-17 |
| B-04 | Equal 1/k split hides weak topics | ✅ | TB-5 probabilistic attribution |
| B-05 | Mixed results pooled with blocked practice | ✅ | TB-6 transfer context |
| B-06 | qid depends on numbering mode | ✅ | TB-1 |
| B-07 | No editions | ✅ | TB-3 |
| B-08 | No cancelled/multi-answer/duplicate questions | ✅ | TB-8, TB-12 |
| B-09 | Checkup scope overlap blocked (prototype) | ✅ | TB-2 |
| B-10 | Legacy only item-level, no dates | ✅ | spec 33 L1/L2/L3 + approximate dates |
| B-11 | No way to import past exams/public papers for the database | ✅ | spec 33 §4 + SSE + prompt |
| B-12 | Modules compute learner state independently | ✅ | spec 34 Brain |
| B-13 | Neural network on one device = noise | ✅ | population training + fusion + ship gate |
| B-14 | Multi-user needs hosting | ✅ | spec 35/36 file network |
| B-15 | Privacy/consent for minors in pooled data | ✅ | spec 35 §3 + k-anonymity |
| B-16 | Poisoning/tampering of pooled data | ✅ | signatures, caps, anti-gaming weights |
| B-17 | 20 v0.x features lost | 🟡 | spec 37 R-01..R-20 |
| B-18 | 23 engine/prototype defects | 🟡 | spec 38 |
| B-19 | Grade-12 catalog | 🔵 | OPEN-16 |
| B-20 | Telegram reachability/limits | 🔵 | OPEN-19, adapter swappable |
| B-21 | V0.3 sub-pages missing | 🔵 | OPEN-23 |
