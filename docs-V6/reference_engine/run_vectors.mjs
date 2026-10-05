import fs from 'fs'; import * as E from './engine.js';
const v = JSON.parse(fs.readFileSync('../tests/test_vectors.json')); const v2 = JSON.parse(fs.readFileSync('../tests/test_vectors_v2.json'));
let fail = 0, pass = 0; const ok = (name, got, exp, tol = 1e-6) => {
  const eq = (a, b) => (a == null || b == null) ? a === b : typeof a === 'number' ? Math.abs(a - b) <= tol : typeof a === 'object' ? Object.keys(b).every(k => eq(a[k], b[k])) : a === b;
  if (eq(got, exp)) pass++; else { fail++; console.log('FAIL', name, JSON.stringify(got), '!=', JSON.stringify(exp)); } };
v.percent.forEach(t => ok('percent', E.percent(t.C, t.W, t.N), t.expected));
v.correct.forEach(t => ok('correct', E.correct(t.chosen, t.answer), t.expected));
v.timeWeight.forEach(t => ok('timeWeight', E.timeWeight(t.ageDays, t.H, t.legacy), t.expected));
ok('mastery', E.mastery(v.mastery.attempts, v.mastery.prior, v.mastery.k, v.mastery.H), v.mastery.expected);
v.reviewPriority.forEach(t => ok('reviewPriority', E.reviewPriority(t), t.expected));
v.strategy.forEach(t => ok('strategy', E.strategyItem(t.pC, t.pW), { q: t.q, E: t.E, answer: t.answer }));
v.weightedJaccard.forEach(t => ok('jaccard', E.weightedJaccard(t.a, t.b), t.expected));
v.coverage.forEach(t => ok('coverage', E.coverage(t.taughtQ, t.doneQ), t.expected));
v.workload.forEach(t => ok('workload', E.workload(t), t.expected));
const r = E.mulberry32(42); ok('prng', [1, 2, 3, 4, 5].map(() => r()), Object.assign({}, v.prng_mulberry32_seed42_first5));
v2.levelThreshold.forEach(t => ok('level', E.levelThreshold(t.L), t.expected));
v2.fsrsRetrievability.forEach(t => ok('fsrsR', E.fsrsR(t.t, t.S), t.expected));
v2.pointsLost.forEach(t => ok('pointsLost', E.pointsLost(t.N, t.W, t.B), t.expected));
v2.guessGain.forEach(t => ok('guessGain', E.guessGain(t.q), t.expected));
v2.readiness.forEach(t => ok('readiness', E.readiness(t), t.expected));
v2.examForgetting.forEach(t => ok('examForgetting', E.forecastToExam({ pC: t.pC_now, pW: 0.1, pB: t.pB_now }, t.t, t.S).pC, t.expected_pC_exam));
v2.secPerQ.forEach(t => ok('secPerQ', E.secPerQ(t.durationSec, t), t.expected));
// properties
const topics = [{ id: 'a', n: 10, pC: .6, pW: .2, pB: .2, effectiveN: 20, section: 'شیمی' }, { id: 'b', n: 15, pC: .3, pW: .3, pB: .4, effectiveN: 5, section: 'فیزیک' }];
const s1 = E.simulate(topics, { seed: 7 }), s2 = E.simulate(topics, { seed: 7 });
ok('sim-deterministic', s1.total.P50, s2.total.P50);
ok('sim-order', s1.total.P10 <= s1.total.P50 && s1.total.P50 <= s1.total.P90, true);
const analytic = 100 * (3 * (10 * .6 + 15 * .3) - (10 * .2 + 15 * .3)) / (3 * 25);
ok('sim-mean', s1.total.mean, analytic, 1.0);
const narrow = E.simulate([{ ...topics[0], effectiveN: 200 }], { seed: 3 }).total, wide = E.simulate([{ ...topics[0], effectiveN: 1 }], { seed: 3 }).total;
ok('STAT-2 width shrinks', (narrow.P90 - narrow.P10) < (wide.P90 - wide.P10), true);
let mono = true, prev = 1; for (let d = 0; d <= 60; d += 5) { const x = E.forecastToExam({ pC: .7, pW: .1, pB: .2 }, d, 7).pC; if (x > prev + 1e-12) mono = false; prev = x; } ok('PAAS-4 monotone', mono, true);
const sp = E.parseAnswerString('۳۱۴-۲ 2', 6); ok('answerString', sp.values.join(''), '314022');
ok('answerString-len', E.parseAnswerString('31', 3).error, 'E_KEY_LENGTH');
for (const f of fs.readdirSync('../seed').filter(f => f.endsWith('.ssb'))) { const p = E.parseSSB(fs.readFileSync('../seed/' + f, 'utf8')); ok('ssb ' + f, p.errors.length, 0); }
const pl = E.bktUpdate(0.2, true), half = E.bktUpdate(0.2, true, { weight: 0.5 }); ok('INT-MT-2 half evidence', Math.abs(half - (0.2 + 0.5 * (pl - 0.2))) < 1e-12, true);
console.log(`pass ${pass} fail ${fail}`); process.exit(fail ? 1 : 0);
