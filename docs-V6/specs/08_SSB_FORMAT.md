# 08 — SSB Book Format v1.1

## Grammar (EBNF)
```
file      = { line } ;
line      = meta | node | directive | comment | blank ;
meta      = "#" key ":" value ;                 (* کتاب ناشر درس پایه رشته ویرایش شماره‌گذاری سختی مجوز *)
node      = depthMarks ws title [ ws tag ] [ ws range ] ;
depthMarks= "=" | "==" | "===" | "====" ;       (* depth 0..3 *)
tag       = "{" ( "مخلوط" | "چکاپ" | "جامع" | "نهایی" | "درسنامه" | "شماره‌جدا" ) { "|" tagWord } "}" ;
range     = "[" int "-" int "]" ;
directive = "@کلید" ws range_ ":" ws keyString
          | "@سختی" ws range_ ":" ws diffSpec
          | "@مهارت" ws nodeCode ":" ws skillList ;
keyString = { "1".."4" | "0" | "-" | " " } ;     (* 0 or - = unknown; Persian digits accepted *)
diffSpec  = level ":" range_ { ws level ":" range_ } ;
comment   = "//" text ;
```
Tag → kind: مخلوط=mixed, چکاپ=checkup, جامع=comprehensive, نهایی=final, درسنامه=theory, none=topic. `شماره‌جدا` sets `numberingRoot=true`.
Meta `شماره‌گذاری`: سراسری=global, فصلی=perChapter, گره‌ای=perNode. `سختی`: ندارد | integer max level.

## Raw-format detection (publisher TOC pasted as-is)
| Pattern (regex, after digit normalization) | Maps to |
|---|---|
| `^فصل\s*(\S+)[\s:ـ\-–]+(.+)` | depth 0 |
| `^(\d+)[.\-)]\s*(.+)` | depth 1 |
| `^\s*زیرعنوان\s*([\d\-]+)\s*:?\s*(.+)` | depth 2 |
| `^بخش\s*(\d+|ORD)\s*:?\s*(.+)` | **parent depth + 1** (under فصل → 1, under درس → 2) — v3 fix for Calculus TOC |
| `^درس(?:‌های)?\s*(.+?)\s*:\s*(.+)` | depth 1 (v3) |
| ORD = اول\|دوم\|سوم\|چهارم\|پنجم\|ششم\|هفتم\|هشتم\|نهم\|دهم → 1..10 | ordinal words normalized (v3) |
| `^[•·]\s*(آزمون.+)` | depth 1, kind by keyword: چکاپ→checkup, جامع→comprehensive, کنکور/پایان→final |
| title contains `تست‌های مخلوط` | kind mixed |
| lines of `=` or `-` only | ignore |

## Validation errors (show line number, Persian message)
`E_DEPTH_JUMP` (depth increases by >1) · `E_RANGE_OVERLAP` · `E_KEY_LENGTH` (key string length ≠ range size) · `E_KEY_CHAR` · `E_UNKNOWN_TAG` · `E_THEORY_WITH_RANGE` · `W_NO_RANGE` (warning only).

## Round-trip
`serialize(parse(x))` must equal normalized x. Editor tree ↔ SSB text both directions.

## Seed books
- `seed/physics2_kheilisabz.ssb` — Physics 2 (grade 11), each section = theory + questions leaf (ADR-014).
- `seed/chemistry2_mobtakeran.ssb` — Chemistry 2 (grade 11).
- `seed/calculus1_olgoo.ssb` — Calculus 1 (grade 11, Nashr-e Olgoo): فصل → درس → بخش; lessons without sections are topic leaves (v2, from owner TOC 2026-10-02).
Ranges and keys in seeds are intentionally empty; user fills them.
