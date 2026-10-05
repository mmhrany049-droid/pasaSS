# 31 — Test-Book Rules v4 (replaces conflicting parts of specs 06–08 and 25)

The v0.1 "special states" (حالت B/D/F/H، نوع چهارم) were carried forward partly and inconsistently. v4 restates them as one rule set and fixes their known defects. Where this spec conflicts with 06/07/08/25, **this spec wins**.

## 1. Identity and numbering (fixes v0.1 حالت H)
- TB-1 Every question has an internal immutable `qid` (UUID v7). The printed number is a **label**: `{bookEditionId, numberingScopeId, number}`. Changing numbering mode never changes `qid`, so history survives.
- TB-2 Numbering scopes are nodes: any node may declare `numberingRoot: true` (SSB `{شماره‌جدا}`), e.g. checkups numbered 1–20 inside a globally numbered book. Range-overlap checks run **within a scope only** (v3 prototype bug: checkup ranges were blocked as overlaps).
- TB-3 Book **editions**: `BookEdition{bookId, year, printRun}`; ranges and keys belong to an edition. A new edition can be imported with an automatic `EditionMap` (title + range alignment, owner-confirmed) so old attempts stay comparable.

## 2. Node kinds and attribution (fixes v0.1 حالت D)
| kind | counts as topic? | attribution of a question's evidence |
|---|---|---|
| topic | yes | to itself |
| theory (درس‌نامه) | no tests | none |
| mixed (تست‌های مخلوط) | no | to explicit `topicRefs` if given; else **probabilistic attribution** (below); context tag `mixed` |
| checkup / comprehensive / final | no | same as mixed; context tag `exam-like` |
- TB-4 v0.1 rule "split each question equally `1/|covers|`" is **removed**. It diluted evidence and hid weak topics.
- TB-5 Probabilistic attribution: for a question without `topicRefs`, posterior over covered topics `P(t|answer) ∝ prior_t × P(answer|mastery_t)` where `prior_t ∝ questionShare_t` (by test-count in the book). Evidence weight per topic = that posterior (sums to 1), recomputed when mastery changes (derived, cache-invalidated). A user can tag any question's topic later (one tap) → exact attribution replaces the posterior.
- TB-6 `mixed`/`exam-like` results are **never pooled** with blocked topic practice for mastery point estimates; they feed a separate `transfer` estimate per topic (spec 23 transfer gap) and the exam predictor. This preserves the interleaving signal.
- TB-7 Checkup coverage: default = topics between this checkup and the previous one **in book order**, but stored explicitly as `coversNodeIds` and editable. The UI warns if the user studied in a different order (taught dates disagree).

## 3. Answers and keys (fixes v0.1 حالت F)
- TB-8 `answer` is a set: `{1..4}` (normal), multiple values (دوجوابی), `cancelled` (حذف‌شده, excluded from N), `unknown` (U). Key changes create `KeyRevision` (spec 25 §2); results are recomputed but rewards already granted are never visibly revoked (compensating event, silent).
- TB-9 Key entry accepts `0`/`-` = unknown; a shorter pasted key **clears** the remaining range only after explicit confirmation (v3 bug: leftovers kept).
- TB-10 Disputed keys: user can flag «کلید اشتباه است»; flagged questions are excluded from percent until resolved; population data (spec 35) can suggest the likely correct key when ≥ 20 users disagree with the printed one.

## 4. Difficulty (v0.1 نوع چهارم)
- TB-11 Difficulty is per question (`1..difficultyMax`) or per range (`@سختی`). If the book has no levels, difficulty is **estimated** from population data (IRT b-parameter, spec 34) and shown as «سختی برآوردی».

## 5. Duplicates and cross-book questions
- TB-12 The same question may appear in two books or in an exam (کنکور questions reprinted). `QuestionAlias{qidA, qidB, confidence}` links them; evidence is counted once per day per alias group (prevents double counting). Population pack can supply alias suggestions.

## 6. Ranges, repeats, practice states
- TB-13 Ranges are asked once and saved on the node (spec 20). Repeated attempt of the same `qid` within 24 h weighs 0.5 (spec 25 REP-2); coverage counts distinct `qid`.
- TB-14 «تدریس شد» and «خودم خواندم» are two states (v0.2 decision, lost in v3 prototype). Coverage uses «خودم خواندم»; «تدریس شد» only drives warnings and the untaught prior.
- TB-15 Important flag («مهم») on any question, even if correct; goes to the review queue (v0.1).

## Acceptance (named tests)
TB-T1 checkup with own numbering 1–20 in a global book saves without overlap error · TB-T2 changing numberingMode keeps all attempts · TB-T3 cancelled question excluded from N · TB-T4 mixed results don't move blocked mastery but move transfer · TB-T5 probabilistic attribution sums to 1 and becomes exact after tagging · TB-T6 alias group counted once.
