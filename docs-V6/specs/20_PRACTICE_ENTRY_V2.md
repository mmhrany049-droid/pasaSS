# 20 — Practice Entry v2 (VKS) — replaces `/practice/new` flow in spec 09
Owner complaint (v1): entering a test session was slow and required per-question data the student never has.
Target: **subject → book → range → answer list → approximate total time → done.** Nothing else is mandatory.

## Flow (wizard, one screen per step on mobile, side panel on desktop)
| Step | Screen | Rules |
|---|---|---|
| 1 | **درس** (subject) | Chips of subjects that have ≥1 book, ordered by last use. Last-used is pre-selected; `Enter` = continue. |
| 2 | **کتاب** (book) | Books of that subject. Auto-skip when the subject has exactly one book. |
| 3 | **بازه** (range) | Book tree (chapters collapsed, last-used chapter expanded). Tap a leaf → its `qStart–qEnd` fills `از/تا`. Fields always editable. `+ بازه دیگر` adds a range (multi-range allowed, may span nodes of the same book). |
| 4 | **لیست پاسخ** | BubbleSheet (spec 09) for exactly the chosen numbers, grouped by range. Guess `?` and important `!` are optional and collapsed under «گزینه‌های بیشتر». Paste mode: a digit string `3140221…` fills rows in order. |
| 5 | **زمان حدودی** | «حدوداً چقدر طول کشید؟» chips: ۱۰ · ۱۵ · ۲۰ · ۳۰ · ۴۵ · ۶۰ · ۹۰ دقیقه + numeric field. Prefill = running timer value if a timer was started, else `round5(N × userMedianSecPerQ / 60)`. «نمی‌دانم» allowed. |
| 6 | **ثبت** | Save → correction animation → summary card (C/W/B/U, percent, minutes, sec/question, vs. last time on same node). |

After summary, **error analysis is offered, never forced**: buttons «تحلیل خطاها الان» / «بعداً». «بعداً» creates an `ErrorAnalysisTask` that appears in Today list and the assistant; completing it later earns reward (spec 11). This is what keeps entry to "همین".

## Range intelligence
- **Empty node ranges** (seed books ship without ranges): when a leaf has no `qStart/qEnd`, ask «این مبحث از تست چند تا چند است؟» once; offer «برای این مبحث ذخیره شود» (writes node range, validates `E_RANGE_OVERLAP`).
- **Continue suggestion**: top card «ادامه: {node} تست {a} تا {b}» = next unattempted block (size = user's median session N, default 20) in the last-used node; one tap fills steps 1–3.
- **Already-attempted numbers** in range: inline note «۱۲ تست از این بازه قبلاً زده شده؛ به‌عنوان تکرار ثبت می‌شود» (attemptIndex increments; allowed).
- **Missing key**: note «کلید این بازه ثبت نشده؛ پاسخ‌ها ذخیره و بعداً خودکار تصحیح می‌شوند» (result U, ADR-012).
- **Range sanity**: from>to, >300 questions, or numbers outside node range → inline Persian error, never a modal.

## Time model (ADR-028)
- Store `Session.durationSec = minutes × 60`, `Session.timeSource ∈ {timer, estimated, none}`. `Attempt.timeSec = null` for estimated sessions (do **not** fake per-question time).
- Derived `session.secPerQ = durationSec / (C+W+B+U)`; `null` when timeSource = none.
- Everywhere v1 used per-question time (strategy §7, workload §14, planner demand), use `userMedianSecPerQ` = weighted median of `session.secPerQ` over last 60 days (weight 0.5 for `estimated`, 1 for `timer`), per subject when that subject has ≥3 timed/estimated sessions, else global, else default 72 s.
- Optional per-question timer stays available in settings (power users), never default.
- `Attempt.position` (1-based order inside the session) is stored for fatigue analysis (spec 22 §5).

## Draft & safety
Autosave draft on every keystroke to `sessionDrafts`; reopening the route resumes. Save shows Toast with Undo 10 s. Back navigation never loses answers.

## Speed targets
Returning user, continue suggestion, 20 questions: ≤ 3 taps + 20 digit keys + 1 tap for time. Cold path: ≤ 6 taps before typing answers.

## Acceptance (add to spec 17)
- VKS-6 Wizard order is subject → book → range → list → time; no other mandatory step.
- VKS-7 Seed node without range asks for range once and can save it.
- VKS-8 Time chip "۳۰" on 20 questions stores durationSec 1800, timeSource estimated, secPerQ 90, attempt.timeSec null.
- VKS-9 «بعداً» on error analysis creates ErrorAnalysisTask visible in Today list.
- VKS-10 Killing the tab mid-entry and reopening restores all answers.
