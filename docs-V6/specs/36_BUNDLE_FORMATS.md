# 36 — File formats: .ssx (export bundle), .ssp (population pack), .ssbak (full backup) — v4

All three are ZIP containers with `manifest.json` + JSONL/Parquet-free plain files (simple to parse in Python and TS). UTF-8, LF.

## .ssx — member export bundle
```
manifest.json   { format:"ssx", formatVersion:1, appVersion, dataVersion, catalogVersion,
                  memberId, publicKey, createdAt, sinceCursor, untilCursor, revoke:false,
                  consent:{version, guardianConfirmed, dataClasses[]}, cohortTags{}, counts{} }
attempts.jsonl  { recordId, qid, bookEditionId, curriculumRefs[[node,w]], context, chosen, result,
                  isGuess, confidence?, spqBucket, posInSession, hourBucket, dayIndex, isLegacy, dateApprox? }
reviews.jsonl   { recordId, qid, rating, elapsedDays, dayIndex }
sessions.jsonl  { recordId, kind, durationBucket, nQuestions, context, dayIndex }
history.jsonl   { recordId, level:L2|L3, scope, counts|percent, dateApprox }
books/*.ssb     shared test-book definitions (only if user ticked «اشتراک کتاب»)
exams/*.sse     exam templates with keys (no personal answers unless attempts)
tombstones.jsonl { recordId, deletedAt }
signature.sig   Ed25519 over sha256 of all other files (sorted)
```
`dayIndex` = days since member's first event (no calendar dates) unless the member opts in to share real dates (needed for organizer calibration; default on for exam attempts only, rounded to week).

## .ssp — population pack
```
manifest.json  { format:"ssp", packVersion, catalogVersion, createdAt, members, gatesPassed[], signerKey }
catalog_patch.json   (optional)        items.jsonl  { qid|aliasGroup, a, b, c, n }
topics.jsonl  { nodeId, stream, grade, baseRates, n }      links_update.json
keys_suggestions.jsonl  aliases.jsonl  cohort_percentiles.jsonl (k≥10)
models/*.onnx + models/model_card.json (metrics, data window, ship-gate results)
books/*.ssb  exams/*.sse (admin-approved)          signature.sig
```
## .ssbak — personal full backup (spec 27)
Complete local DB dump incl. notes/photos, optionally encrypted (passphrase → Argon2id → AES-GCM). Never sent anywhere automatically; dry-run restore preview first.

Schemas: `schemas/bundle_v4.schema.json`. Each format change bumps `formatVersion` and ships a reader for N−1.
