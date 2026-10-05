# 24 — Exam Prediction & Readiness v2 (PAAS) — extends spec 07 §6–8, §14
Goal (owner): predict percent per subject in an upcoming exam from test data, knowing the exam syllabus; list untested («نزده») and to-review topics; push prioritized work into the planner.

## 1. Exam blueprint (بودجه‌بندی)
- `ExamBlueprint{examId|templateId, sections[{subjectId, questionCount, durationMin?, topics[{bookId,nodeId,weight}] , freeTopics[]}]}`.
- **Templates library** per organizer (e.g. «قلمچی – آزمون شماره ۳ پایه یازدهم ریاضی»), user-created and reusable; copy-from-previous; stored as dated data (ADR-027).
- Topic weights: if organizer gives per-topic counts use them; else weight ∝ question count of node in user's books, normalized per section. Untaught topics in blueprint are allowed (they are the point).
- Konkur/final-exam per-topic weights live in curriculum data with source + effective range.

## 2. Topic state at exam date `paas/topicForecast.ts`
For each blueprint topic t:
1. `p_now` = (pC,pW,pB) from Dirichlet mastery (spec 07 §4); BKT pL used as tie-break and for recommendations.
2. **Forgetting to exam date:** forgetting curve **from ts-fsrs** (`forgetting_curve(Δd, S)`; for FSRS-4.5/5 this equals `R(Δd) = (1 + (19/81)·Δd/S_t)^(−0.5)`, for FSRS-6 the decay is a fitted parameter — never hardcode), `S_t` = median stability of the topic's ReviewItems, else `S_default = 3 × (1 + 0.5·log2(1+attempts_t))` days. Δd = days from last practice to exam. Then `pC_exam = pC_floor + (pC_now − pC_floor)·R`, pC_floor = 0.25·(1 − pB_now), applied only when pC_now > pC_floor; the removed mass goes to W (60%) and B (40%).
3. **Untested but taught** (no attempts): prior = user's **first-exposure** distribution (pooled first attempts on new topics in the same subject, ≥40 attempts; else subject mean), effectiveN = 1 (wide uncertainty). Flag «نزده».
4. **Untaught** (TaughtState none): prior pC = 0.10, pW = 0.15, pB = 0.75, effectiveN = 1. Flag «نخوانده».
5. **Condition shift:** apply organizer bias b (ADR-018) at the end; also blueprint-level difficulty factor `δ_org` learned as EWMA of (actual − predicted) per section, shrunk with weight n/(n+2).
6. **Strategy-aware:** the answer strategy (spec 07 §7) converts low-q topics' W into B before simulation.

## 3. Simulation
Monte Carlo 5000 runs (seeded). Output per section (subject) and total: mean, P10/P50/P90, histogram, probability to reach `targetPercent`. Copy: «درصد شیمی احتمالاً بین ۳۸ تا ۶۱ (میانه ۵۰)». No rank/تراز estimate without population data (stated in UI).

## 4. Readiness index (0–100) `paas/readiness.ts`
`RI = 100 × (0.40·A + 0.25·Cov + 0.15·Ret + 0.10·Mock + 0.10·Err)`
- A = clamp(P50 / target, 0, 1) (P50 can be negative) (target default = user's last 3-exam mean + 5);
- Cov = weighted share of blueprint topics that are taught **and** tested (≥10 attempts or covering ≥50% of node questions);
- Ret = weighted mean R at exam date;
- Mock = min(1, timed mixed sessions in last 14 d / 2);
- Err = 1 − (open W/B review items in exam topics due before exam / max(1, all such items)).
Show the five components as bars; RI is never shown without them.

## 5. Gap lists (tabs on `/prep/:examId`)
| Tab | Content | Unit of work |
|---|---|---|
| نخوانده | untaught blueprint topics | «مطالعه درسنامه» est. 45 min/section (editable per book) |
| نزده | taught, untested questions | k tests (block of 10–20) × secPerQ |
| ضعیف | pC < 0.5, confidence ≥ 0.4 | targeted tests + error review |
| در حال فراموشی | R at exam < 0.8 | short mixed review set (spec 07 §8) |
| خطاهای باز | W/B ReviewItems in exam topics | FSRS reviews |
| تمرین شرایط آزمون | — | timed mock / mixed session shaped like blueprint |

## 6. Prioritization → planner `paas/actionPlan.ts`
- Candidate actions a with cost `c_a` minutes and expected gain `g_a` (pp on the exam total):
  - test block on t (moves mass from W/B to C): `Δp = min(0.15, v_t × c_a/60)` where v_t = learningVelocity (spec 23) shrunk to subject default 0.06/h; `g = w_t × Δp × 100 × (s_W·4/3 + s_B·1)` where s_W = pW/(pW+pB), s_B = pB/(pW+pB) (a W→C swing is worth 4/3 of a question share, B→C worth 1).
  - review set: raises R to 0.95 → recompute pC_exam.
  - study untaught: moves topic to first-exposure prior.
  - mock exam: +0.5 pp default (condition practice) and calibrates δ_org; max 1 per 3 days.
- Rank by `g_a / c_a`; greedy fill of available minutes until exam (planner free minutes, spec 10) with constraints: no topic > 30% of total, last 20% of window mixed/mock (Cepeda-style), day before exam: only light review ≤ 60 min, no new material, sleep protected.
- Output: «برنامه آمادگی» draft → `Goal(scope=exam)` + PlannedActivity drafts (status draft). Planner shows reason per item («+۱٫۲ درصد پیش‌بینی‌شده در ۴۰ دقیقه»). Approval required (spec 10).
- **What-if slider:** «اگر روزی X دقیقه بیشتر بخوانم؟» → recompute P50 and RI live (worker).

## 7. After the exam
Enter answers/score → prediction error per section, update bias & δ_org, per-topic surprises («پیش‌بینی ۷۰٪، واقعی ۳۵٪: بیشترین فاصله»). **Exam wrapper** reflection (Lovett 2013): 4 prompts (how prepared, error types, what to change, plan) → rewards (spec 11) and next goal.

## Acceptance
- PAAS-3 Untaught blueprint topic is predicted with pB ≥ 0.6 and listed under «نخوانده».
- PAAS-4 Increasing days to exam with no practice lowers P50 monotonically (property test).
- PAAS-5 «ارسال به برنامه» creates draft activities only; nothing scheduled before approval.
- PAAS-6 RI components shown and sum-weighted value matches `test_vectors_v2.json → readiness`.
- PAAS-7 Action plan never assigns new material on the day before exam.
