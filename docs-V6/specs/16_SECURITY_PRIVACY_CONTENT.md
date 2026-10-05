# 16 — Security, Privacy, Content Rights, Backup

## Data classes
| Class | Examples | R1 storage | Export |
|---|---|---|---|
| D1 public | help docs | bundle | — |
| D2 content | books, keys, seeds | IndexedDB | yes |
| D3 personal learning | attempts, reviews, plans, rewards | IndexedDB | yes (encrypted optional) |
| D4 sensitive | check-ins, questionnaires, assistant logs, safety flags | IndexedDB, separate tables | opt-in only, excluded by default |

## Controls (R1)
No network requests at runtime except same-origin static files (enforce CSP `default-src 'self'; connect-src 'self'`) · CI script `tools/ci/no-remote-ai-check.mjs` greps deps and source for AI SDKs/endpoints and fails build · optional app PIN lock (WebCrypto PBKDF2 → AES-GCM for D4 tables) · `navigator.storage.persist()` request on first run + warning if denied (iOS 7-day eviction) · weekly backup reminder.

## Backup format `ss-backup-v1.zip`
`manifest.json {app, dataVersion, createdAt, tables[], counts, sha256 per file}` + `tables/*.jsonl` + `images/*.webp`; optional password → AES-GCM. Restore: validate manifest, run migrations, dry-run counts preview, then apply (replace or merge-by-id).

## Content rights
Book field `license`: personal-analysis (TOC/ranges/keys entered by user for own use; not redistributable), licensed, original. R4 content studio may only publish `licensed|original`. Store question text only if user enters it; never scrape publisher content.

## Children & consent (R3+)
Consent records, guardian visibility limits, retention schedule, deletion requests, safety officer role, audit log (no content).
