# 25 — Data Integrity & Edge Cases (v3) — closes audit items A-07..A-14
Every rule below is a pure function in `domain/` with a unit test named after its id.

## 1. Multi-topic & composite questions (INT-MT)
- `Question.topicNodeIds[]` (optional) overrides `nodeId` for analytics; `Question.skillIds[]` for BKT.
- **Credit split:** analytics counts weight `1/k` per topic (k = topicNodeIds length). Sum of weights per question = 1 always (invariant `INT-MT-1`).
- **BKT:** likelihood split, posterior of each skill updated with evidence weight `1/k` (interpolated update `pL' = pL + (1/k)(pL_full − pL)`). Never full evidence to every skill (`INT-MT-2`).
- **Composite questions** («چند مورد درست است»): treated as one MCQ item; optional `Question.format = 'countCorrect'` only changes the error-reason defaults (`misread`, `conceptual`).
- Exam questions mapped to several topics follow the same split.

## 2. Key changes (KEY)
- Every key edit writes `KeyRevision{questionId, old, new, at, source: manual|publisher|errata}` (append-only).
- On `key.changed`: recompute affected Attempt.result, Session.stats, ReviewItems, analytics cache, mastery, BKT (replay from snapshot of the earliest affected attempt), and rewards.
- **Rewards are never revoked** visibly; if a corrected result invalidates `transferImproved`/`masteryUp`, a hidden compensating event is written and the next award is delayed (no negative notification) (`KEY-3`).
- UI Toast: «کلید ۸ سؤال عوض شد؛ نتایج ۳ جلسه به‌روزرسانی شد» + link to diff.
- Conflicting key (publisher errata vs manual): manual wins, errata shown as suggestion.

## 3. Deleting & editing (DEL)
| Action | Rule |
|---|---|
| Delete session | soft delete 10 s undo → tombstone; cascade attempts; recompute attemptIndex of later attempts on same questionRef; ReviewItems: delete if no remaining W/B/guess attempts, else recompute; reward events with `refId` = session → compensating events. |
| Edit answers of saved session | allowed within 7 days; writes `AttemptRevision`; treated as key-like recompute. After 7 days: read-only, "duplicate as correction" button. |
| Delete node with attempts | blocked; offer «انتقال سؤال‌ها به مبحث دیگر» or archive node. |
| Change node range | if it re-maps questions with attempts: preview «۱۲ تست قبلی به مبحث X منتقل می‌شوند»; confirm → move questions, recompute. |
| Delete book | archive by default; hard delete requires typing book name; exports a backup first. |
| Delete exam | cascades exam attempts and its blueprint copy; templates untouched. |

## 4. Repeats (REP)
- Same questionRef answered again: `attemptIndex+1`; `last` mode uses latest; `all` mode uses all.
- **Coverage** counts distinct questions (repeat never increases coverage).
- **Mastery:** repeat attempts within 24 h of a previous attempt on the same question get weight 0.5 (answer memory, not knowledge) (`REP-2`).
- **Prediction:** repeat exams weight 0.4 (ADR-017). Repeat practice of a whole range shows "تکرار" badge and is excluded from `transferImproved`.

## 5. Descriptive exams (DESC)
- Score per question `{score, max, rubricNotes}`; total `/maxScore` (default 20).
- Mapping to topics: each question → topics with weights; topic descriptive mastery `d_t = Σ score / Σ max` (time-decayed like §07.4), shown separately from MCQ pC.
- **Never converted** to MCQ percent; prediction for descriptive exams = predicted score `/20` with interval from Beta(Σscore·k, Σ(max−score)·k), k = 1.
- Readiness for final exams (نهایی) uses descriptive mastery when ≥ 3 descriptive exams exist, else MCQ pC mapped with a monotone calibration curve learned per subject (isotonic regression, ≥ 5 paired points) — flagged «تخمینی».

## 6. Uncorrected (U) & missing data
- U never enters percent, mastery, BKT, rewards. Badge on every number that excludes U.
- Sessions with only U: saved, listed under «منتظر کلید»; daily reminder in Today list.
- Legacy: excluded from trends/time; included in coverage (weight 0.3 mastery).

## 7. Time & calendar
- `localDate` always Asia/Tehran; sessions crossing midnight belong to start date.
- Iran has no DST since 1401; timezone handled via IANA data, not hardcoded offset.
- Jalali leap years from library; tests for 1403/12/30 and 1404/01/01.
- Device clock skew: if new `at` < last stored `at` − 1 h, warn and use last+1 s.

## 8. Input validation
Digits normalized (Persian/Arabic/Latin); answer string accepts `0-4`, `۰-۴`, `-`, space; range `from ≤ to`, size ≤ 300; minutes 1–600; key length = range size; every error message Persian with field focus.

## Acceptance
INT-MT-1, INT-MT-2, KEY-1 (recompute), KEY-2 (diff toast), KEY-3 (no visible revoke), DEL-1 (undo restores identical state hash), DEL-2 (node with attempts not deletable), REP-1 (coverage unchanged by repeat), REP-2, DESC-1 (never percent), DESC-2 (interval contains point estimate), CAL-1 (midnight session), VAL-1.
