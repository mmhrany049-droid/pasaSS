# 38 — Mandatory fixes to the v3 reference engine and prototype (with tests)
The v3 package claimed several items as fixed that are not fixed in code. The coding agent must port the engine **with these corrections**; `reference_engine/` and `prototype_src/` are v3 artifacts (UI reference only, not a source of truth).

| ID | Where (v3) | Defect | Required fix | Test |
|---|---|---|---|---|
| F-01 | engine `gainPerMin` | old `400/3` formula (A-19 claimed fixed) | spec 24 §6 formula with s_W, s_B; single implementation in `brain/` | vector: pW=.3,pB=.1 → uses 4/3·.75+1·.25 |
| F-02 | store `actions` | third ad-hoc formula with invented velocity `0.5(1−pC)` | delete; use F-01 + learningVelocity (spec 23) | lint: no gain math outside brain |
| F-03 | engine `fsrsR` | hardcoded FSRS-4.5 curve (A-20 claimed fixed) | use ts-fsrs `forgetting_curve` with the active parameter set | FSRS-6 params → differs from 4.5 |
| F-04 | engine `readiness` | no clamp inside engine (A-18) | clamp each component to [0,1] in engine | A = −0.2 → 0 |
| F-05 | `rawTocToNodes` | ordinal words replaced anywhere in title; check compares only shape | normalize only the token after فصل/درس/بخش; check compares titles too | title containing «اول» unchanged |
| F-06 | store `load()` | version ≠ 3 → silent wipe | migrations by `dataVersion` (hard rule 11); never drop data | v3 → v4 migration test |
| F-07 | Home «پاک کردن و شروع واقعی» | wipes without confirm; demo mixes with real data | demo data in a separate DB namespace; reset needs typed confirm | e2e |
| F-08 | App fonts | Google Fonts CDN (breaks offline, hard rule 2) | bundle Vazirmatn | CI network-deny e2e |
| F-09 | quests/rewards | quests computed for today only → past XP/coins vanish; balance can go negative | append-only `RewardEvent` written at completion time | day-change test |
| F-10 | coins | from any self-reported minutes, uncapped per day | coins only from completed **planned** minutes (spec 11), cap 360/day; errorAnalyzed coins capped | property test |
| F-11 | quest «۲۰ تست با تحلیل کامل» | counts raw volume (forbidden) | count W/B with a reason chosen | unit |
| F-12 | quest «علت ۵ خطا» | ignores deferred analysis of older sessions | count reasons chosen **today** regardless of session date (`reasonChosenAt`) | unit |
| F-13 | anti-gaming flags | computed at save; U answers make N=0 so «tooFast» never fires; never recomputed | compute on answered count incl. U; recompute on key change | unit |
| F-14 | key edits | silently rewrite history; short paste leaves stale keys | KeyRevision + TB-9 | unit |
| F-15 | readiness components | Ret only over tested topics; Mock counts any mixed session; open errors never close; target fixed 60 | Ret over all exam topics (untested R=prior); Mock = timed full-length sessions only; error closes when reviewed/analyzed; target default spec 24 | vectors |
| F-16 | exam date | `Date.parse('YYYY-MM-DD')` = UTC midnight → off-by-one in Tehran | all local dates via Jalali/`Asia/Tehran` helpers (spec 25 §7) | 23:30 Tehran test |
| F-17 | approved prep plan | stored on exam only; not in today/planner | becomes planner Placements (proposal → approved) | e2e |
| F-18 | settings | `dailyMin=150` hardcoded, no settings screen | settings screen; default 240 weekday/360 weekend (OPEN-05) | e2e |
| F-19 | behavior «best hour» | ignores 00–06; Spearman without ties | include all hours; average ranks for ties | unit |
| F-20 | assistant | 13 flow JSON files ignored; logic hardcoded (hard rule 16) | flow runtime reads `assistant/*.json` | AST-5 |
| F-21 | safety | 6-word hardcoded list, no normalization; unverified numbers shown as facts | use `psy/safetyLexicon.fa.json` after Persian normalization; numbers shown with «برای اطمینان شماره را بررسی کن» until OPEN-07 verified | unit |
| F-22 | `run_vectors.mjs` | relative paths work only from its folder | resolve from `import.meta.url` | CI |
| F-23 | tests coverage | 61 vectors miss gainPerMin, forecastToExam, clamp | add vectors for F-01..F-05, F-15 | CI |
