import { useState } from 'react';
import * as E from './engine.js';
import { leaves, rangeOverlap, label } from './store.js';
import { Btn, Card, Chip, Head, Meter, fa } from './ui.jsx';

export default function Books({ s, set }) {
  const [bid, setBid] = useState(s.books[0].id);
  const b = s.books.find(x => x.id === bid);
  const [edit, setEdit] = useState(null); // {id, from, to, keys}
  const [err, setErr] = useState('');
  const ls = leaves(b);
  const withRange = ls.filter(n => n.qStart != null);
  const totalQ = withRange.reduce((a, n) => a + n.qEnd - n.qStart + 1, 0);
  const keyed = withRange.reduce((a, n) => { let k = 0; for (let q = n.qStart; q <= n.qEnd; q++) if (b.keys[q]) k++; return a + k; }, 0);
  const upd = fn => set(x => ({ ...x, books: x.books.map(bb => bb.id === bid ? fn(bb) : bb) }));
  const taught = s.taught[bid] || {};
  const toggleTaught = id => set(x => ({ ...x, taught: { ...x.taught, [bid]: { ...(x.taught[bid] || {}), [id]: !(x.taught[bid] || {})[id] } } }));
  const saveEdit = () => {
    setErr('');
    const from = +E.normalizeDigits(edit.from), to = +E.normalizeDigits(edit.to);
    if (!from || !to || from > to) return setErr('بازه نامعتبر است.');
    const ov = rangeOverlap(b, edit.id, from, to); if (ov) return setErr(`تداخل با «${ov.title}» (${fa(ov.qStart)}–${fa(ov.qEnd)})`);
    let keys = {};
    if (edit.keys) { const r = E.parseAnswerString(edit.keys); if (!r.ok) return setErr('کلید فقط ارقام ۱ تا ۴ (و ۰ برای نامعلوم).'); if (r.values.length > to - from + 1) return setErr(`کلید ${fa(r.values.length)} رقم است ولی بازه ${fa(to - from + 1)} تست.`); r.values.forEach((v, i) => { keys[from + i] = v || null; }); }
    upd(bb => ({ ...bb, nodes: bb.nodes.map(n => n.id === edit.id ? { ...n, qStart: from, qEnd: to } : n), keys: { ...bb.keys, ...keys } }));
    setEdit(null);
  };
  return (
    <div>
      <Head kicker="کتاب‌ها" title="قفسه و کلیدها" />
      <div className="mb-5 flex flex-wrap gap-2">{s.books.map(x => <Chip key={x.id} active={x.id === bid} onClick={() => { setBid(x.id); setEdit(null); }}>{x.title}، {x.publisher}</Chip>)}</div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="max-h-[66vh] overflow-auto">
            {b.nodes.filter(n => n.kind !== 'theory').map(n => {
              const isLeaf = n.isLeaf; const editing = edit?.id === n.id;
              if (!isLeaf) return <p key={n.id} className={`${n.depth === 0 ? 'mt-4 text-[17px] font-black text-[var(--ink)]' : 'mt-2 text-[15px] font-bold text-[var(--pencil)]'}`} style={{ paddingRight: n.depth * 14 }}>{n.title}</p>;
              let k = 0; if (n.qStart != null) for (let q = n.qStart; q <= n.qEnd; q++) if (b.keys[q]) k++;
              return (
                <div key={n.id} style={{ paddingRight: n.depth * 14 }} className="border-b border-[var(--rule)] py-2">
                  <div className="flex flex-wrap items-center gap-3">
                    {n.kind === 'topic' && <input type="checkbox" aria-label={`خوانده‌شده: ${n.title}`} checked={!!taught[n.id]} onChange={() => toggleTaught(n.id)} className="h-5 w-5 accent-[var(--ink)]" />}
                    <span className="flex-1 text-[15px]">{n.title}</span>
                    <span className="text-[14px] text-[var(--pencil)]">{n.qStart != null ? `${fa(n.qStart)}–${fa(n.qEnd)}، کلید ${fa(k)}/${fa(n.qEnd - n.qStart + 1)}` : 'بدون بازه'}</span>
                    <Btn kind="ghost" className="min-h-[34px] px-3 text-[14px]" onClick={() => setEdit({ id: n.id, from: n.qStart ?? '', to: n.qEnd ?? '', keys: '' })}>ویرایش</Btn>
                  </div>
                  {editing && (
                    <div className="mt-3 grid gap-3 rounded-[12px] bg-[var(--wash)] p-3">
                      <div className="flex items-center gap-2 text-[15px]">از <input aria-label="از" inputMode="numeric" className="w-20 rounded-[8px] border-2 border-[var(--rule)] bg-[var(--paper)] px-2 py-1.5 text-center" value={fa(edit.from)} onChange={e => setEdit({ ...edit, from: E.normalizeDigits(e.target.value) })} />
                        تا <input aria-label="تا" inputMode="numeric" className="w-20 rounded-[8px] border-2 border-[var(--rule)] bg-[var(--paper)] px-2 py-1.5 text-center" value={fa(edit.to)} onChange={e => setEdit({ ...edit, to: E.normalizeDigits(e.target.value) })} /></div>
                      <label className="text-[14px]">کلید پشت هم (از اولین تست بازه):
                        <input dir="ltr" inputMode="numeric" className="mt-1 w-full rounded-[8px] border-2 border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-center tracking-[0.25em]" placeholder="۳۱۴۲۲۳۱۴۴۱" value={fa(edit.keys)} onChange={e => setEdit({ ...edit, keys: E.normalizeDigits(e.target.value) })} /></label>
                      {err && <p role="alert" className="text-[14px] font-bold text-[var(--bad)]">{err}</p>}
                      <div className="flex gap-2"><Btn onClick={saveEdit}>ذخیره</Btn><Btn kind="ghost" onClick={() => { setEdit(null); setErr(''); }}>لغو</Btn></div>
                    </div>)}
                </div>);
            })}
          </div>
        </Card>
        <div className="grid content-start gap-4">
          <Card>
            <p className="text-[16px] font-black">{b.title}، {b.publisher}</p>
            <p className="mt-3 text-[14px] text-[var(--pencil)]">بازه‌گذاری {fa(withRange.length)} از {fa(ls.length)} مبحث</p><Meter value={withRange.length} max={ls.length} />
            <p className="mt-3 text-[14px] text-[var(--pencil)]">کامل بودن کلید {fa(keyed)} از {fa(totalQ)} تست</p><Meter value={keyed} max={totalQ || 1} color="var(--ok)" />
            <p className="mt-3 text-[14px] text-[var(--pencil)]">خوانده‌شده {fa(Object.values(taught).filter(Boolean).length)} مبحث</p>
          </Card>
          <Card><p className="text-[14px] leading-7 text-[var(--pencil)]">تیک = مبحث را خوانده‌ای. پیش‌بینی آزمون از همین تیک‌ها «نخوانده» و «نزده» را جدا می‌کند. تست‌هایی که کلید ندارند هنگام وارد شدن کلید خودکار تصحیح می‌شوند.</p></Card>
        </div>
      </div>
    </div>
  );
}
