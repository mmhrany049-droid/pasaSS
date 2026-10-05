# 34 — The Learner Brain (BRN): one connected, adaptive model — v4, new

Owner goal: «یک برنامهٔ کامل با شبکهٔ عصبی پیچیده که همهٔ بخش‌های آن با هم مرتبط باشند و با تغییرات کوچک هم طرز فکر سیستم تغییر کند؛ تطبیق‌پذیر.»
Engineering position (keeps v0.3 finding): a deep network trained on one student's data learns noise. v4 therefore builds **one shared brain with two halves**: a personal Bayesian state that updates instantly on every event, and population neural models trained on everyone's data (spec 35) and shipped back as a file. All modules read from and write to the same brain; none keeps private logic about the learner.

## 1. Architecture
```
 events (append-only log)  ──►  Brain Core (worker)  ──►  Learner State Graph (LSG)
  attempt.saved, key.changed,      ├─ Personal models (instant, Bayesian)      nodes: curriculum nodes, skills, items, sessions-context
  taught.changed, review.rated,    ├─ Population models (ONNX, from pack)      node state: pL, pC/pW/pB, stability S, R(t), transfer,
  checkin, plan.done, exam.result  ├─ Fusion (precision-weighted)              uncertainty, velocity, lastSeen, provenance
  history.imported, override       └─ Propagation over graph edges             edges: prerequisite, identical/equivalent/partial, alias
                                                   │
         consumers (read-only, subscribe to diffs) ▼
   Analytics · Review queue · Exam predictor · Planner · Rewards/quests · Assistant · Adaptation · Insights
```
- **Single source**: every consumer reads LSG snapshots; no module recomputes mastery itself (fixes the v3 "three formulas" problem).
- **Event-sourced**: state = fold(events). Replaying the log reproduces state bit-for-bit (seeded RNG) → deterministic tests, undo, migrations by replay.
- **Diff bus**: after each event the core publishes `StateDiff{nodeIds, fields, before, after, cause}`; consumers invalidate only what changed.

## 2. How a small change changes the system's "thinking" (bounded and explainable)
1. Local update: the event updates the touched items/skills (BKT + FSRS + Dirichlet, specs 07/13).
2. **Propagation**: the change spreads along LSG edges with damping: `Δ_neighbor = Δ × w_edge × γ^hops` (γ = 0.5 per hop, so hop 1 → ×0.5, hop 2 → ×0.25; max 2 hops; |Δ| < 0.01 stops; vectors in `tests/test_vectors_v4.json`). Edge weights: prerequisite 0.3 (forward: weak prerequisite lowers readiness of dependents), identical 1.0, equivalent 0.8×overlap, partial overlap×0.5, alias 1.0.
3. **Re-planning cascade**: diffs above thresholds trigger consumers: predictor (|ΔP50| ≥ 1 pp), planner proposal (priority rank changes in top 10), quests (next morning), insights (weekly). Approved plans are never silently changed (hard rule 15): the planner creates a **proposal** with «چرا؟».
4. **Sensitivity guard**: every consumer has a hysteresis band so one lucky answer does not flip a plan (e.g., a topic leaves the weak list only if pC exceeds threshold + 0.05 with confidence ≥ 0.5).
5. **Explain**: each derived number stores `provenance` (models used, top 3 events that moved it). «چرا؟» shows them in Persian.

## 3. Model ladder (supersedes spec 13 table)
| stage | data needed | models | where |
|---|---|---|---|
| P0 | none | priors from catalog + population pack (item difficulty, topic base rates) | device |
| P1 | any personal data | Dirichlet mastery, BKT per skill, FSRS-6 (ts-fsrs) with personal parameter fitting after 400 reviews, Elo-style ability per subject | device |
| G1 | pooled ≥ 30 students or ≥ 50k attempts | Rasch/2PL IRT item calibration; PFA logistic; hierarchical Bayesian topic difficulty by stream | aggregator PC (spec 35) |
| G2 | pooled ≥ 200 students | **neural knowledge tracing**: AKT/simpleKT/DKT family (pyKT), input = item emb + skill emb + response + Δt + context (mixed/exam-like) + catalog-node emb; plus GNN (GraphSAGE 2-layer) over the curriculum/prerequisite graph to embed nodes; distilled to a small GRU/Transformer, ONNX int8 < 3 MB | trained on aggregator, inference on device (onnxruntime-web, worker) |
| G3 | months of pooled behavior | neural forecaster for exam percent (per organizer) with conformal calibration; neural planner-acceptance model; dropout/burnout early-warning (shown only as gentle suggestions) | same |
- **Fusion**: final estimate per node = precision-weighted blend of personal Bayesian and population neural predictions: `p = (τ_pers·p_pers + τ_pop·p_pop)/(τ_pers+τ_pop)` where τ_pers grows with effective personal N and τ_pop is the model's validated precision for similar students. Early on the neural model dominates; with personal data the student's own evidence takes over.
- **Ship gate** (unchanged, spec 13): a population model ships only if it beats the Bayesian baseline on held-out *students* (learner-disjoint split) in log-loss and ECE. Otherwise the pack contains only G1 statistics.
- **Personal fine-tuning on device**: allowed only for the last layer / calibration (temperature + per-subject bias), never full training.

## 4. What the brain controls (connections)
| consumer | reads | example of small-change effect |
|---|---|---|
| Review queue | R(t), item priority | one wrong answer on a fading prerequisite pulls 2 dependent items forward |
| Exam predictor | pC/pW/pB at exam date, transfer, organizer bias | marking «خودم خواندم» on a topic switches it from untaught prior to tested model |
| Planner | priorities, velocity, availability model | a low-energy check-in shrinks today's load proposal (≤ cap) |
| Quests | weakest confident node, due reviews | a solved weak topic is replaced next morning |
| Assistant | everything, read-only | «چرا فصل ۳ را پیشنهاد دادی؟» answers from provenance |
| Adaptation (spec 22) | outcomes of its own choices | bandit posterior updates after each logged decision |
| Insights (spec 23) | diffs over windows | «سرعت یادگیری مغناطیس دو برابر شد» |
| Population comparison | cross-stream links | «در قانون لنز از ۷۰٪ هم‌پایه‌ها جلوتری (ریاضی و تجربی)» (opt-in) |

## 5. Data contract for learning (log now, use later)
Each Attempt records: qid, curriculumRefs (weights), context (blocked|mixed|exam-like), chosen, result, isGuess, confidence?, secPerQ estimate + source, position in session, hourOfDay, daysSinceLastSeen, prior state snapshot hash, model versions. This is what spec 35 exports (anonymized).

## Acceptance
BRN-T1 replay of 20k-event fixture gives identical LSG hash · BRN-T2 propagation stops within 2 hops and |Δ| bound · BRN-T3 no consumer computes mastery outside the core (lint rule: imports from `brain/` only) · BRN-T4 fusion weight moves from population to personal as N grows (property test) · BRN-T5 neural model missing/invalid → system works on P1 with provenance `BAYES_ONLY`.
