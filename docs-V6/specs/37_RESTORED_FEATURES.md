# 37 — Features from v0.1–v0.3 that were lost or weakened, restored in v4

| # | Feature (origin) | v1–v3 state | v4 decision / where |
|---|---|---|---|
| R-01 | Retake exam «دوباره آزمون بده» with blank sheet + compare to previous (v0.1) | entity only | ExamSitting `isRepeat`, weight 0.4 in prediction, separate series in charts, compare view (spec 33 §4) |
| R-02 | Exam photo gallery (v0.1), WebP compression (v0.2) | schema only | separate `images` store, ≤ 1600 px WebP q0.8, excluded from .ssx, included in .ssbak |
| R-03 | Similar exams (weighted Jaccard, v0.1) | engine fn, unused | exam page section «آزمون‌های مشابه» (≥ 0.3), also uses population exam templates |
| R-04 | Two taught states «تدریس شد / خودم خواندم» (v0.2) | prototype collapsed to one tick | spec 31 TB-14; tri-state tree checkbox with date + timeline (v0.1 MTS) |
| R-05 | Numbering root per node {شماره‌جدا} (v0.2) | absent in prototype | spec 31 TB-2 |
| R-06 | Difficulty levels «نوع چهارم» + @سختی (v0.1) | spec only | spec 31 TB-11, chart «درصد بر حسب سطح سختی» |
| R-07 | Disputed key (v0.2) | 1 mention | spec 31 TB-10 |
| R-08 | Organizer bias correction (v0.2 #8) | absent | predictor `bias_org` learned per organizer from own L1/L3 results, then population (spec 34 G3) |
| R-09 | Descriptive final exam (تشریحی، از ۲۰) (v0.2) | data model slot | `ExamTemplate.kind='descriptive'`, score/20, never mixed into percent (spec 25 §5), shown in its own card |
| R-10 | Taraz entry (v0.2) | absent | L3 card field; chart beside percent |
| R-11 | Last-attempt vs all-attempts views (v0.1) | absent | toggle on every analytics chart |
| R-12 | Countdown to next exam (day/hour/min) (v0.1) | absent in prototype | dashboard hero card |
| R-13 | Heatmap topic×week, 3D surface with 2D twin (v0.1/v0.2) | absent | analytics tab «نقشه»; 3D optional, 2D default (a11y) |
| R-14 | Prediction vs actual scatter / calibration (v0.1) | spec only | after each graded exam, auto-compare + MAE card; feeds spec 26 backtest |
| R-15 | Planner full: sleep, school, commute, hard/soft constraints, 3 drafts, failure handling (v0.2) | not in prototype | spec 10 + v0.2 rules restored verbatim: no plan overlaps sleep/school; 3 drafts (max important, max free time, min change); `optimal` label only if solver proved it; after 2 moves suggest shrink/redefine |
| R-16 | Daily check-in, weekly reflection, procrastination helper, exam wrapper (v1–v2) | spec only | screens in R1 (spec 09 v4 nav) |
| R-17 | storage.persist() + weekly backup reminder (v0.2, iOS Safari 7-day eviction) | spec only | first-run request + reminder; status shown in settings |
| R-18 | Persian/Arabic/Latin digits everywhere (v0.2) | done | keep |
| R-19 | Interleaved prep list (mix topics, not blocks) (v0.2 research) | absent | prep list ordering rule: no 2 consecutive items from the same chapter when alternatives exist |
| R-20 | Review card shows only number first («اول حل کن») (v0.2) | absent | review card reveal flow, `retrievalBeforeReveal` reward |

## Navigation v4 (fixes v3 prototype that dropped 4 sections)
داشبورد · ثبت تست · مرور · آزمون‌ها · برنامه · تحلیل · کتاب‌ها · بیشتر (ورود سابقه، مباحث خوانده‌شده، پاداش، دستیار، نیمرخ من، شبکه و اشتراک، تنظیمات و پشتیبان). Floating assistant everywhere.
