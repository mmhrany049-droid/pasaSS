// Curriculum layer (spec 30): school textbooks are the reference TOC for every test book.
// Source: owner's TOC screenshots (books.rar, edition 1405) → src/data/curriculum/catalog.json + links.json.
// Grade 12 is intentionally EMPTY (owner adds TOCs later); the textbook slots are reserved so code never crashes.
import CATALOG from './data/curriculum/catalog.json';
import LINKS from './data/curriculum/links.json';

/** The seven specialty subjects the app supports (owner request, v6). */
export const SUBJECTS = [
  { id: 'riazi', fa: 'ریاضی' }, { id: 'fizik', fa: 'فیزیک' }, { id: 'shimi', fa: 'شیمی' }, { id: 'hendese', fa: 'هندسه' },
  { id: 'amar', fa: 'آمار و احتمال' }, { id: 'gosaste', fa: 'گسسته' }, { id: 'zist', fa: 'زیست‌شناسی' },
];
export const STREAMS = { rf: 'ریاضی‌فیزیک', tj: 'علوم تجربی' };
export const GRADES = [10, 11, 12];
export const GRADE_FA = { 10: 'دهم', 11: 'یازدهم', 12: 'دوازدهم' };

// Grade-12 slots (official 1405 book list; TOCs pending owner input — nodes stay empty).
const G12 = [
  { id: 'tb.12.hesaban2', title: 'حسابان ۲', streams: ['rf'], subjectId: 'riazi' },
  { id: 'tb.12.hendese3', title: 'هندسه ۳', streams: ['rf'], subjectId: 'hendese' },
  { id: 'tb.12.gosaste', title: 'ریاضیات گسسته', streams: ['rf'], subjectId: 'gosaste' },
  { id: 'tb.12.fizik3.rf', title: 'فیزیک ۳ (ریاضی‌فیزیک)', streams: ['rf'], subjectId: 'fizik' },
  { id: 'tb.12.shimi3', title: 'شیمی ۳', streams: ['rf', 'tj'], subjectId: 'shimi' },
  { id: 'tb.12.riazi3', title: 'ریاضی ۳', streams: ['tj'], subjectId: 'riazi' },
  { id: 'tb.12.zist3', title: 'زیست‌شناسی ۳', streams: ['tj'], subjectId: 'zist' },
  { id: 'tb.12.fizik3.tj', title: 'فیزیک ۳ (تجربی)', streams: ['tj'], subjectId: 'fizik' },
].map(t => ({ ...t, grade: 12, status: 'pending-owner-input', nodes: [], edition: '1405', unitLabel: 'lesson' }));

const SUBJECT_OF = id => {
  const k = id.split('.')[2] || '';
  if (/^(riazi|hesaban)/.test(k)) return 'riazi';
  if (k.startsWith('hendese')) return 'hendese';
  if (k.startsWith('amar')) return 'amar';
  if (k.startsWith('gosaste')) return 'gosaste';
  if (k.startsWith('fizik')) return 'fizik';
  if (k.startsWith('shimi')) return 'shimi';
  if (k.startsWith('zist')) return 'zist';
  return 'riazi';
};

export const TEXTBOOKS = [...CATALOG.textbooks.map(t => ({ ...t, subjectId: SUBJECT_OF(t.id) })), ...G12];
export const textbookById = id => TEXTBOOKS.find(t => t.id === id) || null;

/** Textbooks for a grade + stream (+ optional subject). Grade 12 returns empty-TOC slots. */
export function textbooksFor(grade, stream, subjectId) {
  return TEXTBOOKS.filter(t => t.grade === +grade && (!stream || t.streams.includes(stream)) && (!subjectId || t.subjectId === subjectId));
}
export function subjectsFor(grade, stream) {
  const ids = new Set(textbooksFor(grade, stream).map(t => t.subjectId));
  return SUBJECTS.filter(x => ids.has(x.id));
}
export const isPending = tb => !tb || tb.status === 'pending-owner-input' || !tb.nodes?.length;
/** Short subject label from a textbook title: «فیزیک ۲ (ریاضی‌فیزیک)» → «فیزیک». */
export const subjectLabel = title => String(title || '').replace(/\(.*?\)/g, '').replace(/[0-9۰-۹]/g, '').trim();

// ---------- topic links (help.txt: shared topics of the two streams in one grade) ----------
const LINK_W = { identical: 1, equivalent: 0.8, partial: 0.5 };
const adj = new Map();
for (const l of LINKS.links) {
  if (l.type === 'prerequisite') continue;
  const w = (LINK_W[l.type] ?? 0.5) * (l.overlap ?? 1);
  for (const [a, b] of [[l.a, l.b], [l.b, l.a]]) { if (!adj.has(a)) adj.set(a, []); adj.get(a).push({ id: b, type: l.type, w }); }
}
/** Ref and every linked ref (same content in the other stream), with weights. */
export function linkedRefs(ref) {
  const out = new Map([[ref, 1]]);
  for (const x of adj.get(ref) || []) out.set(x.id, Math.max(out.get(x.id) || 0, x.w));
  // a lesson is also related to its chapter's links (c1/l2 ↔ links on c1)
  const ch = ref.split('/').slice(0, 2).join('/');
  if (ch !== ref) for (const x of adj.get(ch) || []) if (!out.has(x.id)) out.set(x.id, x.w * 0.5);
  return out;
}
/** Similarity of two sets of textbook refs (0..1). Same chapter = 0.6, same lesson/linked = 1. */
export function refSimilarity(as = [], bs = []) {
  let best = 0;
  for (const a of as) {
    const la = linkedRefs(a);
    for (const b of bs) {
      if (la.has(b)) best = Math.max(best, la.get(b));
      else if (b.startsWith(a + '/') || a.startsWith(b + '/')) best = Math.max(best, 0.9);
      else { const ca = a.split('/').slice(0, 2).join('/'), cb = b.split('/').slice(0, 2).join('/'); if (ca === cb) best = Math.max(best, 0.6); else if (linkedRefs(ca).has(cb)) best = Math.max(best, 0.5); }
    }
  }
  return best;
}
export const prerequisitesOf = ref => LINKS.links.filter(l => l.type === 'prerequisite' && l.b === ref).map(l => l.a);

/** Turn a textbook TOC into a test-book node skeleton (chapters → lessons as topics). Each node keeps tbRefs. */
export function skeletonFromTextbook(tb) {
  if (!tb?.nodes?.length) return [];
  const out = []; let chap = null;
  for (const n of tb.nodes) {
    if (n.kind === 'problemSet') continue;
    const id = 'n' + (out.length + 1);
    if (n.depth === 0) { chap = { id, title: n.title, kind: 'topic', depth: 0, parentId: null, order: out.length, tbRefs: [n.id] }; out.push(chap); continue; }
    out.push({ id, title: n.title, kind: 'topic', depth: Math.min(n.depth, 2), parentId: n.depth === 1 ? chap?.id ?? null : out.filter(x => x.depth === n.depth - 1).at(-1)?.id ?? chap?.id ?? null, order: out.length, tbRefs: [n.id] });
  }
  for (const n of out) n.isLeaf = !out.some(c => c.parentId === n.id);
  return out;
}
export { CATALOG, LINKS };
