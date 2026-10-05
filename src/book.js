// Test-book structure helpers (v6): numbering scopes, difficulty levels, exam-like coverage, textbook refs.
// Pure functions; no React. Internal question number = scopeNo × SCOPE + printed number, so every other
// module (keys, attempts, ranges, reviews) keeps working with one integer per question (spec 31 TB-1/TB-2).
import { toFa } from './engine.js';

export const SCOPE = 100000;
export const EXAM_LIKE = new Set(['mixed', 'checkup', 'comprehensive', 'final']);
export const KIND_FA = { topic: 'مبحث', theory: 'درس‌نامه', mixed: 'تست‌های مخلوط', checkup: 'آزمون چکاپ', comprehensive: 'آزمون جامع', final: 'آزمون پایانی/فصل' };
export const NUMBERING_FA = { global: 'سراسری (کل کتاب پشت هم)', perChapter: 'هر فصل از ۱' };
export const LEVEL_FA = { 1: 'سطح ۱ (آسان)', 2: 'سطح ۲ (متوسط)', 3: 'سطح ۳ (سخت)' };
/** Evidence weight of a question by difficulty level (assumption, owner-tunable). */
export const LEVEL_W = { 1: 0.8, 2: 1, 3: 1.2 };

export const isExamLike = n => !!n && EXAM_LIKE.has(n.kind);
export const nodeById = (b, id) => b.nodes.find(n => n.id === id) || null;
export const chapterNode = (b, n) => { let cur = n; while (cur?.parentId) cur = nodeById(b, cur.parentId); return cur || null; };
export const topLevel = b => b.nodes.filter(n => !n.parentId);

/** Scope node of a node: nearest ancestor-or-self with ownNumbering; else its chapter in per-chapter books; else null (global). */
export function scopeNodeOf(b, n) {
  let cur = n;
  while (cur) { if (cur.ownNumbering) return cur; cur = cur.parentId ? nodeById(b, cur.parentId) : null; }
  return b.numbering === 'perChapter' ? chapterNode(b, n) : null;
}
/** Every scope a user can type numbers in (for the «which chapter?» selector). */
export function scopesOf(b) {
  const out = [];
  if (b.numbering !== 'perChapter') out.push({ id: null, title: 'شماره‌های کل کتاب' });
  else for (const c of topLevel(b)) out.push({ id: c.id, title: c.title });
  for (const n of b.nodes) if (n.ownNumbering && !(b.numbering === 'perChapter' && !n.parentId)) out.push({ id: n.id, title: n.title, own: true });
  return out;
}
export const hasScopes = b => b.numbering === 'perChapter' || b.nodes.some(n => n.ownNumbering);

/** Give every scope node a stable number (never reused). Returns a NEW book if anything changed. */
export function ensureScopeNos(b) {
  let max = Math.max(0, ...b.nodes.map(n => n.scopeNo || 0)); let changed = false;
  const need = new Set();
  if (b.numbering === 'perChapter') topLevel(b).forEach(c => need.add(c.id));
  b.nodes.forEach(n => n.ownNumbering && need.add(n.id));
  const nodes = b.nodes.map(n => { if (need.has(n.id) && !n.scopeNo) { changed = true; return { ...n, scopeNo: ++max }; } return n; });
  return changed ? { ...b, nodes } : b;
}
export function scopeNoById(b, scopeId) { if (!scopeId) return 0; const n = nodeById(b, scopeId); return n?.scopeNo || 0; }
export const toInternal = (b, scopeId, printed) => scopeNoById(b, scopeId) * SCOPE + (+printed);
export const printedOf = num => num % SCOPE;
export const scopeNoOfNum = num => Math.floor(num / SCOPE);
export function scopeOfNum(b, num) { const k = scopeNoOfNum(num); return k ? b.nodes.find(n => n.scopeNo === k) || null : null; }
/** Short Persian label of a question: «۱۵» or «۱۵ · ف۲» in per-chapter books. */
export function qLabel(b, num, { long = false } = {}) {
  if (num == null) return '';
  const p = toFa(printedOf(num)); const sc = b ? scopeOfNum(b, num) : null; if (!sc) return p;
  const m = String(sc.title).match(/فصل\s*([0-9۰-۹]+)/);
  const tag = m ? `ف${toFa(m[1])}` : (long ? sc.title : sc.title.slice(0, 12));
  return long ? `${p} (${sc.title})` : `${p}·${tag}`;
}
export const rangeLabel = (b, from, to) => `${toFa(printedOf(from))} تا ${toFa(printedOf(to))}${scopeOfNum(b, from) ? ` (${scopeOfNum(b, from).title})` : ''}`;

// ---------- difficulty levels (e.g. نشر الگو: سطح ۱/۲/۳ per بخش) ----------
export function levelOf(b, node, num) {
  if (!b?.levels || !node?.levels?.length) return null;
  const l = node.levels.find(x => num >= x.from && num <= x.to); return l ? l.L : null;
}
/** Validate and normalize level ranges of a node → {ok, levels, qStart, qEnd} or {ok:false, error}. */
export function normalizeLevels(levels) {
  const ls = levels.filter(l => l.from && l.to).map(l => ({ L: +l.L, from: +l.from, to: +l.to })).sort((a, z) => a.from - z.from);
  if (!ls.length) return { ok: false, error: 'حداقل یک سطح را وارد کن.' };
  for (const l of ls) if (l.from > l.to) return { ok: false, error: `بازه ${LEVEL_FA[l.L]} نامعتبر است.` };
  for (let i = 1; i < ls.length; i++) if (ls[i].from <= ls[i - 1].to) return { ok: false, error: 'بازه سطح‌ها روی هم افتاده‌اند.' };
  return { ok: true, levels: ls, qStart: ls[0].from, qEnd: ls.at(-1).to };
}

// ---------- exam-like coverage (TB-7) ----------
/** Default coverage: topic leaves between the previous exam-like node (same parent chain) and this one, in book order. */
export function defaultCovers(b, node) {
  const ordered = [...b.nodes].sort((a, z) => a.order - z.order); const i = ordered.findIndex(n => n.id === node.id);
  const out = [];
  const sameChapter = node.parentId ? chapterNode(b, node) : null;
  for (let k = i - 1; k >= 0; k--) {
    const n = ordered[k];
    if (isExamLike(n) && n.kind === node.kind && n.kind !== 'mixed') break;
    if (sameChapter && chapterNode(b, n)?.id !== sameChapter.id) break;
    if (n.isLeaf && n.kind === 'topic') out.unshift(n.id);
  }
  if (!out.length && node.kind === 'mixed' && node.parentId) return b.nodes.filter(n => n.parentId === node.parentId && n.isLeaf && n.kind === 'topic').map(n => n.id);
  return out;
}
export const coversOf = (b, node) => (node?.covers?.length ? node.covers : defaultCovers(b, node)).filter(id => nodeById(b, id));

// ---------- textbook refs ----------
const digits = t => String(t).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
/** Best-effort mapping of a book's chapters/lessons to textbook node ids by «فصل N» / «درس M» numbers. */
export function autoRefs(b, tb) {
  if (!tb?.nodes?.length) return b;
  const chOf = n => { const m = digits(n.title).match(/فصل\s*(\d+)/); return m ? +m[1] : null; };
  const lsOf = n => { const m = digits(n.title).match(/درس\s*(\d+)|^(\d+)[-.]/); return m ? +(m[1] || m[2]) : null; };
  const nodes = b.nodes.map(n => {
    if (n.tbRefs?.length) return n;
    const ch = chapterNode(b, n); const c = ch ? chOf(ch) : null; if (!c) return n;
    const cRef = `${tb.id}/c${c}`; if (!tb.nodes.some(x => x.id === cRef)) return n;
    if (n.id === ch.id) return { ...n, tbRefs: [cRef] };
    const l = lsOf(n); const cand = tb.nodes.find(x => x.id.startsWith(cRef + '/') && x.order === l && x.depth === 1);
    return { ...n, tbRefs: [cand ? cand.id : cRef] };
  });
  return { ...b, nodes, textbookId: b.textbookId || tb.id };
}
/** Effective refs of a node: own refs, else nearest ancestor's. */
export function refsOf(b, n) { let cur = n; while (cur) { if (cur.tbRefs?.length) return cur.tbRefs; cur = cur.parentId ? nodeById(b, cur.parentId) : null; } return b.textbookId ? [b.textbookId] : []; }

// ---------- numbering mode conversion (keeps every attempt; TB-T2) ----------
/** Convert a book between global and per-chapter numbering. Returns {ok, map(old→new), book} or {ok:false, error}. */
export function convertNumbering(b, mode) {
  if (b.numbering === mode) return { ok: true, map: {}, book: b };
  let nb = ensureScopeNos({ ...b, numbering: mode });
  const map = {}; const used = new Set();
  const leavesR = b.nodes.filter(n => n.qStart != null);
  for (const n of leavesR) for (let q = n.qStart; q <= n.qEnd; q++) {
    const printed = printedOf(q); const sc = scopeNodeOf(nb, nodeById(nb, n.id)); const nq = scopeNoById(nb, sc?.id) * SCOPE + printed;
    if (used.has(nq)) return { ok: false, error: `شماره ${toFa(printed)} در دو مبحث تکرار می‌شود؛ تبدیل ممکن نیست.` };
    used.add(nq); map[q] = nq;
  }
  const mv = q => map[q] ?? q;
  nb = { ...nb, nodes: nb.nodes.map(n => n.qStart == null ? n : { ...n, qStart: mv(n.qStart), qEnd: mv(n.qEnd), levels: n.levels?.map(l => ({ ...l, from: mv(l.from), to: mv(l.to) })) }),
    keys: Object.fromEntries(Object.entries(b.keys || {}).map(([k, v]) => [mv(+k), v])) };
  return { ok: true, map, book: nb };
}
/** Apply a number map to everything in state that references questions of a book. */
export function remapState(s, bookId, map) {
  const mv = q => map[q] ?? q; const re = obj => obj ? Object.fromEntries(Object.entries(obj).map(([k, v]) => [mv(+k), v])) : obj;
  const sessions = s.sessions.map(x => x.bookId !== bookId || x.legacy ? x : { ...x, answers: re(x.answers), guesses: re(x.guesses), reasons: re(x.reasons), reasonAt: re(x.reasonAt), ranges: (x.ranges || []).map(r => ({ ...r, from: mv(r.from), to: mv(r.to) })) });
  const reviews = Object.fromEntries(Object.entries(s.reviews || {}).map(([ref, v]) => { const [bid, n] = ref.split(':'); return [bid === bookId ? `${bid}:${mv(+n)}` : ref, v]; }));
  return { ...s, sessions, reviews };
}
