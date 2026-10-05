# 13 — Local Intelligence (INT)
> v4: the model ladder and neural plan are superseded by spec 34 (Learner Brain). BKT/skill-graph/metrics sections below remain valid.

## Model ladder (gated by effective data)
| Evidence | Model | Release |
|---|---|---|
| any | topic Dirichlet mastery (spec 07 §4) | R1 |
| any | BKT per skill (+ forgetting) | R1 |
| any | FSRS memory model | R1 |
| ≥ 500 attempts total | PFA logistic baseline | R2 |
| population data (opt-in) | Rasch/2PL IRT item calibration | R2 |
| ≥ 200 events on device + passes gate | GRU next-response model (ONNX) | R2 |
| population, offline | graph-conditioned GRU / GNN (GraphSAGE 2-layer), distilled to GRU | R2+ |
| multi-site | federated training with secure aggregation + DP | R4 |

## BKT (R1) — `engine/bkt.ts`
Params per skill (defaults): pInit 0.2, pT 0.15, pG 0.25 (4-choice), pS 0.1, pF (forget/day) 0.01.
Update on correct: `pL|C = pL(1−pS) / (pL(1−pS) + (1−pL)pG)`; on wrong: `pL|W = pL·pS / (pL·pS + (1−pL)(1−pG))`; then `pL' = pL|obs + (1 − pL|obs)·pT`. Forgetting before update: `pL = pL·(1−pF)^daysSinceLast`. Blank = wrong with pG=0. Correct guess: apply 0.5-weighted update (interpolate posterior). Multi-skill question: update each skill with likelihood split (do not duplicate full evidence).
Skills: R1 default = one skill per topic leaf; user may add skills and edges (prerequisite/similar) in book editor.

## Skill graph
Prerequisite subgraph must be a DAG (reject cycles). Features: `prereqReadiness = min(pL of prerequisites)`. Recommendation filter: don't recommend skill with prereqReadiness < 0.4 unless diagnostic.

## Recommender R1
`utility = (expectedGain + retentionUrgency + curriculumPriority)/estMin − frustrationRisk`, expectedGain = pL'(if correct-weighted) − pL; frustrationRisk = 0.3 if predicted P(correct) < 0.3.

## Data logging for R2 (implement in R1)
Each attempt stores: skillIds, timeSec, isGuess, confidence, hint usage (0 in R1), prior pL snapshot, model version. Export "ML dataset" (anonymized JSONL) from settings.

## R2 neural spec
GRU: input = [skill emb 32, question emb 32, result one-hot 4, log(1+Δt), timeBucket emb 8, pL, uncertainty]; 1–2 layers hidden 64; window 128; heads: P(correct next), P(recall at 1/7/30 d). Loss BCE + Brier; temperature calibration. Train PyTorch offline (repo `ml/`), export ONNX opset 17, int8 quantize, run onnxruntime-web WASM in worker. Size < 2 MB.
**Ship gate:** temporal split + learner-disjoint split; must beat BKT/PFA on log-loss AND not worsen ECE; question-level masking for multi-skill items (pyKT protocol). Otherwise fall back. Every prediction carries provenance: `BKT | DIRICHLET | PFA | IRT | NEURAL | HEURISTIC | INSUFFICIENT_DATA`.
No deep RL scheduling until randomized policy data exists.

## Evaluation metrics
log-loss, Brier, AUC, ECE/reliability diagram, P50 MAE for exams, delayed retention (1/7/30 d), review burden (reviews per retained item).
