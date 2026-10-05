# 23 — Analytics v2 (DNAS) — extends spec 07 and the `/analytics` screen
Principle: every chart answers a decision («چه کار کنم؟»), every number has ExplainPopover + sample size, every insight passes statistical guards.

## 1. New metrics (all pure functions in `engine/analytics/`)
| id | Persian name | Definition |
|---|---|---|
| `pointsLost` | نشتی درصد | For scope with N questions: each W loses `400/(3N)` pp vs correct (−1 instead of +3), each B loses `300/(3N)`. Aggregate by reason, topic, subject. Output «اگر خطاهای بی‌دقتی نبود: {P+x}٪». Unanalyzed W go to bucket «بدون علت». |
| `guessEfficiency` | بازده حدس | accuracy on `isGuess`; break-even = 0.25 (with −1/3 penalty, expected gain of a guess with accuracy q is `(4q−1)/3`). Beta posterior; if P(q>0.25) ≥ 0.8 → «حدس‌هایت سود دارد، کمتر نزن»; if P(q<0.25) ≥ 0.8 → «حدس نزن». |
| `blankOpportunity` | فرصت نزده | topics with B rate > 0.3 and answered accuracy q ≥ 0.45 → expected gain if half of blanks were answered. |
| `pace` | سرعت | secPerQ per subject/topic (spec 20) vs exam pace `durationMin×60/questions` of next exam. |
| `speedAccuracy` | سرعت–دقت | scatter session secPerQ × percent, Spearman ρ, with per-subject fit line. |
| `forgettingCurve` | منحنی فراموشی | on re-attempts of the same questionRef: P(C | gap days) fit `R(t) = exp(−t/S)` per subject (MLE, grid S∈[1,365]); show personal S vs FSRS stability. |
| `transferGap` | فاصله مبحثی/مخلوط | per chapter: topic-node accuracy − mixed/checkup accuracy. Gap > 15 pp with ≥30 mixed Q → recommend interleaving (Brunmair & Richter 2019). |
| `practiceExamGap` | فاصله تمرین/آزمون | per organizer: actual exam P − practice-predicted P (spec 24). |
| `learningVelocity` | سرعت یادگیری | Δ(topic pC or BKT pL) per practice hour over last 30 d; ranks topics by return on time. |
| `retentionMap` | نقشه نگهداری | per topic: mean FSRS retrievability today and at next exam date. |
| `coverageBacklog` | عقب‌ماندگی | taught-at-school but not self-studied / not practiced, in questions and estimated minutes. |
| `adherence` | پایبندی | planned vs done minutes by day/subject, start latency distribution. |
| `timeOfDay` / `weekday` | زمان مطالعه | percent and minutes by block (spec 22 §4) and weekday. |
| `difficultyAdjusted` | عملکرد به تفکیک سختی | when book has difficulty: percent per level vs target mix. |
| `consistency` | ثبات | active days/14, CV of daily minutes. |
| `masteryMap` | نقشه تسلط | treemap: size = exam weight or question count, color = mastery, border = confidence. |

## 2. Screens (tabs inside `/analytics`)
1. **خلاصه** — KPI cards (percent trend slope, coverage, adherence, review compliance, readiness of next exam), top 5 insights.
2. **مباحث** — masteryMap + sortable table (pC, pL, confidence, coverage, last practiced, retention, velocity) + drill-down per topic (history, errors by reason, reattempt results).
3. **خطاها** — pointsLost waterfall by reason, reason×topic heatmap, guessEfficiency, blankOpportunity.
4. **زمان و عادت** — pace, speedAccuracy, timeOfDay, weekday, adherence, consistency, fatigue (spec 22 §5).
5. **حافظه** — forgettingCurve, retentionMap, review burden (reviews per retained item).
6. **آزمون‌ها** — prediction vs actual scatter, MAE history, practiceExamGap, organizer bias.
7. **گزارش‌ها** — weekly/monthly report (local PDF/PNG export).
All v1 charts remain (heatmap topic×week, sunburst, 3D surface+2D twin, radar, donut, calibration).

## 3. Insight engine `engine/analytics/insights.ts`
- Library of ~30 insight templates, each: `{id, compute(data) → {effect, n, probability, impactPP, action}, minN, template_fa}`. Examples: transferGap, guessEfficiency, bestTimeBlock, fatigue, avoidedSubject, fadingTopic, carelessnessLeak (> 5 pp lost to carelessness/misread), crammingIndex, untouchedExamTopics, reviewBacklog.
- **Guards:** n ≥ minN; Bayesian probability of the claimed direction ≥ 0.8; across the weekly batch apply Benjamini–Hochberg at FDR 0.10 on `1 − probability` treated as p-values; suppress insights shown in the last 7 days unless effect changed by > 50%.
- **Ranking:** `score = impactPP × actionability (0.5–1) × probability`. Max 5 per week; each has one action button (send to planner, open prep list, change setting).
- **Copy rules:** supportive «هنوز» framing; always include number + n («بر اساس ۴۲ تست»).

## 4. Data quality
Badges on charts: «تخمینی» when based on estimated time; «داده کم» when n < minN; legacy excluded from trends and time metrics.

## Acceptance
- DNAS-1 pointsLost sums equal 100 − P (within 1e-6) when U = 0 and every W/B has exactly one reason bucket.
- DNAS-2 Insight with n < minN is never shown.
- DNAS-3 No more than 5 insights/week; each has an action.
- DNAS-4 Charts show «تخمینی» badge when any input session has timeSource = estimated.
