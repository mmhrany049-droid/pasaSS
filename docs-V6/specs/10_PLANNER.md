# 10 — Planner (PLN)

## Inputs
Goals (deadline, priority, target, scope) · AvailabilityBlocks (hard: school, sleep, commute, fixedEvent; soft: preferred study windows) · Exams · ReviewItems due · DNAS mastery/coverage per topic · user median sec/question · historical actual/planned ratio · latest check-in (energy, sleep) · settings (max session length default 50 min, break 10 min, max daily study default 240 min weekday/360 Friday, min sleep 8h).

## Hard rules
1. Never place activities in hard blocks; never reduce sleep below `minSleep`.
2. Max one "exam" activity per day; at least one rest block per 2 sessions.
3. Proposal is a **draft** until user approves. No auto-approval.

## Algorithm v1 (deterministic, explainable)
1. **Demand** per goal/topic: `demandMin = untouchedQ×secPerQ/60 + dueReviews×1.5 + weakTopicBonus` where weak = pC < 0.5 with confidence ≥0.4 → +20 min.
2. **Urgency** `u = priority × (1 + 14/ max(1,daysToDeadline)) × (1 + (1 − pC))`.
3. **Long-term backward pass** (horizon > 2 weeks): split each goal into weekly milestones proportional to remaining demand, with a final 20% of the window reserved for mixed review/mock exams (interleaving + spacing; Cepeda-style compression near exam).
4. **Weekly packing**: free slots = availability − hard blocks; chunk to sessions (25 or 50 min by check-in energy: energy ≤2 → 25). Greedy: sort candidate activities by `u / durationMin`, place earliest feasible slot, constraint: same subject not in > 2 consecutive sessions; reviews scheduled on their FSRS due date ±1 day.
5. **Capacity correction**: multiply estimates by user's historical `actual/planned` ratio (clamp 0.8–1.6; default 1.2 — planning-fallacy buffer).
6. **Feasibility**: ratio = requiredMin / availableMin → ok <0.8, tight 0.8–1.0, overloaded >1.0. If overloaded: show what is dropped and why (lowest u first), offer options: extend deadline, reduce scope, add slot.
7. **Explanations**: each activity gets `reason` text from templates, e.g. «۱۲ تست قانون کولن چون ۵ روز تا آزمون قلمچی مانده و تسلط ۴۲٪ است».
8. **Activity spec**: must have concrete volume + success criterion + fallback (e.g., «اگر وقت کم بود: فقط ۶ تست»).
9. **Implementation intention** prompt on approval: user may attach «اگر … آنگاه …» per day.
10. **Replanning**: on day end, unfinished items → proposed moves (never silent). Weekly review screen (Friday): planned vs done, actual-time learning, adjust ratio.

## Outputs
Proposal{feasibility, explanations[]}, PlannedActivity[] (schema), long-term milestone list.

## Tests
Property: no activity overlaps hard block; total ≤ daily cap; deterministic for same inputs; overloaded inputs produce dropped list with reasons.

## v2 links (2026-10-02)
- Inputs added: PAAS action plan (spec 24 §6) as goal-scoped candidates with `gainPerMin`; adaptation arms (spec 22) for session length, daily load and hard-task block; per-subject planning ratios (spec 22 §6); open ErrorAnalysisTasks (spec 20) as 10-min activities.
- Urgency v2: `u = priority × (1 + 14/max(1,daysToDeadline)) × (1 + (1 − pC)) × (1 + 10·gainPerMin)` (gainPerMin in pp/min, 0 when unknown).
- Day before an exam: only light review ≤ 60 min, no new material; protect sleep.
- Every adapted value shows «تنظیم‌شده برای تو» chip (spec 22 §7).
