# 27 — Security, Backup & Privacy (v3) — closes A-20..A-23 (extends spec 16)

## 1. Data classes
D1 public content (book TOCs) · D2 study data (attempts, exams) · D3 behavioral/profile (signals, traits, check-ins) · D4 sensitive (free-text notes, safety events). D3/D4 never leave the device unless user exports with explicit checkbox per class.

## 2. Local protection
- Optional **PIN/passphrase lock** (4–8 digits or passphrase). Key derivation: PBKDF2-SHA256, 310,000 iterations, 16-byte salt (WebCrypto). D3/D4 tables encrypted with AES-GCM 256 when lock enabled; key kept in memory only; auto-lock after 10 min idle.
- Forgotten PIN: D3/D4 unrecoverable by design (stated before enabling); D1/D2 remain.
- CSP: `default-src 'self'; connect-src 'self'` in R1; CI fails on any remote host.

## 3. Backup
- Format `.ssbackup` = zip { manifest.json (appVersion, dataVersion, createdAt, counts per table, sha256 per file), data/*.jsonl, images/* }.
- Optional encryption: AES-GCM with passphrase (PBKDF2 as above); manifest stays plaintext except counts when encrypted.
- **Restore = dry run first:** validate checksums, schema, dataVersion (run migrations up), show counts diff «۱۲۴۰ تست، ۳۲ آزمون…» → confirm → write in one Dexie transaction; on any error, rollback and Persian error (BAK-2).
- Merge mode (R1): "replace all" only. Merge with conflict resolution deferred to R3 sync.
- Reminders: weekly backup reminder if > 7 days since last export; after 500 new attempts.
- Storage: request `navigator.storage.persist()`; show quota usage; warn at 80%.

## 4. Deletion & rights
Per-class delete (profile only, check-ins only, everything); "delete everything" requires typing «حذف»; generates final backup offer. ML dataset export excludes D3/D4 unless opted in and is anonymized (no names, dates shifted by random per-export offset).

## 5. Minors & consent
First run asks age range. Under 18: profile questionnaires and safety text include «با یک بزرگ‌تر مورد اعتماد مشورت کن»; no data sharing features enabled in R1.

## 6. Forward compatibility
`dataVersion` monotone; migrations are pure `(dbVn) → dbVn+1` with fixture tests; backups from any older version must restore (test fixtures v1, v2).

## Acceptance
SEC-1 lock encrypts D3/D4 at rest (inspect IndexedDB shows ciphertext) · SEC-2 no network requests in full e2e run · BAK-1/2 (spec 17) · BAK-3 v1 backup restores into v3 · DEL-ALL-1 empty DB after delete-all.
