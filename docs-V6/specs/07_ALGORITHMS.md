# 07 — Algorithms (exact)
All functions live in `src/engine/`, are pure, and must reproduce `tests/test_vectors.json` (tolerance 1e-6 unless stated). Randomness only via `prng.ts` = mulberry32(seed).

## 1. Percent — `scoring.percent(C,W,N)`
`P = (3C − W) / (3N) × 100`. N = all questions in scope including B and U? **No:** N = C+W+B (U excluded; UI shows "n uncorrected" badge). N=0 → `null`. Round only for display (1 decimal, Persian digits).

## 2. Correction — `scoring.correct(chosen, answer)`
chosen=0→B; answer=null→U; chosen==answer→C; else W.

## 3. Tree aggregation — `aggregation.aggregate(tree, attempts, mode)`
For each node: own counts + sum of children. `mixed` nodes add to parent (already children). Exam-type nodes (`checkup|comprehensive|final`): if question has `topicNodeIds`, credit each listed topic with weight 1/len; else distribute to `coversNodeIds` with weight 1/|covers| (fractional counts allowed). Modes: `last` (only latest attempt per questionRef) and `all`. Legacy included in both, percent hidden for legacy-only scopes.

`coversNodeIds` auto-fill: checkup = all topic leaves after previous checkup in same chapter up to this node; comprehensive = all topic leaves in its chapter; final = all topic leaves in book. Editable.

## 4. Topic mastery — `mastery.estimate(attempts, prior, now)`
- Weight per attempt: `w = 0.5^(ageDays/H)`, H=21; legacy w=0.3; correct guess contributes 0.5·w to C and 0.5·w to W.
- Prior from subject mean (μC, μW, μB) with strength k=4: α = k·μ. If subject has <20 attempts use μ=(0.4,0.3,0.3).
- `pX = (Σ w·[X] + αX) / (Σ w + k)`, X∈{C,W,B}.
- Output also `effectiveN = Σw` and `confidence = effectiveN/(effectiveN+k)`.
- If book hasDifficulty: estimate per difficulty level, combine with target difficulty mix.

## 5. Coverage — `coverage.compute`
`taughtQ` = questions under nodes with state ∈ {selfStudied, mastered}; `doneQ` = distinct questionRefs among those with ≥1 attempt (legacy counts); `coverage = doneQ/taughtQ` (taughtQ=0 → null); `remaining = taughtQ − doneQ`.

## 6. Exam prediction — `prediction.simulate(sections, masteryByTopic, runs=5000, seed)`
For each topic with n questions: sample (pC,pW,pB) ~ Dirichlet(α' = pX·(effectiveN+k)) then counts ~ Multinomial(n, p). Sum, compute P each run. Output P10/P50/P90, mean, histogram (bins of 5%). Apply organizer bias correction b (ADR-018): P̂ = P − b. Repeat exams weight 0.4 when updating mastery from exams. Warn on topics with TaughtState `none`.

## 7. Answer strategy — `strategy.plan(topics, durationMin, secPerQ)`
q = pC/(pC+pW) for attempted; for topics where historically pB > 0.4 use q_blank = min(q, 0.25). Expected value per answered question E = 3q − (1 − q) (in units of 1/3N). Answer only if q > 0.25. Sort topics by q desc, fill time budget (secPerQ from user median time; default 72 s). Output ordered list with counts and expected percent.

## 8. Prep list — `prep.build`
Candidates = W and B questions in exam topics + due ReviewItems in those topics. `rank = reviewScore × (1 + (1 − pC_topic)) × sectionWeight`. Interleave: output round-robin across topics after sorting (never >3 consecutive from same topic). Compress near exam: if daysLeft ≤ 7 take top `min(len, 40)`.

## 9. Review priority — `reviewPriority.score`
`score = R × F × I × D × S`
- R = max reason weight + 0.5 × sum(other reason weights); no reason → 3.
- F = 1 + 0.5 × (wrongCount + blankCount − 1)
- I = important ? 1.5 : 1
- D = 1 + max(0, daysOverdue)/7
- S = max(0.3, 1 − 0.15 × correctStreak)
Default reasons: unknown 5, conceptual 4, forgotFormula 3.5, timeShortage 3, calculation 2.5, carelessness 2, misread 2, wrongGuess 1.5 (editable).
Scheduling = FSRS (ts-fsrs, retention 0.9). Rating map from UI: "باز غلط"=again, "با شک درست"=hard, "درست"=good, "خیلی راحت"=easy.

## 10. Similar exams — `similarity.weightedJaccard(a,b)`
`sim = Σ_t min(a_t,b_t) / Σ_t max(a_t,b_t)`, a_t = question count on topic t. Suggest top 3 with sim ≥ 0.3.

## 11. Trend — `trend.weekly`
Points = session percents (non-legacy) by date. Weighted least squares slope with weights w=0.5^(ageDays/28); output slope per week (×7) in percentage points. Need ≥4 points else null. Also 7-session moving average.

## 12. Calibration — `calibration.compute`
If confidence present: bins of 10; ACE = mean |c − y|; bias = mean(c) − mean(y). Without confidence: compare accuracy of isGuess vs not.

## 13. Prediction accuracy
MAE of predicted P50 vs actual P across graded exams; per organizer EWMA bias (α=0.3).

## 14. Workload to exam
`workMin = untouchedQ_in_exam_topics × userMedianSecPerQ/60 + dueReviews × 1.5`; `perDay = workMin / max(1, daysLeft)`; compare with planner free minutes → verdict ok (<0.8), tight (0.8–1.0), overloaded (>1.0).

## v2 additions
- §7 strategy and §14 workload: replace per-question time with `userMedianSecPerQ` (spec 20).
- New formulas live in specs 22 (adaptation), 23 (analytics), 24 (readiness); vectors in `tests/test_vectors_v2.json`.
