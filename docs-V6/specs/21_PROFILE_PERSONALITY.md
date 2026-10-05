# 21 — Learner Profile & Personality (PRF) — supersedes ADR-022 scope
Goal (owner): "detect my personality and habits" so the app can adapt. Constraint: scientifically valid, dimensional, private, never a type/label.

## Why not "types"
MBTI-style types have poor test–retest stability and weak predictive validity; "learning styles" matching has no supporting evidence (Pashler et al. 2008). Big Five dimensions are the best-replicated personality model; **conscientiousness** is the strongest trait predictor of academic performance even controlling for ability (Mammadov 2022, 267 samples, N=413,074; Poropat 2009; Vedel 2014). But traits explain modest variance, so **behavior measured by SS outweighs questionnaires** as data accumulates.

## Three layers
### Layer A — Questionnaires (opt-in, each ≤ 3 min, retake every 90 days)
| id | Construct | Instrument | Items | License |
|---|---|---|---|---|
| `bigfive.mini-ipip` | Big Five (O, C, E, A, N) | Mini-IPIP (Donnellan et al. 2006), IPIP items | 20, 1–5 | Public domain (IPIP). Persian wording flagged `translationStatus: unvalidated` until OPEN-06. |
| `chronotype.custom` | Morningness–eveningness | custom 5 items (`psy/instrument_chronotype_custom.json`); rMEQ (Adan & Almirall 1991) only if license confirmed (OPEN-11) | 5 | Own |
| `selfcontrol.brief` | Trait self-control | custom 8 items modeled on study behaviors (not a copy of BSCS) | 8 | Own |
| `testanxiety.short` | Worry + emotionality before/during exams (non-clinical) | custom 8 items | 8 | Own |
| `selfefficacy.subject` | Academic self-efficacy per subject | custom 1 item × subject + 4 general | 4+k | Own |
| `strategy.selfreport` | Retrieval/spacing/rereading/help-seeking | v1 instrument | 12 | Own |
| `procrastination.triggers` | Functional triggers | v1 instrument | 8 | Own |
| `motivation.sdt` | Autonomous vs controlled study motivation | custom 8 items inspired by SDT (Ryan & Deci 2000) | 8 | Own |
Scoring: mean of keyed items → 0–100 (`(mean−1)/4×100`); reverse keys per registry; uncertainty = SEM from Cronbach's α stored in registry (default α=0.70 when unvalidated) → shown as a band. Results shown as sliders with band, never as words like «درونگرا».

### Layer B — Behavioral profile (automatic, no questionnaire) `engine/profile/behavior.ts`
Each signal = `{value, ciLow, ciHigh, n, trend30d, provenance}`; shown only when `n ≥ minN`.
| Signal (fa) | Definition | minN |
|---|---|---|
| پایبندی به برنامه | done planned minutes / planned minutes, last 28 d (Beta posterior mean) | 7 planned days |
| شروع به‌موقع | median start latency of planned activities (min) | 10 activities |
| ثبات | active days in last 14; coefficient of variation of daily minutes | 14 days |
| بهترین ساعت | time block {صبح, بعدازظهر, عصر, شب} with highest shrunken percent (spec 22 §4) | 12 sessions |
| طول جلسه مناسب | length with best completion × accuracy (spec 22 §5) | 15 sessions |
| خستگی درون‌جلسه | slope of P(correct) by `position` (logistic, per 10 questions) | 300 attempts |
| سرعت/دقت | Spearman ρ between session secPerQ and percent | 10 timed sessions |
| جسارت پاسخ‌دهی | blank rate vs. accuracy on guesses (optimal if guess accuracy > 25% and few blanks) | 30 guesses or 100 blanks |
| دقت خودارزیابی | calibration ACE/bias (spec 07 §12) | 50 confidence ratings |
| پیگیری خطا | share of W/B with reason analyzed within 48 h | 50 W/B |
| پایبندی مرور | share of due reviews done within 1 day | 30 due |
| تاب‌آوری | probability of ≥1 session within 3 days after a percent drop ≥15 pp | 4 drops |
| فشرده‌خوانی قبل امتحان | share of exam-topic work done in last 3 days before exam (cramming index) | 2 exams |
| اجتناب از درس | per subject: done/planned ratio relative to overall ratio (<0.7 = avoided) | 5 planned per subject |
| الگوی آخر هفته | Friday minutes / weekday median | 4 weeks |

### Layer C — Synthesis «نیمرخ مطالعه» `engine/profile/synthesis.ts`
- Each **adaptation hypothesis** is a rule `if (trait/signal condition) → (default arm prior in spec 22)` with source. Examples:
| Condition | Hypothesis / default | Source |
|---|---|---|
| C < 40 or adherence < 0.6 | smaller activities (25 min), if-then plan prompt every day, 2 quests not 3 | Gollwitzer & Sheeran 2006 (d≈0.65) |
| Neuroticism (low emotional stability) > 60 or testanxiety.worry > 60 | before exams: 10-min expressive writing prompt, reappraisal message, more timed mock sessions | Ramirez & Beilock 2011; Jamieson et al. 2010 |
| Eveningness (rMEQ low) & behavioral best block = evening | hard/new topics in evening slots, reviews in morning | Preckel et al. 2011 (chronotype–achievement) |
| O > 60 | more variety: interleaved quests, rotate subjects | Brunmair & Richter 2019 |
| Low calibration (overconfident) | confidence slider on, more retrieval before reveal | Dunlosky & Rawson 2012 |
| Cramming index > 0.5 | long-term planner front-loads exam topics, spaced reminders | Cepeda et al. 2008 |
| Avoided subject | first slot of day 15-min "starter" of that subject, bundle option | Steel 2007; Milkman 2014 |
- **Evidence weighting:** for every adaptation, prior from Layer A (pseudo-count 2) is updated by observed outcomes (spec 22). After ~20 outcomes behavior dominates. UI states «این پیشنهاد بر اساس رفتار خودت اصلاح شده است».
- Output cards: «نقاط قوت»، «ریسک‌ها»، «تنظیماتی که برنامه برایت عوض کرده» (each with «چرا؟» + «غیرفعال کن»).

## Guardrails (hard)
1. No type labels, no animal/color personas, no "you are X" sentences. Copy uses «در این بازه، به نظر می‌رسد…».
2. Profile never restricts content, subjects, or difficulty access.
3. Private: local only, excluded from any future sync/hub unless the user explicitly shares a summary; one-tap delete per layer.
4. Show limitations card: «پرسشنامه‌ها فقط بخش کوچکی از عملکرد را توضیح می‌دهند؛ رفتار واقعی‌ات مهم‌تر است».
5. Minors: questionnaires require an in-app consent screen; Big Five off until user opts in.
6. No clinical scales (PHQ-9, GAD-7) and no diagnosis. Test anxiety items are educational, with the safety pathway (spec 11) still active.

## Acceptance
- PRF-1 With no questionnaires and <minN data, profile shows «هنوز داده کافی نیست» per signal, no numbers.
- PRF-2 Mini-IPIP scoring matches `tests/test_vectors_v2.json → miniIpip`.
- PRF-3 No string in fa.json matches type-label lexicon (CI check).
- PRF-4 Deleting Layer A removes responses and resets adaptation priors to defaults.

## Files (v3)
All 9 instruments are complete with Persian items in `psy/instrument_*.json`; safety lexicon in `psy/safetyLexicon.fa.json`.
