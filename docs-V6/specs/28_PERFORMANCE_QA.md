# 28 — Performance, Device & QA Matrix (v3) — closes A-24..A-26

## Budgets (mid-range Android, Chrome, 4 GB RAM)
| Metric | Budget |
|---|---|
| First load (cached PWA) | ≤ 1.5 s to interactive |
| Bundle (gz) | ≤ 450 KB initial; charts lazy |
| BubbleSheet 300 rows | 60 fps scroll, input latency ≤ 50 ms |
| Save session 100 Q | ≤ 150 ms |
| Analytics recompute 20k attempts | ≤ 800 ms in worker, UI never blocked |
| Prediction 5000 runs, 40 topics | ≤ 400 ms |
| Assistant search | ≤ 50 ms |
| Memory | ≤ 250 MB with 3D chart open |

## Fixtures
`fixtures/20k.json` (3 books, 20,000 attempts, 40 exams, 1 year), `fixtures/empty.json`, `fixtures/legacy_only.json`, `fixtures/keyless.json`. Generated deterministically from seed.

## Device / browser matrix
Chrome Android (latest, −2), Samsung Internet, Firefox Android, Chrome/Edge desktop, Safari iOS 17+ (PWA install, storage persistence warning). Screens 360×640 → 1920×1080.

## Persian/RTL QA checklist
Persian keyboard digits in every numeric field · ZWNJ in titles preserved · mixed LTR formulas (ΔH, y=|f(x)|) wrapped in `<bdi>` · Jalali dates in every list · arrows mirrored · charts axes RTL-aware · copy reviewed for «هنوز» tone.

## Accessibility
axe 0 serious; full keyboard flow for practice wizard, review, assistant buttons; focus visible; target size ≥ 24 px; reduced motion honored; screen-reader labels in fa.

## Release gate
All acceptance scenarios (spec 17 + 20–27) green · budgets met on fixture 20k · no network calls · backup round-trip identical hash · Lighthouse PWA pass.
