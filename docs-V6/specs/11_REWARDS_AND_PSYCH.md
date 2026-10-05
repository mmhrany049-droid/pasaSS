# 11 — Rewards v2 (RWD) and Self-Regulation (PSY)
v2 replaces the v1 points table. Personality/behavior profile moved to spec 21; adaptation to spec 22.

## Design principles (evidence → rule)
| Evidence | Rule in SS |
|---|---|
| Gamification helps on average but effects are heterogeneous; levels/progress and performance feedback carry most of the effect, points/badges alone little (Sailer & Homner 2020; Xu et al. 2024 multilevel meta-analysis; Frontiers in Psychology 2023 meta-analysis, g=0.82 with strong moderators). | Every reward is tied to a learning behavior or a measured learning gain, never to raw volume. |
| Tangible, expected, performance-contingent rewards can undermine intrinsic motivation; informational feedback does not (Deci, Koestner & Ryan 1999). Gamification raises autonomy/relatedness more than competence (ETR&D 2024 meta-analysis, g=0.26 on intrinsic motivation). | Rewards are framed as information («چون ۱۰ کارت را سر وقت مرور کردی»), user chooses own real-life rewards (autonomy), mastery badges show competence. |
| Retrieval practice (Yang et al. 2021, g≈0.50), spacing (Cepeda et al. 2008), interleaving (Brunmair & Richter 2019), error analysis/feedback (Hattie & Timperley 2007). | These behaviors earn the most XP. |
| Goal difficulty: specific, moderately hard goals outperform "do your best" (Locke & Latham 2002). | Quests are specific and auto-tuned to ~75% expected completion. |
| Temptation bundling increases target behavior (Milkman, Minson & Volpp 2014). | Optional "bundle" rule: a pleasure allowed only during a chosen activity type. |
| Streak loss aversion causes anxiety and gaming. | Flexible consistency, auto-freezes, no loss messages. |

## 1. Currencies
- **XP** (امتیاز تجربه): non-spendable, drives **levels**. `threshold(L) = round(120 × L^1.45)` cumulative XP for level L (L≥1). Level titles from `fa.json` (cosmetic only).
- **Coins** (سکه): spendable in the **personal reward shop**. Earned only from completed plan minutes, quests and mastery events (table §2). Default rate: 1 coin per completed planned study minute.
- Both stored as append-only `RewardEvent` (raw truth); balances are derived.

## 2. Earning table (defaults, editable in settings; all capped per day)
| kind | trigger | XP | Coins | Daily cap (XP) |
|---|---|---|---|---|
| sessionLogged | practice session saved with ≥5 corrected questions | 3 | 0 | 15 |
| plannedStartOnTime | planned activity started within 15 min of slot | 5 | 5 | 30 |
| plannedMinutesDone | per completed planned minute | 0 | 1 | — (coins cap 360) |
| planFollowed | ≥70% of day's planned minutes done | 15 | 20 | 15 |
| errorAnalyzed | reason chosen for a W/B | 1 | 0.5 (balance stored as decimal, shown floored) | 40 |
| errorTaskClosed | deferred ErrorAnalysisTask completed | 5 | 5 | 20 |
| retrievalBeforeReveal | review card answered before reveal | 1 | 0 | 40 |
| reviewOnTime | due ReviewItem reviewed on due day ±0 | 2 | 1 | 40 |
| reviewRecovered | an `again` item later rated good/easy | 3 | 1 | 30 |
| mixedPractice | session that interleaves ≥3 topics or a mixed/checkup node | 8 | 5 | 16 |
| transferImproved | mixed/checkup percent ↑ ≥5 pp vs previous same-chapter | 20 | 15 | 20 |
| masteryUp | topic badge tier up (§4) | 25 | 20 | — |
| masteryKept | maintenance quest completed (badge saved from decay) | 10 | 10 | 30 |
| calibrationImproved | ACE ↓ ≥0.05 over 14 days | 20 | 15 | — |
| examWrapper | post-exam reflection completed (spec 24 §7) | 20 | 15 | — |
| weeklyReflection | Friday review completed | 15 | 15 | 15/week |
| returnAfterBreak | first session after ≥3 inactive days | 15 | 10 | 15 |
| checkin | daily check-in | 1 | 0 | 1 |
| questDaily / questWeekly | quest completed | see §3 | see §3 | — |
**Never rewarded:** raw question count, speed, percent itself, time-on-app.

## 3. Quests (ماموریت‌ها)
- **Daily**: 3 quests generated each morning (deterministic, seed = localDate) from: today's approved plan, top prep-list items (spec 24), due reviews, open ErrorAnalysisTasks, weakest confident topic. Template examples: «۱۵ تست از {topic} (تسلط {m}٪)», «۱۰ کارت مرور سررسید», «تحلیل خطاهای جلسه دیروز», «یک جلسه مخلوط ۳ مبحثی».
- **Weekly boss**: one timed mixed session or mock exam shaped like the next real exam blueprint (spec 24). Reward XP 60, coins 50.
- **Difficulty tuning**: quest volume `v = base × d`, where `d ∈ {0.7, 1.0, 1.3}` chosen by the adaptation engine (spec 22) to keep expected completion ≈ 0.75. Reward scales with d: XP = 10·d·(minutes/15), coins = XP.
- Quests can be swapped once per day («این یکی رو عوض کن») with no penalty.

## 4. Mastery badges per topic & chapter (competence made visible)
Tier rules use BKT pL (spec 13) and FSRS retrievability of the topic's items:
| Tier | Condition |
|---|---|
| برنز | pL ≥ 0.60 and ≥ 10 effective attempts |
| نقره | pL ≥ 0.80 and median stability ≥ 7 d |
| طلا | pL ≥ 0.92 and median stability ≥ 30 d and ≥1 correct in a mixed/checkup context |
Badges **decay visibly** when predicted retrievability at today < 0.80 («نیاز به نگهداری»), which spawns a maintenance quest; tier is not removed until R < 0.65. Chapter badge = min tier of its topics weighted by question count ≥ 80%.

## 5. Personal reward shop (فروشگاه پاداش شخصی)
- User defines items: title, emoji, price, optional cooldown, optional daily limit. Examples seeded (editable): «۳۰ دقیقه بازی» 90 · «یک قسمت سریال» 120 · «بیرون رفتن با دوستان» 400 · «خرید کوچک» 600.
- Suggested price = reward minutes × `studyToLeisureRatio` (default 3).
- Redeem writes `CoinTransaction(kind=spend)`; balance can't go negative. History visible.
- **Bundle rule** (optional): «فقط موقع مرور، پادکست» → shown as a reminder when that activity starts.
- **Precommitment contract** (optional): user writes «اگر تا جمعه X را تمام کنم، Y». Tracked; no punishment if missed, only a reflection prompt.

## 6. Consistency, records, reports
- Consistency = active days in last 14 (not consecutive) + flexible chain with 2 automatic freezes per week. No "you lost your streak" copy.
- Personal records: best percent per node, best checkup per chapter, best weekly plan adherence, fastest return after a break. Comparisons only with own past.
- **Weekly report card** (Friday): XP/coins, quests, badges gained/kept, what improved and which behavior drove it (e.g., «درصد مخلوط فصل ۲ شیمی +۸ بعد از ۳ جلسه مرور سر وقت»), one suggestion.

## 7. Anti-gaming & integrity
Exclude from rewards (and flag, but still store) sessions where: secPerQ < 8 s with N ≥ 10; all answers identical; >90% blank; key entered after answers on the same questions within 2 minutes and P=100. Daily caps as table. Review ratings only count when card was shown ≥2 s.

## 8. Fading & control
- Settings: rewards on/off · coins on/off (XP only) · "minimal" mode (badges + weekly report only).
- **Thinning**: if consistency ≥ 10/14 for 4 consecutive weeks, suggest (never force) lowering coin rate 20% («عادتت محکم شده؛ می‌خواهی پاداش‌ها کم‌تکرارتر شوند؟»).
- Reward framing variant (effort-focused / progress-focused / mastery-focused text) chosen by adaptation engine (spec 22), user can fix it.

## Self-regulation cycle (kept from v1)
Forethought (goal, plan, if-then) → Performance (optional focus timer, single task) → Reflection (after session, 3 quick prompts, skippable). Zimmerman 2002; Panadero 2017.

## Daily check-in (30 s, optional)
sleep hours, sleep quality 1–5, energy 1–5, stress 1–5, mood 1–5, preferred session length. Feeds planner and adaptation engine (spec 22).

## Procrastination helper (kept, extended)
Triggered when a planned activity is skipped twice or start latency > 30 min. Functional questions (task unclear / too big / boring / anxious / no time / tired) → actions: 2-minute first step, split, clarify volume, move slot, shorten, bundle. Never moralize. Outcome logged for spec 22.

## Questionnaires
See spec 21 (profile). Forbidden everywhere: MBTI, learning styles, IQ claims, clinical diagnosis scales.

## Safety pathway (mandatory, unchanged)
Triggers: stress = 5 on 3 consecutive check-ins, or free text matching `psy/safetyLexicon.fa.json`. Pause study prompts, calm screen with configured numbers («۱۱۵ / ۱۱۰ / صدای مشاور بهزیستی ۱۴۸۰ / اورژانس اجتماعی ۱۲۳», OPEN-07), suggest a trusted adult. Never diagnose, never share, free text stays on device.

## Acceptance (replaces RWD-1/2)
- RWD-1 No XP/coins for raw volume; caps enforced; anti-gaming session gives 0.
- RWD-2 Rewards/coins can be turned off and disappear from UI.
- RWD-3 Redeeming a shop item with insufficient coins is blocked with Persian message.
- RWD-4 Badge shows «نیاز به نگهداری» when R<0.80 and a maintenance quest appears.
- RWD-5 Daily quests are identical for the same inputs and localDate (deterministic).
