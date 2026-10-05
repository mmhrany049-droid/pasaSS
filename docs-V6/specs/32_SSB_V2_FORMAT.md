# 32 — SSB v2 book format + prompt-based conversion (extends spec 08)

SSB v1 files stay valid (parser auto-detects by absence of `#نسخه‌قالب: 2`). v2 adds curriculum mapping, editions, numbering scopes and question-level metadata.

## 1. Header
```
#نسخه‌قالب: 2
#کتاب: فیزیک ۲
#ناشر: خیلی سبز
#چاپ: 1405
#پایه: 11
#رشته: ریاضی‌فیزیک            (یا: تجربی، یا: هر دو)
#کتاب‌درسی: tb.11.fizik2.rf     (شناسهٔ مرجع، spec 30)
#شماره‌گذاری: سراسری            (یا: فصلی، یا: گره‌ای)
#سختی: ندارد                   (یا: 3)
```
## 2. Body
```
= فصل ۱: الکتریسیته ساکن                         @مرجع c1
== بخش ۲: قانون کولن و میدان‌ها [41-120]        @مرجع c1/s3 c1/s4 c1/s5 c1/s6
=== درس‌نامه {درسنامه}
=== پرسش‌ها [41-120]
== آزمون چکاپ ۱ {چکاپ|شماره‌جدا} [1-20]          @پوشش c1/s1..c1/s6
@کلید 41-60: 3142231441 2213344123
@سختی 41-120: 1:41-70 2:71-100 3:101-120
@حذف 57                                          (سؤال حذف‌شده)
@چندجوابی 88: 2,4
```
- `@مرجع` relative to `#کتاب‌درسی`; several refs = equal weights unless `c1/s3:0.4`.
- `@پوشش` for exam-like nodes; ranges `a..b` over sibling sections allowed.
- `{شماره‌جدا}` makes the node a numbering scope (spec 31 TB-2).
- Parser errors are line-numbered: `E_SYNTAX, E_DEPTH_JUMP, E_RANGE_OVERLAP_IN_SCOPE, E_REF_UNKNOWN, E_KEY_CHAR, E_KEY_LENGTH, W_UNMAPPED_NODE, W_THEORY_WITH_RANGE`.
- Raw publisher TOC detection (spec 08 v3 patterns) still works; the fixed v3 bug: ordinal words are normalized **only right after** فصل/درس/بخش (spec 38 F-05).

## 3. Prompt workflow (owner request)
The app never calls an AI API (hard rule 1). Instead the user copies a **ready prompt** (`prompts/PROMPT_TOC_TO_SSB_fa.md`, also shown inside the app with a copy button), pastes it plus the test book's TOC (text or photo) into any chatbot, and pastes the returned SSB back into «افزودن کتاب ← چسباندن SSB». The app then:
1. validates and shows errors with line numbers + one-click «پیام اصلاح برای چت‌بات» (copies the errors as a follow-up prompt);
2. shows a mapping preview against the catalog (green = mapped, amber = guessed, red = unmapped) and lets the user fix refs with a picker;
3. imports to a staging area, never directly.
Prompt is versioned (`PROMPT_VERSION=4.0`); the SSB header records it in `#تولید: prompt-4.0`.

## Acceptance
SSB2-T1 v1 seeds parse unchanged · SSB2-T2 v2 example above parses with 0 errors · SSB2-T3 unknown `@مرجع` → E_REF_UNKNOWN with line · SSB2-T4 overlapping ranges in different scopes accepted.
