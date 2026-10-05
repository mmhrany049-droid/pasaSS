# 39 — Open-source building blocks (GitHub) — verify license + latest version at build time
| Module | Project | Use | Note |
|---|---|---|---|
| Storage | Dexie.js | IndexedDB + migrations | ADR-002 |
| Memory model | ts-fsrs, fsrs-optimizer / fsrs-rs | review scheduling, personal parameter fit | F-03 |
| Knowledge tracing (training) | pyKT (pykt-toolkit) | DKT/AKT/simpleKT training + evaluation protocol | aggregator only |
| IRT | py-irt or girth (Python) | Rasch/2PL calibration | aggregator |
| GNN | PyTorch Geometric | GraphSAGE node embeddings over curriculum graph | aggregator |
| Inference | onnxruntime-web | run models in a Web Worker (WASM) | < 3 MB models |
| Calibration | MAPIE (conformal) | prediction intervals | aggregator, params shipped |
| Planner solver | HiGHS (highs-js) or javascript-lp-solver | constraint placement in browser | spec 10 |
| Jalali dates | jalaali-js / date-fns-jalali | display + week start Saturday | |
| Search | MiniSearch | assistant + help search | |
| Charts | Apache ECharts (incl. echarts-gl for optional 3D) | analytics | 2D default |
| UI | React + TypeScript + Vite + vite-plugin-pwa (Workbox) | app shell | |
| Crypto | libsodium-wrappers (Ed25519, Argon2id) / WebCrypto AES-GCM | bundle signing, backup encryption | spec 35/36 |
| Bot (later) | python-telegram-bot or aiogram | mailbox bot on owner PC, polling | details deferred |
| Validation | Ajv (JSON Schema) | catalog, flows, bundles in CI | |
| Testing | Vitest, Playwright, axe-core, fast-check | unit/e2e/a11y/property | |
Rule: GPL/AGPL dependencies need owner approval (distribution implications); prefer MIT/Apache/BSD.
