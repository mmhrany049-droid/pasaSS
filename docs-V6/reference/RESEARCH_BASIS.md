# Research Basis (v2) — evidence behind SS rules
Selection rule: meta-analyses and large benchmarks first, then RCTs, then well-cited theory. Each row names where SS uses it. Effect sizes are as reported by the source.

## Learning & memory
| Source | Finding | Used in |
|---|---|---|
| Yang, Luo, Vadillo, Yu & Shanks (2021), *Psychological Bulletin* 147(4) — 222 studies, 48,478 students | Classroom quizzing raises achievement, g ≈ 0.50; stronger with feedback and repetitions | XP weights (spec 11), coach KB |
| Agarwal, Nunes & Blunt (2021), *Educational Psychology Review* | Retrieval practice benefits in real classrooms (57% medium/large effects) | review flow |
| Adesope, Trevisan & Sundararajan (2017), *Review of Educational Research* | Practice tests beat restudy across conditions | rationale for test-centric design |
| Rowland (2014), *Psychological Bulletin* | Testing vs restudy meta-analysis; feedback amplifies | error analysis |
| Cepeda, Vul, Rohrer, Wixted & Pashler (2008), *Psychological Science* | Optimal spacing gap scales with retention interval | long-term planner, prep compression |
| Brunmair & Richter (2019), *Psychological Bulletin* | Interleaving helps (g ≈ 0.42), esp. similar categories (math/science) | mixedPractice reward, transferGap insight |
| Dunlosky, Rawson, Marsh, Nathan & Willingham (2013), *Psych. Science in the Public Interest* | Practice testing & distributed practice = high utility; rereading/highlighting low | coach KB, strategy questionnaire |
| Ye, Su & Cao (2022), *KDD*; Su, Ye, Nie, Cao & Chen (2023), *IEEE TKDE* 35(10) | Memory model (DSR) behind FSRS; SSP-MMC scheduling optimization | MRS (ts-fsrs), retention to exam date (spec 24) |
| Hattie & Timperley (2007), *Review of Educational Research* | Feedback on task/process most effective | session summary, informational reward framing |

## Knowledge tracing & prediction
| Source | Finding | Used in |
|---|---|---|
| Corbett & Anderson (1995), *UMUAI* | Bayesian Knowledge Tracing | BKT (spec 13), badges |
| Piech et al. (2015), *NeurIPS* | Deep Knowledge Tracing | R2 ladder |
| Liu et al. (2022), pyKT, *NeurIPS Datasets & Benchmarks* | Many DLKT gains vanish under correct evaluation; leakage risk | R2 ship gate |
| Liu et al. (2023), simpleKT, *ICLR* | Rasch-style question variation + attention: strong simple baseline | R2 baseline to beat |
| Abdelrahman, Wang & Nunes (2023), *ACM Computing Surveys*; Shen et al. (2024), *IEEE TLT* survey | KT model families and evaluation | spec 13 |
| Benjamini & Hochberg (1995), *JRSS-B* | FDR control | insight guards (spec 23) |
| Russo, Van Roy, Kazerouni, Osband & Wen (2018), *Found. & Trends in ML* | Thompson sampling tutorial | adaptation (spec 22) |

## Motivation, rewards, gamification
| Source | Finding | Used in |
|---|---|---|
| Sailer & Homner (2020), *Educational Psychology Review* | Gamification: small–medium positive effects on cognitive, motivational, behavioral outcomes; design matters | spec 11 |
| Xu, Xu & Xing (2024), *Studies in Higher Education*, multilevel meta-analysis (32 studies) | g ≈ 0.52 overall; combos of performance/measurement + personal elements work best | XP/levels + personal shop |
| Frontiers in Psychology (2023) meta-analysis, 41 studies | g ≈ 0.82 with strong moderators (design, duration) | caution: heterogeneity |
| ETR&D (2024) meta-analysis, 35 interventions | Intrinsic motivation g ≈ 0.26; autonomy and relatedness gains, weak competence | autonomy (own rewards), visible mastery |
| Deci, Koestner & Ryan (1999), *Psychological Bulletin* | Expected tangible rewards can undermine intrinsic motivation; informational feedback doesn't | framing, fading (spec 11 §8) |
| Ryan & Deci (2000), *American Psychologist* | Self-determination theory | motivation.sdt items |
| Locke & Latham (2002), *American Psychologist* | Specific, challenging goals | quests |
| Milkman, Minson & Volpp (2014), *Management Science* | Temptation bundling increases target behavior | bundle rule |
| Gollwitzer & Sheeran (2006), *Adv. Experimental Social Psychology* | Implementation intentions d ≈ 0.65 | if-then prompts, startNudge arm |
| Steel (2007), *Psychological Bulletin* | Procrastination: task aversiveness, delay, impulsiveness | procrastination helper |
| Buehler, Griffin & Ross (1994), *JPSP* | Planning fallacy | planning ratios |
| Zimmerman (2002), *Theory Into Practice*; Panadero (2017), *Frontiers in Psychology* | Self-regulated learning cycles | PSY cycle |
| Lovett (2013), in *Using Reflection and Metacognition…* | Exam wrappers | post-exam reflection |

## Personality, profile, adaptation
| Source | Finding | Used in |
|---|---|---|
| Mammadov (2022), *Journal of Personality* 90(2) — 267 samples, N=413,074 | Conscientiousness robust predictor beyond ability; personality+ability explain ~28% variance | spec 21 rationale |
| Poropat (2009), *Psychological Bulletin*; Vedel (2014), *Personality & Individual Differences* | Conscientiousness–GPA link | spec 21 |
| Donnellan, Oswald, Baird & Lucas (2006), *Psychological Assessment* | Mini-IPIP 20-item Big Five | instrument |
| Pashler, McDaniel, Rohrer & Bjork (2008), *PSPI* | No evidence for learning-style matching | forbidden list |
| Preckel et al. (2011), *Learning & Individual Differences* | Morningness relates to achievement | time-of-day adaptation |
| Ramirez & Beilock (2011), *Science* | Expressive writing before exams reduces anxiety-related drops | anxiety coach |
| Jamieson, Mendes, Blackstock & Schmader (2010), *JESP* | Arousal reappraisal improves exam performance | anxiety coach |
| Dunlosky & Rawson (2012), *Learning and Instruction* | Overconfidence hurts retention | calibration features |
| Nahum-Shani et al. (2018), *Annals of Behavioral Medicine*; Nahum-Shani & Murphy (2026), *Annual Review of Psychology* | JITAI framework | spec 22 |
| Klasnja et al. (2015), *Health Psychology* | Micro-randomized trials for JITAIs | propensity logging, clipping |

Verification note: key citations were checked against publisher or abstract pages on 2026-10-02. Coach KB source lines must reuse these references only.
