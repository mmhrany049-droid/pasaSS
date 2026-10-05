# 22 — Behavioral Adaptation Engine (ADP) — fixes v1 "behavior matching"
v1 adapted only via check-in energy and one global actual/planned ratio. v2 makes adaptation **measured, per-person, explainable and reversible**, following the just-in-time adaptive intervention (JITAI) framework (Nahum-Shani et al. 2018; Nahum-Shani & Murphy 2026 review) and micro-randomized-trial logic (Klasnja et al. 2015) at n=1 scale.

## 1. Decision points, arms, proximal outcome
| Decision point | When | Arms | Proximal outcome (success = 1) |
|---|---|---|---|
| `sessionLength` | planner packs a slot | 25 · 40 · 50 min | activity done ≥80% of volume |
| `questDifficulty` | daily quest generation | 0.7 · 1.0 · 1.3 | quest completed same day |
| `startNudge` | 10 min before planned slot | none · if-then reminder · 2-minute starter | started within 15 min |
| `skipResponse` | after a skip | move slot · shrink 50% · split in 2 | rescheduled item done within 48 h |
| `rewardFrame` | session summary text | effort · progress · mastery | next planned activity started on time |
| `dailyLoad` | proposal generation | 0.85 · 1.0 · 1.15 × last-14-day median done minutes, **always ≤ daily cap** (spec 10 hard rule) | planFollowed (≥70%) |
| `hardTaskBlock` | placing new/weak topics | best block · any block | activity done and percent ≥ topic mean |

## 2. Policy: constrained Thompson sampling (n=1 contextual bandit)
- Context bucket `x = (energyLow: energy≤2 | sleep<6h, weekday|friday, examWithin7d)` → 8 buckets.
- Each (decision, arm, bucket) has Beta(a, b). Prior: `a = 1 + 2·pRule`, `b = 1 + 2·(1−pRule)` where `pRule` ∈ [0,1] comes from spec 21 Layer C hypotheses (default 0.5). Bucket posteriors share strength with the pooled arm posterior: effective `a_x = a_x + 0.3·a_pooled` (simple hierarchical shrinkage).
- Choose arm = argmax of a sample from each Beta (PRNG seeded by `decisionId`). **Probability clipping**: estimated selection probability kept in [0.1, 0.9] by forced exploration when an arm's win-probability (Monte-Carlo 200 draws) > 0.9 (Russo et al. 2018 tutorial; MRT practice).
- Hard constraints are applied **before** choice (never violate sleep, caps, hard blocks, safety pause).
- Update after outcome window closes (`a += y`, `b += 1−y`). Discount old evidence weekly: `a,b ← 1 + 0.95·(a−1)` etc. to track habit change.
- Log `AdaptationDecision{decision, bucket, arm, probability, outcome, at}` → enables honest offline evaluation (inverse-propensity) and R2 learning.
- **User override wins**: a manual setting fixes the arm; overrides are logged as negative feedback for the replaced arm (weight 0.5).

## 3. Change detection (habit drift)
Two-sided CUSUM on (a) daily adherence ratio, (b) weekly mean percent, (c) daily minutes. Parameters: reference = 28-day mean, k = 0.5σ, h = 4σ. On alarm: assistant flow «به نظر می‌رسد هفته‌ات فرق کرده؛ بازبینی برنامه؟» with options (lighter week, change slots, talk about reason). Never automatic.

## 4. Personal time-of-day model
For each block b ∈ {صبح 6–12, بعدازظهر 12–16, عصر 16–20, شب 20–24}: shrunken mean percent `m_b = (n_b·x̄_b + κ·x̄)/(n_b+κ)`, κ=5; posterior via normal approx with σ from session percents. `bestBlock` = argmax m_b if `P(m_best > m_second) ≥ 0.8` (Monte-Carlo), else none. Also adherence per block. `hardTaskBlock` arm "best block" is only available when bestBlock exists.

## 5. Session length & fatigue
- Fatigue: logistic regression `logit P(C) = β0 + β1·position/10 + topic fixed effect` on non-legacy attempts (L2 λ=1). β1 < 0 with 90% CI excluding 0 → fatigue detected; recommend length where predicted accuracy drops < 5 pp from start.
- Completion by planned length from AdaptationDecision logs.
- Recommended default length = arm with highest posterior mean of (completion × (1 − fatigueDrop)).

## 6. Planning-fallacy correction per subject and activity type
`ratio[subject][type]` = EWMA (α=0.2) of actual/planned minutes, clamp 0.8–1.6, fallback to global (v1 §10.5). Shrink to global with weight `n/(n+5)` (Buehler, Griffin & Ross 1994).

## 7. Explainability
Every adapted value in planner/quests shows a chip «تنظیم‌شده برای تو» → popover: what was changed, evidence (n, success rate per arm), and «برگرد به پیش‌فرض». Settings page «تطبیق رفتاری» lists all decisions with current preferred arm and a reset.

## 8. Cold start
Days 0–13: priors from questionnaire (if any) else defaults; exploration only for `sessionLength`, `questDifficulty`, `startNudge`. Other decisions start day 14.

## Acceptance
- ADP-1 Same inputs + seed → same arm (deterministic).
- ADP-2 Arm violating a hard constraint is never chosen (property test).
- ADP-3 Selection probability never outside [0.1, 0.9] when ≥2 feasible arms.
- ADP-4 User override fixes arm and shows in settings; reset restores bandit.
- ADP-5 CUSUM alarm creates assistant prompt, never changes plan silently.
