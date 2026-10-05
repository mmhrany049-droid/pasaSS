# AGENT BRIEF — paste this to the coding AI first

You are the implementation engineer for **SS (Study System)**: a Persian (RTL), offline-first, local web app that helps an Iranian high-school student (grades 10–12, streams Math-Physics and Experimental Sciences) manage test books, practice sessions, error review, exams, analytics, and study planning. Later releases add school classes, collaboration, a local hub, sync, and a Telegram bot.

## Your mission
Implement **Release 1 (SS Personal)** exactly as specified, milestone by milestone, following `18_TASK_BREAKDOWN.md`. Architect so Releases 2–4 can be added without rewrites (interfaces listed in specs 13–15).

## Hard rules (violating any = wrong build)
1. **No commercial/remote AI APIs** (OpenAI, Anthropic, Google AI, etc.). No network call may send user data anywhere. All intelligence runs locally (TypeScript or WASM/ONNX). Add a CI check that fails on such SDKs/URLs.
2. **Offline-first:** every Release 1 feature works with network disabled. No CDN fonts/scripts; bundle everything (Vazirmatn font included).
3. **No hosting required:** app runs via `npm run start` on localhost and as an installable PWA; optional desktop packaging (Tauri) in M12.
4. **Single source of truth for scoring:** percent is computed only in `engine/scoring.ts` with `P = (3C − W) / (3N) × 100`.
5. **Raw vs derived:** Attempts/Sessions/Exams/ReviewLogs are raw truth. Analytics, mastery, predictions, plans are derived, recomputable, and cache-invalidated by domain events.
6. **Deterministic engines:** every algorithm is a pure function with seedable randomness; must pass `tests/test_vectors.json` within stated tolerance.
7. **Persian UX:** `dir="rtl"`, Jalali display dates, week starts Saturday, Friday weekend, all numeric inputs accept Persian/Arabic/Latin digits, display Persian digits.
8. **Privacy:** no telemetry, no analytics SDKs, no third-party trackers. Data stays in IndexedDB; export/import is user-triggered.
9. **Psychology guardrails:** never label users with types (MBTI, learning styles), never diagnose. Safety pathway in `specs/11` is mandatory.
10. **Do not invent scope.** If something is unspecified, choose the simplest option consistent with specs, record it in `ASSUMPTIONS.md` at repo root, and continue. If it is listed in `19_OPEN_QUESTIONS.md`, implement the stated default behind a setting.
11. **Data migrations:** every schema change bumps `dataVersion` and ships a migration with a test.
12. **Quality bar:** TypeScript strict, ESLint, Vitest unit tests (≥90% for `engine/` and `domain/`), Playwright e2e for every acceptance scenario in `specs/17`, axe accessibility checks on main screens.

## v2 additions to hard rules
13. Practice entry must never require per-question time or reasons (spec 20).
14. Every reward, adaptation and insight must be explainable in the UI («چرا؟») and reversible by the user.
15. Adaptation decisions are logged with selection probability; never silently change an approved plan.
16. Assistant flows are data (JSON), validated in CI; no hardcoded conversation logic in components.

## v4 additions to hard rules
17. Every Book node maps to curriculum nodes (spec 30); analytics across books/users/streams only through catalog links.
18. Learner state is computed **only** in `src/brain/` (spec 34). Other modules subscribe; a lint rule enforces it.
19. History and imports always go through staging with preview and batch undo.
20. Exports are consent-gated, signed, pseudonymous (spec 35); the app never sends anything by itself.
21. Empty programs (grade 12 today) are a valid state everywhere.
22. Apply spec 38 fixes while porting v3 code; never copy v3 prototype logic as-is.

## Working protocol
- Work in milestone order (M0→M12). At the end of each milestone: run all tests, update `CHANGELOG.md`, list deviations in `ASSUMPTIONS.md`.
- Use names exactly as in `04_GLOSSARY.md` and `schemas/entities.schema.json`.
- UI strings live in `src/i18n/fa.json`; never hardcode Persian strings in components.
- Seed data: import `seed/*.ssb` as "ready books" on first run (user can delete).
- Commit messages: `[M#][SS-###] summary`.

## Definition of Done (per ticket)
Code + tests + types + i18n strings + empty/loading/error states + keyboard access + RTL check + docs comment on public functions + acceptance scenario passing (if any).
