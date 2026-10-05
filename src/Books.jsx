import { useMemo, useState } from 'react';
import * as E from './engine.js';
import { leaves, rangeOverlap, label, todayStr, attemptsOf, topicMastery } from './store.js';
import * as BK from './book.js';
import { textbookById, GRADE_FA, STREAMS } from './curriculum.js';
import { compareFor } from './exchange.js';
import BookWizard, { TocEditor } from './BookWizard.jsx';
import { Btn, Card, Chip, Head, Meter, fa } from './ui.jsx';

const inp = 'w-20 rounded-[8px] border-2 border-[var(--rule)] bg-[var(--paper)] px-2 py-1.5 text-center';

export default function Books({ s, set }) {
  const active = s.books.filter(b => b.active !== false), inactive = s.books.filter(b => b.active === false);
  const [bid, setBid] = useState(active[0]?.id || s.books[0]?.id);
  const [adding, setAdding] = useState(false);
  const b = s.books.find(x => x.id === bid);
  const setActive = (id, on) => set(x => ({ ...x, books: x.books.map(bb => bb.id === id ? { ...bb, active: on } : bb) }));
  return (
    <div>
      <Head kicker="کتاب‌ها" title="قفسه و کلیدها"><Btn onClick={() => setAdding(true)}>+ افزودن کتاب تست</Btn></Head>
      {adding ? <BookWizard defaults={{ grade: s.me?.grade, stream: s.me?.stream }} author={s.me?.name} onCancel={() => setAdding(false)}
        onCreate={nb => { set(x => ({ ...x, books: [...x.books, nb] })); setBid(nb.id); setAdding(false); }} /> : <>
        <div className="mb-3 flex flex-wrap gap-2">{active.map(x => <Chip key={x.id} active={x.id === bid} onClick={() => setBid(x.id)}>{x.title}، {x.publisher}</Chip>)}</div>
        {inactive.length > 0 && <Card className="mb-5"><p className="mb-2 text-[15px] font-black">کتاب‌های غیرفعال {fa(inactive.length)}</p>
          <p className="mb-3 text-[14px] text-[var(--pencil)]">کتاب‌هایی که از مرکز رسیده‌اند یا خاموششان کرده‌ای. تا فعال نکنی در ثبت تست، برنامه و آزمون‌ها نمی‌آیند.</p>
          <ul className="grid gap-2 sm:grid-cols-2">{inactive.map(x => <li key={x.id} className="flex items-center justify-between gap-2 rounded-[10px] bg-[var(--wash)] px-3 py-2 text-[14px]">
            <button type="button" className="text-right" onClick={() => setBid(x.id)}><b>{x.title}</b>، {x.publisher}<span className="block text-[12px] text-[var(--pencil)]">{x.origin === 'hub' ? 'از مرکز' : 'خاموش'}{x.grade ? ` · ${GRADE_FA[x.grade]}` : ''}{x.author ? ` · ${x.author}` : ''}</span></button>
            <Btn kind="soft" className="min-h-[34px] px-3 text-[13px]" onClick={() => { setActive(x.id, true); setBid(x.id); }}>فعال کن</Btn></li>)}</ul></Card>}
        {b && <BookEditor key={b.id} s={s} set={set} b={b} setActive={setActive} />}
      </>}
    </div>
  );
}

function BookEditor({ s, set, b, setActive }) {
  const [edit, setEdit] = useState(null); // {id, scope?, from, to, keys, levels:[{L,from,to}]}
  const [covers, setCovers] = useState(null); // node id whose coverage is being edited
  const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const [toc, setToc] = useState(null);
  const atts = useMemo(() => attemptsOf(s), [s.sessions, s.books, s.exams]);
  const mast = useMemo(() => topicMastery(s, atts).res, [atts]);
  const ls = leaves(b);
  const withRange = ls.filter(n => n.qStart != null);
  const totalQ = withRange.reduce((a, n) => a + n.qEnd - n.qStart + 1, 0);
  const keyed = withRange.reduce((a, n) => { let k = 0; for (let q = n.qStart; q <= n.qEnd; q++) if (b.keys[q]) k++; return a + k; }, 0);
  const upd = fn => set(x => ({ ...x, books: x.books.map(bb => bb.id === b.id ? { ...fn(bb), updatedAt: new Date().toISOString() } : bb) }));
  const taught = s.taught[b.id] || {};
  const tb = textbookById(b.textbookId);
  const toggleTaught = id => set(x => { const m = { ...(x.taught[b.id] || {}) }; if (m[id]) delete m[id]; else m[id] = { state: 'taught', at: todayStr() }; return { ...x, taught: { ...x.taught, [b.id]: m } }; });
  const scopeOf = n => BK.scopeNodeOf(b, n);
  const P = q => BK.printedOf(q);

  const open = n => setEdit({ id: n.id, from: n.qStart != null ? P(n.qStart) : '', to: n.qEnd != null ? P(n.qEnd) : '', keys: '',
    levels: [1, 2, 3].map(L => { const x = n.levels?.find(z => z.L === L); return { L, from: x ? P(x.from) : '', to: x ? P(x.to) : '' }; }) });
  const saveEdit = () => {
    setErr(''); const n = b.nodes.find(x => x.id === edit.id); const sc = scopeOf(n); const I = v => BK.toInternal(b, sc?.id, +E.normalizeDigits(v));
    let from, to, levels;
    if (b.levels && !BK.isExamLike(n)) {
      const r = BK.normalizeLevels(edit.levels.filter(l => l.from !== '' && l.to !== '').map(l => ({ L: l.L, from: I(l.from), to: I(l.to) })));
      if (!r.ok) return setErr(r.error); ({ levels, qStart: from, qEnd: to } = r);
    } else { from = I(edit.from); to = I(edit.to); if (!P(from) || !P(to) || from > to) return setErr('بازه نامعتبر است.'); }
    const ov = rangeOverlap(b, edit.id, from, to); if (ov) return setErr(`تداخل با «${ov.title}» (${BK.rangeLabel(b, ov.qStart, ov.qEnd)})`);
    let keys = {};
    if (edit.keys) { const r = E.parseAnswerString(edit.keys); if (!r.ok) return setErr('کلید فقط ارقام ۱ تا ۴ (و ۰ برای نامعلوم).'); if (r.values.length > to - from + 1) return setErr(`کلید ${fa(r.values.length)} رقم است ولی بازه ${fa(to - from + 1)} تست.`); r.values.forEach((v, i) => { keys[from + i] = v || null; }); }
    upd(bb => ({ ...bb, nodes: bb.nodes.map(x => x.id === edit.id ? { ...x, qStart: from, qEnd: to, ...(levels ? { levels } : {}) } : x), keys: { ...bb.keys, ...keys } }));
    setEdit(null);
  };
  const changeNumbering = mode => {
    const r = BK.convertNumbering(b, mode); if (!r.ok) return setMsg(r.error);
    set(x => BK.remapState({ ...x, books: x.books.map(bb => bb.id === b.id ? { ...r.book, numberingHint: undefined } : bb) }, b.id, r.map));
    setMsg(mode === 'perChapter' ? 'شماره‌گذاری «هر فصل از ۱» شد؛ همه تست‌های ثبت‌شده حفظ شدند.' : 'شماره‌گذاری سراسری شد.');
  };
  const saveToc = nodes => {
    // keep ranges/levels/covers of nodes that still exist; never drop a node that has saved ranges
    const kept = nodes.map(n => { const old = b.nodes.find(x => x.id === n.id); return old ? { ...old, ...n, qStart: old.qStart, qEnd: old.qEnd, levels: old.levels, covers: old.covers } : n; });
    const lost = b.nodes.filter(o => o.qStart != null && !kept.some(n => n.id === o.id));
    if (lost.length) return setMsg(`«${lost[0].title}» بازه ثبت‌شده دارد؛ اول بازه‌اش را خالی کن.`);
    upd(bb => BK.ensureScopeNos({ ...bb, nodes: kept })); setToc(null); setMsg('فهرست ذخیره شد.');
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <Card>
        {toc ? <><p className="mb-3 text-[16px] font-black">ویرایش فهرست</p><TocEditor nodes={toc} setNodes={setToc} />
          <div className="mt-3 flex gap-2"><Btn onClick={() => saveToc(toc)}>ذخیره فهرست</Btn><Btn kind="ghost" onClick={() => setToc(null)}>لغو</Btn></div></> :
        <div className="max-h-[70vh] overflow-auto">
          {b.nodes.filter(n => n.kind !== 'theory').map(n => {
            const editing = edit?.id === n.id; const ex = BK.isExamLike(n); const sc = scopeOf(n);
            if (!n.isLeaf) return <p key={n.id} className={`${n.depth === 0 ? 'mt-4 text-[17px] font-black text-[var(--ink)]' : 'mt-2 text-[15px] font-bold text-[var(--pencil)]'}`} style={{ paddingRight: n.depth * 14 }}>{n.title}{n.ownNumbering ? ' · شماره جدا' : ''}</p>;
            let k = 0; if (n.qStart != null) for (let q = n.qStart; q <= n.qEnd; q++) if (b.keys[q]) k++;
            const m = mast[`${b.id}|${n.id}`]; const cmp = compareFor(s, b, n);
            return (
              <div key={n.id} style={{ paddingRight: n.depth * 14 }} className="border-b border-[var(--rule)] py-2">
                <div className="flex flex-wrap items-center gap-3">
                  {n.kind === 'topic' && <input type="checkbox" aria-label={`خوانده‌شده: ${n.title}`} checked={!!taught[n.id]} onChange={() => toggleTaught(n.id)} className="h-5 w-5 accent-[var(--ink)]" />}
                  <span className="flex-1 text-[15px]">{n.title}{ex && <span className="mr-2 rounded-full bg-[var(--wash)] px-2 text-[12px] font-bold text-[var(--ink-deep)]">{BK.KIND_FA[n.kind]}</span>}</span>
                  <span className="text-[14px] text-[var(--pencil)]">{n.qStart != null ? `${fa(P(n.qStart))}–${fa(P(n.qEnd))}، کلید ${fa(k)}/${fa(n.qEnd - n.qStart + 1)}` : 'بدون بازه'}</span>
                  <Btn kind="ghost" className="min-h-[34px] px-3 text-[14px]" onClick={() => open(n)}>بازه/کلید</Btn>
                  {ex && <Btn kind="soft" className="min-h-[34px] px-3 text-[13px]" onClick={() => setCovers(covers === n.id ? null : n.id)}>از کدام مباحث؟ ({fa(BK.coversOf(b, n).length)})</Btn>}
                </div>
                {b.levels > 0 && n.levels?.length > 0 && <p className="mt-1 text-[13px] text-[var(--pencil)]">{n.levels.map(l => `سطح ${fa(l.L)}: ${fa(P(l.from))}–${fa(P(l.to))}${m?.levels?.[l.L] ? ` (${fa(Math.round(100 * m.levels[l.L].C / m.levels[l.L].N))}٪ درست)` : ''}`).join(' · ')}</p>}
                {cmp && <p className="mt-1 text-[13px] text-[var(--pencil)]">مقایسه: تسلط تو {m ? fa(Math.round(m.pC * 100)) : '—'}٪، میانه {fa(cmp.n)} نفر {fa(Math.round(cmp.p50 * 100))}٪</p>}
                {covers === n.id && <CoverPicker b={b} node={n} onSave={ids => { upd(bb => ({ ...bb, nodes: bb.nodes.map(x => x.id === n.id ? { ...x, covers: ids } : x) })); setCovers(null); }} onCancel={() => setCovers(null)} />}
                {editing && (
                  <div className="mt-3 grid gap-3 rounded-[12px] bg-[var(--wash)] p-3">
                    {sc && <p className="text-[13px] text-[var(--pencil)]">شماره‌ها داخل «{sc.title}» (همان شماره چاپ‌شده در کتاب).</p>}
                    {b.levels && !ex ? <div className="grid gap-2">{edit.levels.map((l, i) => <div key={l.L} className="flex flex-wrap items-center gap-2 text-[14px]"><span className="w-32 font-bold">{BK.LEVEL_FA[l.L]}</span>از
                      <input aria-label={`از سطح ${l.L}`} inputMode="numeric" className={inp} value={fa(l.from)} onChange={e => setEdit({ ...edit, levels: edit.levels.map((z, j) => j === i ? { ...z, from: E.normalizeDigits(e.target.value) } : z) })} />تا
                      <input aria-label={`تا سطح ${l.L}`} inputMode="numeric" className={inp} value={fa(l.to)} onChange={e => setEdit({ ...edit, levels: edit.levels.map((z, j) => j === i ? { ...z, to: E.normalizeDigits(e.target.value) } : z) })} /></div>)}
                      <p className="text-[12px] text-[var(--pencil)]">سطحی که این بخش ندارد را خالی بگذار.</p></div>
                      : <div className="flex items-center gap-2 text-[15px]">از <input aria-label="از" inputMode="numeric" className={inp} value={fa(edit.from)} onChange={e => setEdit({ ...edit, from: E.normalizeDigits(e.target.value) })} />
                        تا <input aria-label="تا" inputMode="numeric" className={inp} value={fa(edit.to)} onChange={e => setEdit({ ...edit, to: E.normalizeDigits(e.target.value) })} /></div>}
                    <label className="text-[14px]">کلید پشت هم (از اولین تست بازه):
                      <input dir="ltr" inputMode="numeric" className="mt-1 w-full rounded-[8px] border-2 border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-center tracking-[0.25em]" placeholder="۳۱۴۲۲۳۱۴۴۱" value={fa(edit.keys)} onChange={e => setEdit({ ...edit, keys: E.normalizeDigits(e.target.value) })} /></label>
                    {err && <p role="alert" className="text-[14px] font-bold text-[var(--bad)]">{err}</p>}
                    <div className="flex gap-2"><Btn onClick={saveEdit}>ذخیره</Btn><Btn kind="ghost" onClick={() => { setEdit(null); setErr(''); }}>لغو</Btn></div>
                  </div>)}
              </div>);
          })}
        </div>}
      </Card>
      <div className="grid content-start gap-4">
        <Card>
          <p className="text-[16px] font-black">{b.title}، {b.publisher}</p>
          <p className="mt-1 text-[13px] text-[var(--pencil)]">{b.grade ? GRADE_FA[b.grade] : ''}{b.stream ? ` · ${STREAMS[b.stream]}` : ''}{tb ? ` · مرجع: ${tb.title}` : ''}{b.origin === 'hub' ? ' · از مرکز' : ''}</p>
          <p className="mt-3 text-[14px] text-[var(--pencil)]">بازه‌گذاری {fa(withRange.length)} از {fa(ls.length)} مبحث</p><Meter value={withRange.length} max={ls.length || 1} />
          <p className="mt-3 text-[14px] text-[var(--pencil)]">کامل بودن کلید {fa(keyed)} از {fa(totalQ)} تست</p><Meter value={keyed} max={totalQ || 1} color="var(--ok)" />
          <p className="mt-3 text-[14px] text-[var(--pencil)]">خوانده‌شده {fa(Object.values(taught).filter(Boolean).length)} مبحث</p>
        </Card>
        <Card>
          <p className="mb-3 text-[16px] font-black">تنظیمات کتاب</p>
          <div className="grid gap-3 text-[14px]">
            <div><p className="mb-1 font-bold">شماره تست‌ها</p><div className="flex flex-wrap gap-2">{Object.entries(BK.NUMBERING_FA).map(([k, t]) => <Chip key={k} active={(b.numbering || 'global') === k} onClick={() => changeNumbering(k)}>{t}</Chip>)}</div>
              {b.numberingHint === 'perChapter' && b.numbering !== 'perChapter' && <p className="mt-1 text-[13px] text-[var(--amber)]">شماره‌های این کتاب هر فصل از ۱ شروع می‌شود؛ «هر فصل از ۱» را بزن، تست‌های قبلی حفظ می‌شوند.</p>}</div>
            <div><p className="mb-1 font-bold">سطح سختی</p><div className="flex gap-2"><Chip active={!b.levels} onClick={() => upd(bb => ({ ...bb, levels: 0 }))}>ندارد</Chip><Chip active={b.levels === 3} onClick={() => upd(bb => ({ ...bb, levels: 3 }))}>۳ سطح</Chip></div></div>
            <div className="flex flex-wrap gap-2"><Btn kind="soft" className="min-h-[36px] px-3 text-[13px]" onClick={() => setToc(b.nodes.map(n => ({ ...n })))}>ویرایش فهرست</Btn>
              {b.active !== false ? <Btn kind="ghost" className="min-h-[36px] px-3 text-[13px]" onClick={() => setActive(b.id, false)}>غیرفعال کن</Btn> : <Btn className="min-h-[36px] px-3 text-[13px]" onClick={() => setActive(b.id, true)}>فعال کن</Btn>}</div>
            {msg && <p role="status" className="text-[13px] font-bold text-[var(--ink-deep)]">{msg}</p>}
          </div>
        </Card>
        <Card><p className="text-[14px] leading-7 text-[var(--pencil)]">تیک = مبحث را خوانده‌ای. برای تست‌های مخلوط، چکاپ و آزمون‌های فصل با «از کدام مباحث؟» بگو شامل چه مباحثی‌اند تا نتیجه‌شان به همان مباحث برسد. تست‌های بدون کلید هنگام وارد شدن کلید خودکار تصحیح می‌شوند.</p></Card>
      </div>
    </div>
  );
}

/** Pick the topics an exam-like section (چکاپ، جامع، مخلوط، آزمون فصل) is drawn from. */
function CoverPicker({ b, node, onSave, onCancel }) {
  const [ids, setIds] = useState(() => BK.coversOf(b, node));
  const topics = leaves(b).filter(n => n.kind === 'topic');
  const byChapter = topics.reduce((a, n) => { const c = BK.chapterNode(b, n); (a[c?.id] ||= { c, items: [] }).items.push(n); return a; }, {});
  const tog = id => setIds(x => x.includes(id) ? x.filter(y => y !== id) : [...x, id]);
  return (
    <div className="mt-3 rounded-[12px] bg-[var(--wash)] p-3">
      <p className="mb-2 text-[14px] font-bold">«{node.title}» از کدام مباحث است؟</p>
      <div className="mb-2 flex flex-wrap gap-2"><Btn kind="soft" className="min-h-[30px] px-3 text-[12px]" onClick={() => setIds(BK.defaultCovers(b, node))}>پیشنهاد خودکار</Btn><Btn kind="ghost" className="min-h-[30px] px-3 text-[12px]" onClick={() => setIds([])}>هیچ</Btn></div>
      <div className="max-h-[40vh] overflow-auto">{Object.values(byChapter).map(({ c, items }) => <div key={c?.id || 'x'} className="mb-2">
        <label className="flex items-center gap-2 text-[14px] font-black"><input type="checkbox" checked={items.every(n => ids.includes(n.id))} onChange={e => setIds(x => e.target.checked ? [...new Set([...x, ...items.map(n => n.id)])] : x.filter(y => !items.some(n => n.id === y)))} />{c?.title}</label>
        {items.map(n => <label key={n.id} className="flex items-center gap-2 py-0.5 pr-5 text-[14px]"><input type="checkbox" checked={ids.includes(n.id)} onChange={() => tog(n.id)} />{label(b, n)}</label>)}</div>)}</div>
      <div className="mt-2 flex gap-2"><Btn className="min-h-[34px]" onClick={() => onSave(ids)}>ذخیره ({fa(ids.length)} مبحث)</Btn><Btn kind="ghost" className="min-h-[34px]" onClick={onCancel}>لغو</Btn></div>
    </div>
  );
}
