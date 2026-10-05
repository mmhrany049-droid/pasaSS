# 09 — UI / UX Specification

## Global
- `<html lang="fa" dir="rtl">`; Vazirmatn bundled; light/dark theme; base font 15px; WCAG 2.2 AA contrast.
- Persian digits in display; inputs accept ۰-۹, ٠-٩, 0-9 (normalize in `infra/digits.ts`). Formulas, codes, IDs wrapped in `<bdi dir="ltr">`.
- Jalali dates everywhere (`۱۴۰۵/۰۷/۰۹`); week grid Saturday→Friday.
- Every list/chart has: empty state (with CTA), loading skeleton, error state with retry, "data stale" badge.
- Every number in analytics has an `ExplainPopover` ("این عدد چطور حساب شد؟") showing formula + inputs + sample size.
- Motion: Framer Motion, 150–250 ms, respects `prefers-reduced-motion`.
- Navigation (right sidebar desktop / bottom bar mobile): داشبورد · ثبت تست · مرور · آزمون‌ها · برنامه · تحلیل · کتاب‌ها · بیشتر (مباحث خوانده‌شده، پاداش، دستیار، نیمرخ من، تنظیمات). Floating assistant button on every screen (v2).

## Routes & screens
| Route | Screen | Key contents |
|---|---|---|
| `/` | Dashboard | next exam countdown (d:h:m), today's plan, top-5 urgent reviews, workload verdict, 30-day progress line, activity heatmap (Sat-first), daily check-in card, reward summary |
| `/practice/new` | New session | **v2: spec 20 wizard** subject → book → range → list → approximate time |
| `/practice/:id` | Session result | correction animation, per-question reason picker for W/B, guess toggle, important toggle, summary stats |
| `/legacy` | Legacy records | same sheet, no date, no percent display |
| `/review` | Review queue | today's due sorted by priority; card mode: shows book+node+question number+reasons; buttons again/hard/good/easy; filters |
| `/exams` | Exams list | upcoming/past tabs, create MCQ/descriptive, repeat button |
| `/exams/:id` | Exam detail | key entry, answers, section→topic mapping, images gallery, results, compare with prediction and previous repeats |
| `/prep/:examId` | Preparation (v2: spec 24 adds blueprint, RI, gap tabs, action plan, what-if) | prediction histogram P10/P50/P90, untaught-topic warnings, answer strategy, prep list with checkboxes, similar exams |
| `/planner` | Planner | goals, availability editor (weekly grid), generate proposal, proposal week view with reasons, approve/edit/discard, today list with start/done |
| `/planner/long` | Long-term | milestones timeline to deadline, monthly load bars |
| `/analytics` | Analytics | heatmap topic×week, coverage sunburst, percent trend, 3D surface (+2D twin), radar by subject, reasons donut, difficulty chart, calibration chart, prediction vs actual scatter; filters subject/book/date |
| `/books` | Shelf | books grouped by subject, key completeness bar |
| `/books/:id` | Book editor | tree editor drag/drop, SSB text tab (two-way), fast key entry (keys 1–4 auto-advance, paste string), difficulty ranges |
| `/taught` | Taught topics | TreeChecklist tri-state per book, state chips (school/self/mastered), date picker, history timeline |
| `/rewards` | Rewards | v2 (spec 11): XP/level, coins + personal shop, quests, mastery badges, records, weekly report, settings |
| `/profile` | Learner profile | spec 21: questionnaires, behavioral signals, adaptations with «چرا؟» |
| `/settings/adaptation` | Adaptation | spec 22: decisions, preferred arm, override/reset |
| `/checkin` | Check-in & questionnaires | daily check-in, optional instruments, privacy note |
| `/assistant` | Assistant | v2 (spec 12): bot-style chat, inline buttons, main-menu keyboard, slash commands, coach, search |
| `/settings` | Settings | reasons & weights, algorithm params, theme, calendar/holidays, backup/restore, data reset, about |

## Core components
- **BubbleSheet**: Ghalamchi-style columns of 10; keyboard: `1-4` choose, `0`/`Space` blank, `?` toggle guess, `!` important, `←/→` (RTL-aware) move, `Backspace` clear; mouse/touch tap; sticky header with counts; supports multiple ranges with separators; virtualized for 300+ rows.
- **Correction animation**: per-row color sweep green/red/grey/amber(U) 30 ms stagger; then summary counters animate.
- **ReasonPicker**: multi-select chips with weights; remembered last choice; skip allowed.
- **TreeChecklist**: tri-state, keyboard navigable, shows question count per node.
- **KeyPad**: fast key entry with error highlighting vs length.
- **JalaliDatePicker**, **Countdown**, **StatCard** (animated counter), **ChartBox** (title, filter, explain, 2D/3D toggle), **Modal**, **Toast** (with Undo 10 s), **EmptyState**.

## Microcopy rules (fa.json)
Supportive, non-judgmental. Never "تنبل", "ضعیف". Use "هنوز" framing: «این مبحث هنوز داده کافی ندارد».


## v4 note
Navigation and restored screens: see spec 37 (§Navigation v4). New screens: ورود سابقه (spec 33), شبکه و اشتراک (spec 35), پنل پرامپت کتاب (spec 32), انتخاب رشته و پایه in onboarding (spec 30).
