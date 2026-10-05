# 30 — Curriculum Catalog (CUR) — v4, new

The catalog is the **canonical skeleton** of the official Iranian high-school textbooks (کتاب درسی). Every test book, exam, past record, skill and population statistic is anchored to catalog node IDs. Without it, data from different test books, students and streams cannot be compared or pooled.

Files: `curriculum/catalog.json` (programs + textbooks + nodes), `curriculum/links.json` (cross-stream/cross-grade links), `curriculum/CATALOG_fa.md` (human-readable), schema `schemas/curriculum_v4.schema.json`.

## 1. Source and status
- Source: TOC screenshots sent by the owner (edition 1405). All 14 textbooks for grades 10 and 11 were read and verified node by node. Byte-identical images confirm that ریاضی ۱، شیمی ۱ and شیمی ۲ are the same book in both streams.
- **Grade 12 is intentionally empty** (`rf.12`, `tj.12` status `pending-owner-input`). Code must treat an empty program as valid: show «فهرست این پایه هنوز وارد نشده»، allow custom subjects, and accept a catalog update pack later without a migration.
- Catalog is versioned (`catalogVersion` semver). Updates ship as a Population Pack section (spec 35) or as a file import; node IDs are **never reused or renamed**. Deprecations use `replacedBy`.

## 2. ID scheme (stable, ASCII)
`tb.{grade}.{book}[.{stream}]` for textbooks; nodes append `/c{n}` chapter, `/l{n}` درس, `/s{n}` numbered section (physics `n-m`), `/g{n}` گفتار (biology), `/t{n}` subtopic, `/q` the chapter's «پرسش‌ها و مسئله‌ها». Example: `tb.11.fizik2.tj/c3/s9` = قانون لنز in the experimental Physics 2.
Programs: `{stream}.{grade}` → ordered list of textbook IDs. Streams: `rf` = ریاضی‌فیزیک، `tj` = علوم تجربی.

## 3. Content snapshot (grades 10–11)
| Program | Textbooks |
|---|---|
| rf.10 | ریاضی ۱ (مشترک) · هندسه ۱ · فیزیک ۱ ریاضی (۵ فصل) · شیمی ۱ (مشترک) |
| tj.10 | ریاضی ۱ (مشترک) · زیست ۱ (۷ فصل) · فیزیک ۱ تجربی (۴ فصل) · شیمی ۱ (مشترک) |
| rf.11 | حسابان ۱ · هندسه ۲ · آمار و احتمال · فیزیک ۲ ریاضی (۴ فصل) · شیمی ۲ (مشترک) |
| tj.11 | ریاضی ۲ (۷ فصل) · زیست ۲ (۹ فصل) · فیزیک ۲ تجربی (۳ فصل) · شیمی ۲ (مشترک) |
| rf.12 / tj.12 | خالی، آماده برای ورود |

Chemistry textbooks list chapters only; lessons come from test books (granularity `chapter`). Physics TOCs include a «پرسش‌ها و مسئله‌ها» node per chapter (kind `problemSet`).

## 4. Cross-stream links (owner's help.txt requirement)
Link types (in `links.json`):
| type | meaning | allowed use |
|---|---|---|
| `identical` | same textbook content | direct comparison of mastery/percent across streams; pooled population statistics |
| `equivalent` | same concept, comparable depth, different book/title | comparison labelled «معادل»; pooled with a stream fixed effect |
| `partial` | overlap with weight `overlap` ∈ (0,1) | weighted comparison only, always with a warning badge |
| `prerequisite` | A must precede B | skill graph (spec 34), never comparison |
Key findings encoded:
- Physics 1: chapters 1–3 identical; chapter 4 identical except rf adds 4-6 قوانین گازها; chapter 5 ترمودینامیک is rf-only.
- Physics 2: tj chapter 3 «مغناطیس و القا» = rf chapter 3 + rf chapter 4 (tj 3-7..3-11 ↔ rf 4-1..4-5); rf adds 1-11 خازن با دی‌الکتریک; 1-9 differs in title (equivalent 0.8).
- Math grade 11: ریاضی ۲ (tj) maps lesson-by-lesson to حسابان ۱ and آمار و احتمال (rf) with partial/equivalent weights; rf-only: قدر مطلق، روابط مجموع و تفاضل، حدهای یک‌طرفه، منطق و مجموعه‌ها، آمار استنباطی.
- Cross-grade: ریاضی ۲ فصل هندسه (tj, grade 11) ↔ هندسه ۱ (rf, grade 10), scope `crossGrade`.
- Math links were derived from titles only → flagged «نیازمند تأیید عمق محتوا». They are defaults; population data (spec 35) recalibrates `overlap` via measured correlation and the owner can edit.

## 5. Rules
- CUR-1 Every Book (test book) node has `curriculumRefs: [{nodeId, weight}]` (many-to-many; weights sum to 1). Unmapped nodes are allowed but excluded from cross-book/cross-user analytics and shown with «بدون نگاشت».
- CUR-2 Comparisons across users/streams only through `identical|equivalent|partial` links; `partial` requires the weight and a visible warning.
- CUR-3 A student's program (stream+grade) filters default views, but older grades stay visible (review of grade 10 material while in grade 11 is normal and needed for کنکور).
- CUR-4 Changing stream or grade never deletes data; it changes the default program.
- CUR-5 The catalog is read-only for users except: owner/author role may add lesson-level children under chapter-granularity textbooks (chemistry) through a catalog patch file.

## Acceptance
- CUR-T1 Loading `catalog.json` validates against schema; all link endpoints exist (CI).
- CUR-T2 Empty programs (`rf.12`) render empty state without errors.
- CUR-T3 A tj student and an rf student practicing Physics 2 «قانون لنز» appear in the same comparison group.
