# 33 — Importing the past: old tests (before the app) and past exams (HIS) — v4, new

Owner requirement: «سیستم وارد کردن تست‌های گذشته (قبل از ساخت برنامه)» and «سیستم وارد کردن امتحان‌های گذشته (برای قوی کردن دیتابیس)». v0.1 had only `legacy` = full answer sheet, no date, weight 0.3. v4 supports how history really exists.

## 1. Three evidence levels
| level | what the user has | entity | used for |
|---|---|---|---|
| L1 item-level | chosen option per question (marked in the book) | `Session{kind:'legacy'}` + Attempts | mastery, review queue, coverage, IRT |
| L2 aggregate | «فصل ۲ تست ۱ تا ۸۰ حدوداً ۶۰٪» or C/W/B counts | `AggregateRecord{scope(nodeIds or range), N?, C?, W?, B?, percentApprox?, confidence}` | coverage, mastery prior (pseudo-counts), never review items |
| L3 report card | کارنامهٔ آزمون: percent per subject, تراز، رتبه، میانگین/بیشینهٔ شرکت‌کنندگان | `ExamResultCard{examRef, perSubject[], taraz?, rank?, cohortStats?}` | calibration of predictor per organizer, readiness target, population link |

## 2. Approximate dates (replaces "legacy = no date")
`dateApprox{from, to, precision: day|week|month|term|unknown}`. Weight in mastery: `w = E[0.5^(age/H)]` over the interval (closed form for uniform interval) × level factor (L1 1.0, L2 0.6). Unknown date → the old fixed 0.3. Legacy stays excluded from trends and time metrics (spec 25), included in coverage.

## 3. L2 → model evidence
Aggregate with N and percent → solve for (C, W, B): if only percent given, assume user's blank share `b̂` (subject median, else 0.2): `C = N·(3P/100 + (1−b̂))/4`, `W = N(1−b̂) − C`, `B = N·b̂` (clamp C,W to [0, N(1−b̂)]; derived from P = (3C−W)/(3N)·100). Converted to **pseudo-counts** with confidence factor 0.5 and spread to covered nodes by question share. Shown as «برآورد از سابقهٔ خلاصه».

## 4. Past exams (to strengthen the database)
Three sources, one `ExamTemplate` entity (the exam paper) + optional `ExamSitting` (a person's attempt):
1. **Own past exams** with answer sheet + key → full ExamAttempt (item-level, organizer, date). Repeat sittings (دوباره آزمون بده) stored as `isRepeat`, weight 0.4 in prediction, shown separately (v0.2 rule restored).
2. **Own report cards only** → L3 card.
3. **Public exam papers** (کنکور سال‌های قبل, قلمچی booklets) imported as `ExamTemplate` with key, per-question `curriculumRefs`, and optional published statistics (`pCorrectPublished`, `pBlankPublished`, cohort size). These seed **IRT item difficulty priors** and the organizer blueprint (spec 24), even with zero personal attempts.
Formats: SSE text (same grammar style as SSB: `#آزمون:`, `#برگزارکننده:`, `#تاریخ:`, `= درس فیزیک [91-120] @مرجع tb.11.fizik2.rf/c1..c2`, `@کلید`, `@آمار 91: درست 32 نزده 41`), CSV, or prompt-assisted conversion (`prompts/PROMPT_EXAM_TO_SSE_fa.md`).

## 5. Wizard «ورود سابقه» (first-run and anytime)
Step 1 choose source (کتاب تست / آزمون / کارنامه) → 2 choose book or exam → 3 choose level (پاسخ تک‌تک / خلاصه / کارنامه) → 4 approximate date chips (این ماه، ماه قبل، ترم قبل، نمی‌دانم) → 5 entry (answer string, counts, or card fields) → 6 preview of effect («تسلط فصل ۲ از نامعلوم به ۵۵٪ ± ۱۲») → save. Bulk mode: repeat steps 2–5 in a table.

## 6. Guards
- No rewards for history import (anti-gaming); a single «سابقه کامل شد» badge only.
- History never creates review cards older than 60 days automatically; offers «این‌ها را هم به مرور اضافه کن؟».
- Import goes to staging, shows counts, can be undone as a batch (`ImportBatch` id on every row).

## Acceptance
HIS-T1 L2 percent-only record changes coverage and prior but creates 0 ReviewItems · HIS-T2 approximate month date gives weight between day-precision and unknown · HIS-T3 public exam with published stats sets item difficulty prior without any personal attempt · HIS-T4 undo batch removes all its rows and recomputes derived data.
