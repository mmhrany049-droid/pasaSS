import { useState } from 'react';
import * as E from './engine.js';
import { leaves, label, uid, todayStr } from './store.js';
import { Btn, Card, Head, Empty, fa, pct, jShort } from './ui.jsx';

const inp = 'w-full rounded-[10px] border-2 border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-[15px]';
const num = v => { const n = +E.normalizeDigits(v); return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0; };

/** History import L1 (spec 33): old tests as counts → staging → preview → commit as a batch with undo. */
export default function History({ s, set }) {
  const [bid, setBid] = useState(s.books.find(b => b.active !== false)?.id);
  const b = s.books.find(x => x.id === bid);
  const ls = b ? leaves(b) : [];
  const [f, setF] = useState({ nodeId: '', date: todayStr(), C: '', W: '', B: '' });
  const [stage, setStage] = useState([]);
  const C = num(f.C), W = num(f.W), Bl = num(f.B), N = C + W + Bl;
  const ok = f.nodeId && N > 0 && f.date <= todayStr();
  const add = () => { setStage(st => [...st, { id: uid(), bookId: bid, nodeId: f.nodeId, date: f.date, counts: { C, W, B: Bl } }]); setF({ ...f, C: '', W: '', B: '' }); };
  const commit = () => {
    const batchId = uid();
    const ses = stage.map(r => ({ id: uid(), legacy: true, batchId, bookId: r.bookId, nodeId: r.nodeId, counts: r.counts, answers: {}, reasons: {}, at: new Date(r.date + 'T12:00:00').toISOString(), mixed: false }));
    set(x => ({ ...x, sessions: [...x.sessions, ...ses], historyBatches: [...(x.historyBatches || []), { id: batchId, at: new Date().toISOString(), count: ses.length, q: ses.reduce((a, z) => a + z.counts.C + z.counts.W + z.counts.B, 0) }] }));
    setStage([]);
  };
  const undo = id => set(x => ({ ...x, sessions: x.sessions.filter(z => z.batchId !== id), historyBatches: x.historyBatches.filter(z => z.id !== id) }));
  const bookOf = id => s.books.find(x => x.id === id);
  return (
    <div>
      <Head kicker="ورود سابقه" title="تست‌های قبلی" />
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card>
          <p className="mb-1 text-[16px] font-black">یک ردیف از دفترت</p>
          <p className="mb-4 text-[14px] text-[var(--pencil)]">فقط تعداد درست، غلط و نزده. وزن این داده‌ها در تحلیل کمتر از جلسه‌های کامل است.</p>
          <div className="grid gap-3">
            <label className="text-[15px] font-bold">درس<select className={inp + ' mt-1 font-normal'} value={bid} onChange={e => { setBid(e.target.value); setF({ ...f, nodeId: '' }); }}>{s.books.map(x => <option key={x.id} value={x.id}>{x.subject} · {x.title}</option>)}</select></label>
            <label className="text-[15px] font-bold">مبحث<select className={inp + ' mt-1 font-normal'} value={f.nodeId} onChange={e => setF({ ...f, nodeId: e.target.value })}><option value="">انتخاب کن</option>{ls.map(n => <option key={n.id} value={n.id}>{label(b, n)}</option>)}</select></label>
            <label className="text-[15px] font-bold">تاریخ تقریبی<input type="date" max={todayStr()} className={inp + ' mt-1 font-normal'} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></label>
            <div className="grid grid-cols-3 gap-2">{[['C', 'درست', 'var(--ok)'], ['W', 'غلط', 'var(--bad)'], ['B', 'نزده', 'var(--pencil)']].map(([k, t, c]) =>
              <label key={k} className="text-[15px] font-bold" style={{ color: c }}>{t}<input inputMode="numeric" className={inp + ' mt-1 text-center text-[var(--graphite)]'} value={f[k] === '' ? '' : fa(num(f[k]))} onChange={e => setF({ ...f, [k]: e.target.value })} /></label>)}</div>
            <div className="flex items-center justify-between gap-3"><span className="text-[15px] text-[var(--pencil)]">{N ? <>درصد: <b className="text-[var(--graphite)]">{pct(E.percent(C, W, N))}</b></> : ''}</span><Btn disabled={!ok} onClick={add}>افزودن به پیش‌نمایش</Btn></div>
          </div>
        </Card>
        <Card>
          <p className="mb-3 text-[16px] font-black">پیش‌نمایش ({fa(stage.length)})</p>
          {!stage.length ? <p className="text-[15px] text-[var(--pencil)]">هنوز چیزی اضافه نکرده‌ای. تا «ثبت» نزنی، چیزی وارد داده‌ها نمی‌شود.</p> : <>
            <ul className="mb-4 grid max-h-[40vh] gap-2 overflow-auto">{stage.map(r => { const bb = bookOf(r.bookId); const n = bb.nodes.find(x => x.id === r.nodeId); const c = r.counts; return (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-[10px] bg-[var(--wash)] px-3 py-2 text-[14px]"><span>{bb.subject}، {label(bb, n)} · {jShort(r.date)}</span><span className="flex shrink-0 items-center gap-3">{fa(c.C)}/{fa(c.W)}/{fa(c.B)} · {pct(E.percent(c.C, c.W, c.C + c.W + c.B))}<button type="button" aria-label="حذف ردیف" className="font-bold text-[var(--pencil)]" onClick={() => setStage(st => st.filter(z => z.id !== r.id))}>×</button></span></li>); })}</ul>
            <Btn onClick={commit}>ثبت {fa(stage.length)} ردیف</Btn></>}
        </Card>
      </div>
      <Card className="mt-5">
        <p className="mb-3 text-[16px] font-black">دسته‌های ثبت‌شده</p>
        {!(s.historyBatches || []).length ? <Empty title="هنوز سابقه‌ای وارد نشده" /> :
          <ul className="grid gap-2">{[...s.historyBatches].reverse().map(h => <li key={h.id} className="flex items-center justify-between rounded-[10px] bg-[var(--wash)] px-3 py-2 text-[14px]"><span>{jShort(h.at)}: {fa(h.count)} ردیف، {fa(h.q)} تست</span><Btn kind="ghost" className="min-h-[34px]" onClick={() => undo(h.id)}>برگرداندن</Btn></li>)}</ul>}
      </Card>
    </div>
  );
}
