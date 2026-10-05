// File-based network (v6, spec 35/36 simplified): no server needed.
//   student app ──(.sspack: my books, keys, ranges, results, stats — only what I consented to)──► Hub (پروژه مرکز)
//   Hub ──(.ssbulletin: merged books, schools/classes, shared class exams, anonymous comparison, notices)──► every student
// Every file carries a SHA-256 checksum over its canonical JSON so damaged/edited files are detected.
import * as BK from './book.js';
import { attemptsOf, topicMastery, latestSitting, uuid, leaves, todayStr } from './store.js';

export const PACK = 'sspack', BULLETIN = 'ssbulletin', FORMAT_V = 1;
export const MIN_GROUP = 3; // comparison groups smaller than this are never published (k-anonymity)

export function canonical(x) {
  if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
  if (x && typeof x === 'object') return '{' + Object.keys(x).filter(k => x[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
  return JSON.stringify(x ?? null);
}
export async function sha256(text) {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function seal(obj) { const { sum, ...rest } = obj; return { ...rest, sum: await sha256(canonical(rest)) }; }
export async function verify(obj) { if (!obj?.sum) return false; const { sum, ...rest } = obj; return sum === await sha256(canonical(rest)); }

const NODE_KEYS = ['id', 'title', 'kind', 'depth', 'parentId', 'order', 'isLeaf', 'qStart', 'qEnd', 'levels', 'covers', 'ownNumbering', 'scopeNo', 'tbRefs'];
/** The part of a book that is safe and useful to share (structure, ranges, keys). */
export function shareableBook(b, author) {
  return {
    uid: b.uid, title: b.title, publisher: b.publisher, subject: b.subject, subjectId: b.subjectId, grade: b.grade, stream: b.stream, textbookId: b.textbookId,
    numbering: b.numbering || 'global', levels: b.levels || 0, color: b.color || null, updatedAt: b.updatedAt || null, author: author || b.author || null,
    nodes: b.nodes.map(n => Object.fromEntries(NODE_KEYS.filter(k => n[k] !== undefined).map(k => [k, n[k]]))), keys: b.keys || {},
  };
}
/** Per-topic aggregate of MY results (no single answers leave the device). */
export function topicStats(s) {
  const atts = attemptsOf(s).filter(a => !a.isLegacy); const { res } = topicMastery(s, atts); const out = [];
  for (const [k, m] of Object.entries(res)) {
    const [bid, nid] = k.split('|'); const b = s.books.find(x => x.id === bid); const n = b?.nodes.find(x => x.id === nid); if (!b || !n) continue;
    const mine = atts.filter(a => a.bookId === bid && a.nodeId === nid);
    out.push({ bookUid: b.uid, nodeId: nid, refs: BK.refsOf(b, n), N: mine.length, C: mine.filter(a => a.result === 'C').length, W: mine.filter(a => a.result === 'W').length, pC: +m.pC.toFixed(3) });
  }
  return out;
}
export async function buildPack(s) {
  const me = s.me || {}; const c = me.consent || {};
  const books = c.books ? s.books.filter(b => b.origin !== 'seed' || b.nodes.some(n => n.qStart != null) || Object.keys(b.keys || {}).length).map(b => shareableBook(b, me.name)) : [];
  const results = c.results ? s.exams.filter(e => e.hubExamId && latestSitting(e)).map(e => { const z = latestSitting(e); return { hubExamId: e.hubExamId, classId: e.classId, date: z.date, percent: z.percent, sections: z.sections.map(x => ({ subject: s.books.find(b => b.id === x.bookId)?.subject, C: x.C, W: x.W, B: x.B, P: x.P })) }; }) : [];
  return seal({ format: PACK, v: FORMAT_V, packId: uuid(), createdAt: new Date().toISOString(), app: 'SS',
    user: { id: me.id, name: me.name || s.settings?.name || '', grade: me.grade, stream: me.stream, schoolId: me.schoolId, classIds: me.classIds || [] },
    consent: { books: !!c.books, results: !!c.results, compare: !!c.compare }, books, results, stats: c.compare ? topicStats(s) : null, requests: (s.hub?.requests || []) });
}

// ---------- student side: apply a bulletin from the hub ----------
/** Map a hub class-exam section (textbook refs) onto my own active books. */
export function resolveSection(s, sec) {
  const act = s.books.filter(b => b.active !== false);
  const b = act.find(x => x.uid === sec.bookUid) || act.find(x => sec.textbookId && x.textbookId === sec.textbookId) || act.find(x => sec.subjectId && x.subjectId === sec.subjectId);
  if (!b) return null;
  const refs = sec.tbRefs || [];
  const ids = sec.bookUid === b.uid && sec.nodeIds?.length ? sec.nodeIds.filter(id => b.nodes.some(n => n.id === id))
    : leaves(b).filter(n => n.kind === 'topic' && BK.refsOf(b, n).some(r => refs.some(x => r === x || r.startsWith(x + '/') || x.startsWith(r + '/')))).map(n => n.id);
  return { bookId: b.id, count: sec.count, nodeIds: ids };
}
function mergeBook(local, incoming) {
  const keys = { ...incoming.keys, ...local.keys }; // my own keys win; hub fills the gaps
  const mineHasRanges = local.nodes.some(n => n.qStart != null);
  const nodes = mineHasRanges ? local.nodes : incoming.nodes.map(n => ({ ...n }));
  return { ...local, keys, nodes: mineHasRanges ? nodes : nodes, numbering: mineHasRanges ? local.numbering : incoming.numbering, levels: local.levels || incoming.levels, updatedAt: new Date().toISOString() };
}
export async function applyBulletin(s, bulletin) {
  if (bulletin?.format !== BULLETIN) return { ok: false, error: 'این فایل اطلاع‌رسانی مرکز نیست.' };
  if (!(await verify(bulletin))) return { ok: false, error: 'فایل دست‌کاری یا خراب شده (کنترل صحت رد شد).' };
  if ((s.hub?.bulletins || []).includes(bulletin.bulletinId)) return { ok: false, error: 'این اطلاع‌رسانی قبلاً وارد شده.' };
  const sum = { booksNew: 0, booksUpdated: 0, exams: 0, classes: 0, notices: 0 };
  let books = [...s.books];
  for (const ib of bulletin.books || []) {
    const i = books.findIndex(b => b.uid === ib.uid);
    if (i >= 0) { books[i] = mergeBook(books[i], ib); sum.booksUpdated++; }
    else { books.push({ ...ib, id: 'h' + Math.random().toString(36).slice(2, 8), active: false, origin: 'hub', keys: ib.keys || {} }); sum.booksNew++; } // must be activated by the user
  }
  const me = { ...s.me };
  const classes = bulletin.classes || []; const mine = classes.filter(c => (c.members || []).some(m => m.id === me.id)).map(c => c.id);
  me.classIds = [...new Set([...(me.classIds || []).filter(id => classes.some(c => c.id === id) || !(s.org?.classes || []).some(c => c.id === id)), ...mine])];
  sum.classes = mine.length;
  let st = { ...s, books, me, org: { schools: bulletin.schools || [], classes } };
  const exams = [...st.exams];
  for (const ce of bulletin.classExams || []) {
    if (!me.classIds.includes(ce.classId) || exams.some(e => e.hubExamId === ce.id)) continue;
    const sections = (ce.sections || []).map(sec => resolveSection(st, sec)).filter(x => x && x.nodeIds.length);
    exams.push({ id: Math.random().toString(36).slice(2, 10), hubExamId: ce.id, classId: ce.classId, kind: ce.date < todayStr() ? 'old' : 'upcoming', title: ce.title, date: ce.date, target: ce.target || 60, sections, sittings: [], unresolved: (ce.sections || []).length - sections.length, fromHub: true });
    sum.exams++;
  }
  const seen = new Set((s.announcements || []).map(a => a.id));
  const notes = (bulletin.announcements || []).filter(a => !seen.has(a.id) && (!a.classId || me.classIds.includes(a.classId)));
  sum.notices = notes.length;
  st = { ...st, exams, compare: bulletin.compare || st.compare, announcements: [...notes.map(a => ({ ...a, read: false })), ...(s.announcements || [])].slice(0, 50), hub: { ...(s.hub || {}), bulletins: [...(s.hub?.bulletins || []), bulletin.bulletinId], lastBulletinAt: bulletin.createdAt, hubName: bulletin.hubName } };
  return { ok: true, state: st, summary: sum };
}
/** Comparison row for one of my topics: group statistics published by the hub (or null). */
export function compareFor(s, b, n, classId) {
  const C = s.compare; if (!C || !b || !n) return null;
  const groups = classId && C.classes?.[classId] ? C.classes[classId] : C.all; if (!groups) return null;
  const k1 = `${b.uid}|${n.id}`; if (groups[k1]) return groups[k1];
  for (const r of BK.refsOf(b, n)) if (groups['ref:' + r]) return groups['ref:' + r];
  return null;
}

// ---------- download / upload helpers (browser) ----------
export function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
export const readJsonFile = file => file.text().then(t => JSON.parse(t));
