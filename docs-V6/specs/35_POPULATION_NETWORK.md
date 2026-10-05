# 35 — Multi-user network without hosting (NET) — v4, new
Supersedes the R1–R3 transport assumptions of spec 14 for the near term (spec 14 hub stays the long-term option). Telegram bot implementation details are **deferred** (to be designed together with the owner); this spec fixes everything the bot must rely on.

## 1. Idea («شبکهٔ پستی»)
No server, no hosting cost. Data moves as files:
```
 Student app ──(1) export .ssx bundle──► Telegram bot (runs on owner's PC, polling)
                                              │ (2) verify, dedupe, store
                                              ▼
                                       Aggregator (same PC, Python)
                                        (3) merge → train G1/G2 models (spec 34)
                                              │ (4) build .ssp population pack
 Student app ◄──(5) import .ssp ─────────────┘   (bot sends it to every member / on request)
```
Transport-agnostic: the same files work by hand (USB, any messenger, email). The bot is just a convenient mailbox.

## 2. Roles
student (default) · aggregator-admin (owner) · later: teacher/class admin (gets class-level reports from the pack only, never raw data of others).

## 3. Identity and privacy
- Each install creates `memberId` = random 128-bit; **no names, phone numbers or school names** in bundles. Optional `cohortTags` chosen by the user from fixed lists (stream, grade, province-level region, organizer). Telegram user id is stored only inside the bot's local mapping table for replying, never in the dataset.
- Consent screen before first export (Persian, plain): what is shared, what is not, how to withdraw. Under-18 → guardian confirmation checkbox + text (spec 27 §5). Withdrawal = export a `.ssx` with `revoke: true`; aggregator deletes that member's rows and the next pack excludes them.
- Shared data classes: attempts (no free-text notes), review ratings, session meta (duration bucket, hour bucket), catalog mappings, exam templates and keys, aggregate history, check-in bucketed (opt-in separately). Never: psych questionnaire answers, safety logs, notes, photos, chat with assistant.
- k-anonymity in packs: any statistic shown for a group needs ≥ 10 members; otherwise suppressed. Optional differential-privacy noise on cohort percentiles (ε configurable, default 2).

## 4. Integrity
- Bundles are signed with a per-install Ed25519 key (public key in the bundle header) → aggregator detects tampering and links a member's bundles.
- Every record carries a ULID `recordId`; aggregator ingestion is idempotent (re-sending the same bundle is harmless). Bundles are incremental: `sinceCursor` → only new/changed records + tombstones.
- Packs are signed by the aggregator key; the app shows «بستهٔ تأییدشده از <نام گروه>» and refuses unsigned packs unless developer mode.
- Anti-poisoning: the aggregator down-weights members flagged by anti-gaming rules (spec 11), extreme answer patterns, or keys that contradict the majority; per-member cap on influence (max 2% of item evidence).

## 5. What comes back (population pack .ssp)
item calibration (IRT a/b, guess), topic base rates by stream×grade, cross-stream overlap re-estimates (spec 30 links), key-error suggestions (TB-10), question alias suggestions (TB-12), shared test-book SSB files and exam templates contributed by members (after admin approval), cohort percentiles for comparison (opt-in view), organizer bias estimates, neural model files (if the ship gate passed), catalog updates (e.g., grade-12 textbooks when added).

## 6. Comparisons the pack enables (owner: «در قسمت‌هایی که باید مقایسه شوند»)
- Same topic across streams via `identical/equivalent` links (labelled), `partial` only weighted.
- Percentile among same program (rf.11) and among all students who studied the linked node.
- Never ranking by name; never public leaderboards (rewards spec).

## 7. Limits to design for (bot details later)
File size: keep bundles ≤ 15 MB (split into parts `part 1/n` otherwise); Telegram Bot API file limits must be re-checked when the bot is built. Network access to Telegram from Iran may be unreliable/filtered → transport adapters must be swappable (a Bale/Eitaa-compatible adapter is a candidate; verify APIs then). The app itself never needs the network.

## Acceptance
NET-T1 same bundle ingested twice → identical aggregate · NET-T2 tampered bundle rejected · NET-T3 revoke removes member from next pack · NET-T4 statistic with 9 members suppressed · NET-T5 pack import is staged and reversible.
