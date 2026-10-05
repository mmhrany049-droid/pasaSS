// State, persistence and derived computations for the SS prototype.
import * as E from './engine.js';
import { SEEDS } from './seeds.js';

const KEY = 'ss-prototype-v3';
export const DAY = 864e5;
export const uid = () => Math.random().toString(36).slice(2, 10);
export const todayStr = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

export const REASONS = [
  { id: 'unknown', fa: 'بلد نبودم', w: 5 }, { id: 'conceptual', fa: 'مفهومی', w: 4 }, { id: 'forgotFormula', fa: 'فرمول یادم رفت', w: 3.5 },
  { id: 'timeShortage', fa: 'کمبود وقت', w: 3 }, { id: 'calculation', fa: 'محاسبه', w: 2.5 }, { id: 'carelessness', fa: 'بی‌دقتی', w: 2 },
  { id: 'misread', fa: 'بد خواندن صورت', w: 2 }, { id: 'wrongGuess', fa: 'حدس غلط', w: 1.5 },
];

function buildBooks() {
  const defs = [
    { id: 'calc', subject: 'حسابان', color: '#7A3B8F' },
    { id: 'phys', subject: 'فیزیک', color: '#1F5F8B' },
    { id: 'chem', subject: 'شیمی', color: '#2F7D4F' },
  ];
  return defs.map(d => {
    const p = E.parseSSB(SEEDS[d.id]);
    return { ...d, title: p.meta['کتاب'], publisher: p.meta['ناشر'], nodes: p.nodes.map(n => ({ ...n, qStart: null, qEnd: null })), keys: {} };
  });
}

export function initialState() {
  return {
    v: 3, books: buildBooks(), taught: {}, sessions: [], errorTasks: [], exams: [],
    shop: [
      { id: 's1', title: '۳۰ دقیقه بازی', emoji: '🎮', price: 90 }, { id: 's2', title: 'یک قسمت سریال', emoji: '🎬', price: 120 },
      { id: 's3', title: 'بیرون رفتن با دوستان', emoji: '🚶', price: 400 }, { id: 's4', title: 'خرید کوچک', emoji: '🛍️', price: 600 },
    ],
    redemptions: [], swaps: {}, profile: { ipip: null }, settings: { dailyMin: 150, rewards: true }, demo: false,
  };
}

export function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 3) return s; } catch { /* storage unavailable */ }
  return initialState();
}
export function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } }

// ---------- book helpers ----------
export const bookById = (s, id) => s.books.find(b => b.id === id);
export const leaves = b => b.nodes.filter(n => n.isLeaf && n.kind !== 'theory');
export function nodePath(b, n) {
  const out = []; let cur = n;
  while (cur) { out.unshift(cur.title); cur = b.nodes.find(x => x.id === cur.parentId); }
  return out;
}
export function label(b, n) {
  if (!n) return '';
  const fd = t => t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  if (/^(پرسش‌ها|درس‌نامه)$/.test(n.title)) { const p = b.nodes.find(x => x.id === n.parentId); return fd(p ? p.title : n.title); }
  return fd(n.title);
}
export function chapterOf(b, n) { let cur = n; while (cur && cur.parentId) cur = b.nodes.find(x => x.id === cur.parentId); return cur; }
export function nodeForNumber(b, num) { return leaves(b).find(n => n.qStart != null && num >= n.qStart && num <= n.qEnd) || null; }
export function rangeOverlap(b, nodeId, from, to) {
  return leaves(b).find(n => n.id !== nodeId && n.qStart != null && !(to < n.qStart || from > n.qEnd)) || null;
}

// ---------- attempts (derived from sessions; raw truth = sessions) ----------
export function attemptsOf(s) {
  const out = []; const seen = {};
  const sorted = [...s.sessions].sort((a, b) => a.at.localeCompare(b.at));
  for (const ses of sorted) {
    const b = bookById(s, ses.bookId); if (!b) continue;
    for (const [numS, chosen] of Object.entries(ses.answers)) {
      const num = +numS, ref = `${b.id}:${num}`;
      const node = nodeForNumber(b, num) || b.nodes.find(n => n.id === ses.nodeId);
      const result = E.correct(chosen, b.keys[num] ?? null);
      const prev = seen[ref]; seen[ref] = ses.at;
      out.push({
        ref, num, bookId: b.id, subject: b.subject, nodeId: node?.id, sessionId: ses.id, at: ses.at, chosen, result,
        isGuess: !!ses.guesses?.[num], reasons: ses.reasons?.[num] || [],
        repeatWithin24h: prev ? (Date.parse(ses.at) - Date.parse(prev)) < DAY : false, mixed: ses.mixed,
      });
    }
  }
  return out;
}
export function sessionStats(s, ses) {
  const b = bookById(s, ses.bookId);
  return E.stats(Object.entries(ses.answers).map(([n, c]) => E.correct(c, b.keys[+n] ?? null)));
}

// ---------- mastery per topic ----------
export function topicMastery(s, atts, now = Date.now()) {
  const bySubject = {}, byNode = {};
  for (const a of atts) { (bySubject[a.subject] ||= []).push(a); if (a.nodeId) (byNode[`${a.bookId}|${a.nodeId}`] ||= []).push(a); }
  const subjPrior = {};
  for (const [sub, arr] of Object.entries(bySubject)) {
    const c = arr.filter(a => a.result !== 'U');
    if (c.length < 20) subjPrior[sub] = [0.4, 0.3, 0.3];
    else { const n = c.length; subjPrior[sub] = ['C', 'W', 'B'].map(r => Math.max(0.05, c.filter(a => a.result === r).length / n)); const t = subjPrior[sub].reduce((x, y) => x + y); subjPrior[sub] = subjPrior[sub].map(x => x / t); }
  }
  const res = {};
  for (const [key, arr] of Object.entries(byNode)) {
    const valid = arr.filter(a => a.result !== 'U');
    const m = E.mastery(valid.map(a => ({ ...a, ageDays: (now - Date.parse(a.at)) / DAY })), subjPrior[arr[0].subject]);
    const lastAt = Math.max(...arr.map(a => Date.parse(a.at)));
    res[key] = { ...m, n: valid.length, lastAt, distinct: new Set(arr.map(a => a.ref)).size };
  }
  return { res, subjPrior };
}

// ---------- rewards (spec 11) ----------
export function rewardEvents(s, atts) {
  const ev = []; const dayCount = {};
  const cap = (kind, day, xp, limit) => { const k = kind + day; const used = dayCount[k] || 0; const g = Math.max(0, Math.min(xp, limit - used)); dayCount[k] = used + g; return g; };
  for (const ses of s.sessions) {
    const day = ses.at.slice(0, 10), st = sessionStats(s, ses);
    if (ses.flags?.length) { ev.push({ kind: 'flagged', xp: 0, coins: 0, at: ses.at, fa: 'جلسه مشکوک (بدون پاداش)' }); continue; }
    if (st.C + st.W + st.B >= 5) ev.push({ kind: 'sessionLogged', xp: cap('sl', day, 3, 15), coins: 0, at: ses.at, fa: 'ثبت جلسه تست' });
    const analyzed = Object.values(ses.reasons || {}).filter(r => r.length).length;
    if (analyzed) ev.push({ kind: 'errorAnalyzed', xp: cap('ea', day, analyzed, 40), coins: analyzed * 0.5, at: ses.at, fa: `تحلیل ${E.toFa(analyzed)} خطا` });
    if (ses.mixed) ev.push({ kind: 'mixedPractice', xp: cap('mx', day, 8, 16), coins: 5, at: ses.at, fa: 'جلسه مخلوط' });
    if (ses.minutes) ev.push({ kind: 'minutes', xp: 0, coins: Math.min(ses.minutes, 360), at: ses.at, fa: `${E.toFa(ses.minutes)} دقیقه مطالعه` });
  }
  for (const t of s.errorTasks.filter(t => t.status === 'done')) ev.push({ kind: 'errorTaskClosed', xp: 5, coins: 5, at: t.doneAt, fa: 'بستن تحلیل خطای معوق' });
  const q = questsFor(s, atts);
  for (const x of q.filter(x => x.done)) ev.push({ kind: 'quest', xp: x.xp, coins: x.coins, at: todayStr() + 'T12:00:00Z', fa: 'ماموریت: ' + x.title });
  return ev;
}
export function rewardSummary(s, atts) {
  const ev = rewardEvents(s, atts);
  const xp = ev.reduce((a, e) => a + e.xp, 0), earned = ev.reduce((a, e) => a + e.coins, 0);
  const spent = s.redemptions.reduce((a, r) => a + r.price, 0);
  const days = new Set(s.sessions.filter(x => Date.now() - Date.parse(x.at) < 14 * DAY).map(x => x.at.slice(0, 10))).size;
  return { ev, xp, coins: Math.floor(earned - spent), ...E.levelFromXp(xp), consistency: days };
}

// deterministic daily quests (seed = date)
export function questsFor(s, atts, date = todayStr()) {
  const today = atts.filter(a => a.at.slice(0, 10) === date);
  const { res } = topicMastery(s, atts);
  const weak = Object.entries(res).filter(([, m]) => m.confidence >= 0.4).sort((a, b) => a[1].pC - b[1].pC)[0];
  let weakNode = null, weakBook = null;
  if (weak) { const [bId, nId] = weak[0].split('|'); weakBook = bookById(s, bId); weakNode = weakBook?.nodes.find(n => n.id === nId); }
  const rng = E.mulberry32([...date].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) + (s.swaps[date] || 0));
  const pool = [
    weakNode && { id: 'weak', title: `۱۵ تست از «${label(weakBook, weakNode)}»`, target: 15, progress: today.filter(a => a.nodeId === weakNode.id).length, xp: 20, coins: 20 },
    { id: 'analyze', title: 'علت ۵ خطا را مشخص کن', target: 5, progress: today.filter(a => a.reasons.length).length, xp: 10, coins: 10 },
    { id: 'mixed', title: 'یک جلسه مخلوط (چند مبحث) بزن', target: 1, progress: s.sessions.filter(x => x.at.slice(0, 10) === date && x.mixed).length, xp: 15, coins: 15 },
    { id: 'volume', title: '۲۰ تست با تحلیل کامل', target: 20, progress: today.filter(a => a.result !== 'U').length, xp: 12, coins: 12 },
    { id: 'tasks', title: 'یک تحلیل خطای معوق را ببند', target: 1, progress: s.errorTasks.filter(t => t.status === 'done' && t.doneAt?.slice(0, 10) === date).length, xp: 10, coins: 10 },
  ].filter(Boolean);
  const picked = [];
  while (picked.length < 3 && pool.length) picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return picked.map(q => ({ ...q, done: q.progress >= q.target }));
}

// ---------- exam readiness (spec 24 + 26) ----------
export function examForecast(s, exam, atts, opts = {}) {
  const now = Date.now(), daysLeft = Math.max(0, Math.round((Date.parse(exam.date) - now) / DAY));
  const { res, subjPrior } = topicMastery(s, atts);
  const topics = [], gaps = { untaught: [], untested: [], weak: [], fading: [], openErrors: [] };
  for (const sec of exam.sections) {
    const b = bookById(s, sec.bookId); const ids = sec.nodeIds; if (!b || !ids.length) continue;
    // largest-remainder split of question count by node question count (equal if unknown)
    const sizes = ids.map(id => { const n = b.nodes.find(x => x.id === id); return n?.qStart != null ? n.qEnd - n.qStart + 1 : 10; });
    const tot = sizes.reduce((a, x) => a + x, 0); const raw = sizes.map(x => sec.count * x / tot);
    const cnt = raw.map(Math.floor); let rem = sec.count - cnt.reduce((a, x) => a + x, 0);
    raw.map((x, i) => [x - Math.floor(x), i]).sort((a, z) => z[0] - a[0]).slice(0, rem).forEach(([, i]) => cnt[i]++);
    ids.forEach((id, i) => {
      const node = b.nodes.find(x => x.id === id); const m = res[`${b.id}|${id}`]; const taught = !!s.taught[b.id]?.[id];
      const weight = cnt[i] / exam.sections.reduce((a, x) => a + x.count, 0);
      let p, eff, state;
      const q = cnt[i];
      if (!taught && !m) { p = { pC: 0.10, pW: 0.15, pB: 0.75 }; eff = 1; state = 'untaught'; if (q) gaps.untaught.push({ b, node, weight, q }); }
      else if (!m || m.n === 0) { const pr = subjPrior[b.subject] || [0.4, 0.3, 0.3]; p = { pC: pr[0] * 0.85, pW: pr[1], pB: 1 - pr[0] * 0.85 - pr[1] }; eff = 1; state = 'untested'; if (q) gaps.untested.push({ b, node, weight, q }); }
      else {
        const S = 3 * (1 + 0.5 * Math.log2(1 + m.n)); const gap = (now - m.lastAt) / DAY + daysLeft;
        p = E.forecastToExam(m, gap, S); eff = m.effectiveN; state = 'tested';
        if (q && m.pC < 0.5 && m.confidence >= 0.4) gaps.weak.push({ b, node, weight, m, q });
        if (q && p.R < 0.8) gaps.fading.push({ b, node, weight, R: p.R, q });
      }
      if (cnt[i] > 0) topics.push({ id: `${b.id}|${id}`, n: cnt[i], ...p, effectiveN: eff, section: b.subject, state, node, b, weight });
    });
  }
  const openErr = atts.filter(a => (a.result === 'W' || a.result === 'B') && topics.some(t => t.id === `${a.bookId}|${a.nodeId}`));
  gaps.openErrors = openErr;
  if (!topics.length) return null;
  const sim = E.simulate(topics, { runs: opts.runs || 3000, seed: 11 });
  const testedW = topics.filter(t => t.state === 'tested').reduce((a, t) => a + t.weight, 0);
  const totalW = topics.reduce((a, t) => a + t.weight, 0);
  const ret = topics.filter(t => t.R != null);
  const target = exam.target || 60;
  const mocks = s.sessions.filter(x => x.mixed && now - Date.parse(x.at) < 14 * DAY).length;
  const comps = {
    A: Math.max(0, Math.min(1, sim.total.P50 / target)), Cov: totalW ? testedW / totalW : 0,
    Ret: ret.length ? ret.reduce((a, t) => a + t.R * t.weight, 0) / ret.reduce((a, t) => a + t.weight, 0) : 0,
    Mock: Math.min(1, mocks / 2), Err: openErr.length ? Math.max(0, 1 - openErr.filter(a => !a.reasons.length).length / openErr.length) : 1,
  };
  const subjAtt = {}; for (const t of topics) if (t.state === 'tested') subjAtt[t.section] = (subjAtt[t.section] || 0) + (res[t.id]?.n || 0);
  // action plan: gain per minute (spec 24 §6)
  const actions = topics.map(t => {
    const minutes = t.state === 'untaught' ? 45 : 20;
    const sW = t.pW / Math.max(1e-9, t.pW + t.pB), sB = 1 - sW;
    const dp = Math.min(0.15, (t.state === 'untaught' ? 0.6 : 0.5 * (1 - t.pC)) * minutes / 60); // weaker topic = more room to gain
    const gain = t.weight * dp * 100 * (sW * 4 / 3 + sB);
    const kind = t.state === 'untaught' ? 'مطالعه درسنامه' : t.state === 'untested' ? 'تست نزده' : (t.R != null && t.R < 0.8) ? 'مرور فراموشی' : 'تست هدفمند';
    return { t, minutes, gain, gpm: gain / minutes, kind };
  }).sort((a, z) => z.gpm - a.gpm);
  return { daysLeft, sim, topics, gaps, comps, RI: E.readiness(comps), actions, subjAtt };
}

export function buildPrepPlan(s, exam, fc) {
  const days = Math.max(1, fc.daysLeft); const perDay = s.settings.dailyMin; const plan = [];
  const queue = fc.actions.map(a => ({ ...a })); const used = {};
  for (let d = 0; d < days; d++) {
    const date = todayStr(new Date(Date.now() + d * DAY)); let left = perDay; const items = [];
    if (d === days - 1 && days > 1) { items.push({ title: 'مرور سبک خطاهای مهم + خواب کافی', minutes: Math.min(60, perDay), kind: 'روز قبل آزمون' }); plan.push({ date, items }); continue; }
    const mixedDay = d >= Math.floor(days * 0.8) && days >= 5;
    if (mixedDay) { items.push({ title: 'آزمون شبیه‌ساز زمان‌دار مخلوط', minutes: Math.min(perDay, 60), kind: 'شرایط آزمون' }); left -= 60; }
    for (const a of queue) {
      if (left < 20) break; const k = a.t.id; if ((used[k] || 0) >= 3) continue;
      if (a.t.state === 'untaught' && d >= days - 2) continue;
      items.push({ title: `${a.kind}: ${a.t.section}، ${label(a.t.b, a.t.node)}`, subject: a.t.section, minutes: a.minutes, gain: a.gain, kind: a.kind });
      left -= a.minutes; used[k] = (used[k] || 0) + 1; a.gpm *= 0.6;
    }
    queue.sort((a, z) => z.gpm - a.gpm);
    plan.push({ date, items });
  }
  return plan;
}

// ---------- behavior signals (spec 21 Layer B, subset) ----------
export function behavior(s, atts) {
  const out = [];
  const timed = s.sessions.filter(x => x.minutes);
  const blocks = { 'صبح': [6, 12], 'بعدازظهر': [12, 16], 'عصر': [16, 20], 'شب': [20, 24] };
  const blockStats = Object.entries(blocks).map(([k, [a, z]]) => {
    const ss = s.sessions.filter(x => { const h = new Date(x.at).getHours(); return h >= a && h < z; }).map(x => sessionStats(s, x).P).filter(p => p != null);
    return { k, n: ss.length, mean: ss.length ? ss.reduce((x, y) => x + y, 0) / ss.length : null };
  });
  const all = blockStats.filter(b => b.n).flatMap(b => Array(b.n).fill(b.mean)); const g = all.length ? all.reduce((a, x) => a + x, 0) / all.length : 0;
  const shrunk = blockStats.map(b => ({ ...b, m: b.n ? (b.n * b.mean + 5 * g) / (b.n + 5) : null })).filter(b => b.m != null).sort((a, z) => z.m - a.m);
  out.push({ id: 'best', fa: 'بهترین ساعت مطالعه', minN: 12, n: s.sessions.length, value: shrunk.length >= 2 && shrunk[0].m - shrunk[1].m > 3 ? shrunk[0].k : 'تفاوت معنادار نیست', detail: shrunk.map(b => `${b.k}: ${E.toFa(b.m.toFixed(0))}٪ (${E.toFa(b.n)} جلسه)`).join('، ') });
  const days14 = new Set(s.sessions.filter(x => Date.now() - Date.parse(x.at) < 14 * DAY).map(x => x.at.slice(0, 10))).size;
  out.push({ id: 'consistency', fa: 'ثبات (روز فعال از ۱۴)', minN: 1, n: s.sessions.length, value: E.toFa(days14) + ' روز' });
  const g2 = atts.filter(a => a.isGuess && a.result !== 'U'); const gq = g2.length ? g2.filter(a => a.result === 'C').length / g2.length : null;
  out.push({ id: 'guess', fa: 'بازده حدس', minN: 15, n: g2.length, value: gq == null ? '' : `${E.toFa((gq * 100).toFixed(0))}٪ درست — ${gq > 0.25 ? 'حدس‌هایت سود دارد' : 'حدس نزن'}` });
  const c = atts.filter(a => a.result !== 'U'); const blank = c.length ? c.filter(a => a.result === 'B').length / c.length : 0;
  out.push({ id: 'blank', fa: 'سهم نزده‌ها', minN: 40, n: c.length, value: E.toFa((blank * 100).toFixed(0)) + '٪' });
  const pts = timed.map(x => ({ spq: E.secPerQ(x.minutes * 60, sessionStats(s, x)), p: sessionStats(s, x).P })).filter(x => x.spq && x.p != null);
  let rho = null;
  if (pts.length >= 6) { const rank = arr => { const idx = arr.map((v, i) => [v, i]).sort((a, z) => a[0] - z[0]); const r = []; idx.forEach(([, i], k) => r[i] = k); return r; };
    const r1 = rank(pts.map(x => x.spq)), r2 = rank(pts.map(x => x.p)); const n = pts.length; const d2 = r1.reduce((a, x, i) => a + (x - r2[i]) ** 2, 0); rho = 1 - 6 * d2 / (n * (n * n - 1)); }
  out.push({ id: 'speed', fa: 'رابطه سرعت و دقت', minN: 10, n: pts.length, value: rho == null ? '' : rho > 0.3 ? 'آهسته‌تر = دقیق‌تر؛ عجله نکن' : rho < -0.3 ? 'سریع‌تر = دقیق‌تر (تسلط)' : 'رابطه روشنی نیست', detail: rho == null ? '' : `ρ = ${E.toFa(rho.toFixed(2))}` });
  const analyzed = atts.filter(a => (a.result === 'W' || a.result === 'B')); const share = analyzed.length ? analyzed.filter(a => a.reasons.length).length / analyzed.length : 0;
  out.push({ id: 'follow', fa: 'پیگیری خطا', minN: 30, n: analyzed.length, value: E.toFa((share * 100).toFixed(0)) + '٪ خطاها تحلیل شده' });
  return out;
}

// ---------- demo data ----------
export function withDemo(s0) {
  const s = JSON.parse(JSON.stringify(initialState())); s.demo = true;
  const rng = E.mulberry32(2026);
  for (const b of s.books) {
    let num = 1;
    for (const n of leaves(b)) { const size = n.kind === 'checkup' || n.kind === 'comprehensive' ? 20 : n.kind === 'final' ? 40 : 15 + Math.floor(rng() * 16); n.qStart = num; n.qEnd = num + size - 1; for (let q = num; q <= n.qEnd; q++) b.keys[q] = 1 + Math.floor(rng() * 4); num += size; }
    const ls = leaves(b).filter(n => n.kind === 'topic'); s.taught[b.id] = {};
    ls.slice(0, Math.ceil(ls.length * 0.45)).forEach(n => s.taught[b.id][n.id] = true);
  }
  const skill = { calc: 0.55, phys: 0.42, chem: 0.62 };
  for (let i = 0; i < 34; i++) {
    const b = s.books[i % 3]; const taughtLeaves = leaves(b).filter(n => s.taught[b.id][n.id]);
    const node = taughtLeaves[Math.floor(rng() * taughtLeaves.length)]; const size = 10 + Math.floor(rng() * 11);
    const from = node.qStart + Math.floor(rng() * Math.max(1, node.qEnd - node.qStart - size)); const to = Math.min(node.qEnd, from + size - 1);
    const daysAgo = 30 - Math.floor(i * 30 / 34); const hour = [8, 10, 15, 17, 18, 21, 22][Math.floor(rng() * 7)];
    const at = new Date(Date.now() - daysAgo * DAY); at.setHours(hour, 10, 0, 0);
    const ability = skill[b.id] + (30 - daysAgo) * 0.006 + (node.order % 5) * 0.03 - 0.06;
    const answers = {}, guesses = {}, reasons = {};
    for (let q = from; q <= to; q++) {
      const u = rng(); const k = b.keys[q];
      if (u < ability) answers[q] = k; else if (u < ability + 0.18) { answers[q] = 0; } else { answers[q] = ((k + Math.floor(rng() * 3)) % 4) + 1; if (answers[q] === k) answers[q] = (k % 4) + 1; }
      if (rng() < 0.12 && answers[q] > 0) guesses[q] = true;
      if (answers[q] !== k && rng() < 0.7) reasons[q] = [REASONS[Math.floor(rng() * REASONS.length)].id];
    }
    const n = to - from + 1; const minutes = Math.round(n * (55 + rng() * 50) / 60 / 5) * 5 || 10;
    s.sessions.push({ id: uid(), bookId: b.id, nodeId: node.id, ranges: [{ nodeId: node.id, from, to }], answers, guesses, reasons, minutes, timeSource: 'estimated', at: at.toISOString(), mixed: rng() < 0.15 });
  }
  const exam = { id: uid(), title: 'آزمون قلمچی (نمونه)', date: todayStr(new Date(Date.now() + 9 * DAY)), target: 60, sections: s.books.map(b => ({ bookId: b.id, count: b.id === 'calc' ? 20 : 15, nodeIds: leaves(b).filter(n => n.kind === 'topic').slice(0, Math.ceil(leaves(b).filter(n => n.kind === 'topic').length * 0.55)).map(n => n.id) })) };
  s.exams.push(exam);
  s.redemptions = []; s.errorTasks = [{ id: uid(), sessionId: s.sessions.at(-1).id, status: 'open', at: s.sessions.at(-1).at }];
  return s;
}
