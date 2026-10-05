# 26 — Statistical Safety & Model Validation (v3) — closes A-15..A-19
Goal: no number in SS may look more certain than the data allows.

## 1. Minimum data per output
| Output | Min data | Below minimum |
|---|---|---|
| Topic mastery % | effectiveN ≥ 3 | «هنوز داده کافی نیست» + «۳ تست بزن» |
| Subject prediction | ≥ 30 attempts in blueprint topics of that subject | interval only, no median; badge «کم‌داده» |
| Total prediction | ≥ 2 subjects with prediction | not shown |
| Trend slope | ≥ 4 sessions over ≥ 10 days | null |
| Behavioral signal | minN of spec 21 | hidden |
| Insight | minN + probability ≥ 0.8 + BH-FDR | hidden |
| Organizer bias | ≥ 2 graded exams | 0 |
| Best time block | P(best > second) ≥ 0.8 | none |

## 2. Uncertainty display
- Every predicted percent is shown as **interval first** («۴۲ تا ۵۸»), median smaller. Intervals widen with fewer data (Dirichlet α' = p·(effectiveN + k)).
- Confidence word map: width ≤ 10 pp «دقیق»; ≤ 20 «متوسط»; > 20 «تقریبی».
- Provenance chip on every model number: DIRICHLET | BKT | FSRS | HEURISTIC | INSUFFICIENT_DATA.

## 3. Bias sources & corrections
| Bias | Correction |
|---|---|
| Selection: user practices easy topics more | weight by blueprint, not by attempts; untested topics get first-exposure prior |
| Practice ≠ exam conditions (time pressure, unseen questions) | organizer bias (EWMA, α=0.3) + per-section δ shrunk n/(n+2); timed-session share shown |
| Repeated questions (memory) | REP-2 weight 0.5 within 24 h |
| Self-report time | `estimated` weight 0.5 in medians; «تخمینی» badge |
| Overfitting adaptation | Thompson sampling with clipping & discount; evaluation only on future outcomes |
| Multiple comparisons in insights | BH-FDR 0.10 |
| Survivorship (only good sessions logged) | anti-gaming flags + reminder «جلسه‌های بد هم ثبت شوند؛ دقیق‌تر پیش‌بینی می‌کنم» |

## 4. Model validation (runs locally, weekly)
- **Backtest:** for each graded exam, recompute prediction using only data before exam date (no leakage); store MAE, coverage of P10–P90 interval (target 70–90%), and bias.
- **Recalibration:** if interval coverage < 65% over ≥ 4 exams, widen Dirichlet by factor `f = 1.25` per step (max 2); if > 95%, narrow `f = 0.9` (min 0.7).
- **Mastery calibration:** reliability of pC vs next-attempt correctness (10 bins), ECE shown in settings «دقت مدل».
- **Model switch rule:** a new model (R2) replaces baseline only when it wins log-loss on temporal split and ECE not worse (spec 13).

## 5. Monte-Carlo numerical rules
5000 runs default (2000 on low-end devices: `navigator.hardwareConcurrency ≤ 4`), seeded mulberry32; P10/P50/P90 by sorted-quantile type 7; Monte-Carlo SE of mean reported in debug; results cached by hash(inputs).

## Acceptance
STAT-1 below-min shows no number · STAT-2 interval width decreases monotonically with effectiveN (property) · STAT-3 backtest uses only pre-exam data · STAT-4 recalibration factor bounded [0.7, 2].
