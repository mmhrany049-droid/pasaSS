import { useMemo, useState } from 'react';
import * as E from './engine.js';
import { attemptsOf, examForecast, buildPrepPlan, leaves, uid, todayStr, DAY, label } from './store.js';
import { Btn, Card, Chip, Head, Meter, Interval, Empty, fa, jDate, jShort } from './ui.jsx';

export default function Exam({ s, set }) {
  const [sel, setSel] = useState(s.exams[0]?.id ?? null);
  const [creating, setCreating] = useState(!s.exams.length);
  const exam = s.exams.find(e => e.id === sel);
  return (
    <div>
      <Head kicker="پیش‌بینی و آمادگی" title={exam && !creating ? exam.title : 'آزمون جدید'}>
        <div className="flex flex-wrap gap-2">
          {s.exams.map(e => <Chip key={e.id} active={e.id === sel && !creating} onClick={() => { setSel(e.id); setCreating(false); }}>{e.title}</Chip>)}
          <Chip active={creating} onClick={() => setCreating(true)}>+ آزمون</Chip>
        </div>
      </Head>
      {creating ? <ExamForm s={s} onSave={e => { set(x => ({ ...x, exams: [...x.exams, e] })); setSel(e.id); setCreating(false); }} /> : exam ? <Forecast s={s} set={set} exam={exam} /> : null}
    </div>
  );
}

function ExamForm({ s, onSave }) {
  const [title, setTitle] = useState('آزمون قلمچی');
  const [date, setDate] = useState(todayStr(new Date(Date.now() + 10 * DAY)));
  const [target, setTarget] = useState(60);
  const [sections, setSections] = useState(s.books.map(b => ({ bookId: b.id, count: 0, nodeIds: [] })));
  const upd = (i, patch) => setSections(ss => ss.map((x, j) => j === i ? { ...x, ...patch } : x));
  const ok = sections.some(x => x.count > 0 && x.nodeIds.length) && title.trim();
  return (
    <div className="grid gap-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-[15px] font-bold">عنوان<input className="mt-1 w-full rounded-[10px] border-2 border-[var(--rule)] bg-[var(--paper)] px-3 py-2 font-normal" value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label className="text-[15px] font-bold">تاریخ<input type="date" className="mt-1 w-full rounded-[10px] border-2 border-[var(--rule)] bg-[var(--paper)] px-3 py-2 font-normal" value={date} onChange={e => setDate(e.target.value)} /><span className="text-[13px] font-normal text-[var(--pencil)]">{jDate(date)}</span></label>
          <label className="text-[15px] font-bold">درصد هدف<input inputMode="numeric" className="mt-1 w-full rounded-[10px] border-2 border-[var(--rule)] bg-[var(--paper)] px-3 py-2 font-normal" value={fa(target)} onChange={e => setTarget(+E.normalizeDigits(e.target.value) || 0)} /></label>
        </div>
      </Card>
      <p className="text-[16px] font-black">بودجه‌بندی: هر درس چند سؤال و از کدام مباحث؟</p>
      <div className="grid gap-4 lg:grid-cols-3">
        {sections.map((sec, i) => { const b = s.books.find(x => x.id === sec.bookId); const ls = leaves(b).filter(n => n.kind === 'topic'); return (
          <Card key={sec.bookId}>
            <div className="mb-3 flex items-center justify-between gap-2"><p className="text-[16px] font-black">{b.subject}</p>
              <label className="flex items-center gap-2 text-[14px]">تعداد سؤال<input inputMode="numeric" aria-label={`تعداد سؤال ${b.subject}`} className="w-16 rounded-[8px] border-2 border-[var(--rule)] bg-[var(--paper)] px-2 py-1 text-center" value={fa(sec.count)} onChange={e => upd(i, { count: Math.min(100, +E.normalizeDigits(e.target.value) || 0) })} /></label></div>
            <div className="mb-2 flex gap-2"><Btn kind="soft" className="min-h-[32px] px-3 text-[13px]" onClick={() => upd(i, { nodeIds: ls.map(n => n.id) })}>همه</Btn><Btn kind="soft" className="min-h-[32px] px-3 text-[13px]" onClick={() => upd(i, { nodeIds: ls.filter(n => s.taught[b.id]?.[n.id]).map(n => n.id) })}>فقط خوانده‌ها</Btn><Btn kind="ghost" className="min-h-[32px] px-3 text-[13px]" onClick={() => upd(i, { nodeIds: [] })}>هیچ</Btn></div>
            <div className="max-h-[40vh] overflow-auto">{ls.map(n => <label key={n.id} className="flex items-center gap-2 py-1 text-[14px]"><input type="checkbox" className="h-4 w-4 accent-[var(--ink)]" checked={sec.nodeIds.includes(n.id)} onChange={() => upd(i, { nodeIds: sec.nodeIds.includes(n.id) ? sec.nodeIds.filter(x => x !== n.id) : [...sec.nodeIds, n.id] })} />{label(b, n)}</label>)}</div>
            <p className="mt-2 text-[13px] text-[var(--pencil)]">{fa(sec.nodeIds.length)} مبحث انتخاب شد</p>
          </Card>); })}
      </div>
      <div><Btn disabled={!ok} onClick={() => onSave({ id: uid(), title, date, target, sections: sections.filter(x => x.count > 0 && x.nodeIds.length) })}>ساخت و پیش‌بینی</Btn></div>
    </div>
  );
}

const TABS = [['untaught', 'نخوانده'], ['untested', 'نزده'], ['weak', 'ضعیف'], ['fading', 'در حال فراموشی'], ['openErrors', 'خطاهای باز']];

function Forecast({ s, set, exam }) {
  const atts = useMemo(() => attemptsOf(s), [s.sessions, s.books]);
  const fc = useMemo(() => examForecast(s, exam, atts), [s, exam, atts]);
  const [tab, setTab] = useState('untested');
  const [plan, setPlan] = useState(null);
  if (!fc) return <Empty title="بودجه‌بندی خالی است" text="حداقل یک درس با تعداد سؤال و مبحث لازم است." />;
  const comps = [['A', 'درصد پیش‌بینی به هدف', 0.40], ['Cov', 'پوشش مباحث تست‌شده', 0.25], ['Ret', 'ماندگاری تا روز آزمون', 0.15], ['Mock', 'تمرین شرایط آزمون', 0.10], ['Err', 'تحلیل خطاهای باز', 0.10]];
  const list = fc.gaps[tab];
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card>
          <p className="text-[15px] font-bold text-[var(--pencil)]">{jDate(exam.date)}، {fa(fc.daysLeft)} روز مانده</p>
          <p className="mt-2 text-[15px] font-bold">شاخص آمادگی</p>
          <p className="text-[64px] font-black leading-none text-[var(--ink)]">{fa(Math.round(fc.RI))}<span className="text-[22px] text-[var(--pencil)]"> / ۱۰۰</span></p>
          <ul className="mt-4 grid gap-3">{comps.map(([k, t, w]) => <li key={k}><div className="mb-1 flex justify-between text-[14px]"><span>{t} <span className="text-[var(--pencil)]">(وزن {fa(w * 100)}٪)</span></span><b>{fa(Math.round(fc.comps[k] * 100))}٪</b></div><Meter value={fc.comps[k]} h={7} /></li>)}</ul>
        </Card>
        <Card>
          <p className="mb-1 text-[16px] font-black">درصد احتمالی هر درس</p>
          <p className="mb-4 text-[14px] text-[var(--pencil)]">نوار = ۸۰٪ محتمل‌ترین بازه، خط پررنگ = میانه، خط نازک = هدف. فراموشی تا روز آزمون و مباحث نزده حساب شده‌اند.</p>
          <ul className="grid gap-5">
            {[...Object.entries(fc.sim.sections), ['کل', fc.sim.total]].map(([k, v]) => {
              const low = k !== 'کل' && (fc.subjAtt[k] || 0) < 30; const width = v.P90 - v.P10;
              return (
                <li key={k}>
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                    <span className={`text-[16px] ${k === 'کل' ? 'font-black' : 'font-bold'}`}>{k}</span>
                    <span className="text-[16px]"><b>{fa(Math.round(v.P10))} تا {fa(Math.round(v.P90))}</b>{!low && <span className="text-[14px] text-[var(--pencil)]">، میانه {fa(Math.round(v.P50))}</span>}
                      <span className="mr-2 rounded bg-[var(--wash)] px-2 text-[12px] text-[var(--ink-deep)]">{low ? 'کم‌داده' : width <= 10 ? 'دقیق' : width <= 20 ? 'متوسط' : 'تقریبی'}</span></span>
                  </div>
                  <Interval {...v} target={exam.target} />
                </li>);
            })}
          </ul>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex flex-wrap gap-2">{TABS.map(([k, t]) => <Chip key={k} active={tab === k} onClick={() => setTab(k)}>{t}، {fa(fc.gaps[k].length)}</Chip>)}</div>
          {!list.length ? <p className="text-[15px] text-[var(--pencil)]">موردی نیست 👌</p> :
            <ul className="grid max-h-[46vh] gap-2 overflow-auto">{tab === 'openErrors' ? list.slice(0, 60).map((a, i) => <li key={i} className="flex justify-between rounded-[10px] bg-[var(--wash)] px-3 py-2 text-[14px]"><span>{a.subject}، تست {fa(a.num)}</span><span className="text-[var(--pencil)]">{a.result === 'W' ? 'غلط' : 'نزده'}{a.reasons.length ? '' : '، بدون تحلیل'}</span></li>) :
              list.map((g, i) => <li key={i} className="flex justify-between gap-2 rounded-[10px] bg-[var(--wash)] px-3 py-2 text-[14px]"><span>{g.b.subject}، {label(g.b, g.node)}</span><span className="shrink-0 text-[var(--pencil)]">{tab === 'weak' ? `تسلط ${fa(Math.round(g.m.pC * 100))}٪` : tab === 'fading' ? `ماندگاری ${fa(Math.round(g.R * 100))}٪` : `≈ ${fa(g.q)} سؤال`}</span></li>)}</ul>}
        </Card>
        <Card>
          <p className="mb-1 text-[16px] font-black">اولویت‌ها (درصد بیشتر در دقیقه کمتر)</p>
          <ul className="mb-4 grid gap-2">{fc.actions.slice(0, 6).map((a, i) => <li key={i} className="grid grid-cols-[1fr_auto] gap-2 text-[14px]"><span><b>{a.kind}</b>، {a.t.section}، {label(a.t.b, a.t.node)}</span><span className="text-[var(--ok)]">+{fa(a.gain.toFixed(1))} در {fa(a.minutes)} دقیقه</span></li>)}</ul>
          <Btn onClick={() => setPlan(buildPrepPlan(s, exam, fc))}>ساخت پیش‌نویس برنامه آمادگی</Btn>
          <p className="mt-2 text-[13px] text-[var(--pencil)]">با {fa(s.settings.dailyMin)} دقیقه در روز، تا تأیید نکنی چیزی برنامه‌ریزی نمی‌شود.</p>
        </Card>
      </div>
      {plan && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-[18px] font-black">پیش‌نویس برنامه آمادگی</p>
            <div className="flex gap-2"><Btn onClick={() => { set(x => ({ ...x, exams: x.exams.map(e => e.id === exam.id ? { ...e, plan, planApproved: true } : e) })); setPlan(null); }}>تأیید برنامه</Btn><Btn kind="ghost" onClick={() => setPlan(null)}>دور بینداز</Btn></div></div>
          <PlanGrid plan={plan} />
        </Card>)}
      {!plan && exam.planApproved && <Card><p className="mb-4 text-[18px] font-black">برنامه آمادگی تأییدشده</p><PlanGrid plan={exam.plan} /></Card>}
    </div>
  );
}

function PlanGrid({ plan }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{plan.map(d => <div key={d.date} className="rounded-[12px] bg-[var(--wash)] p-3"><p className="mb-2 text-[14px] font-black text-[var(--ink)]">{jDate(d.date)}</p><ul className="grid gap-1.5">{d.items.map((it, i) => <li key={i} className="text-[14px] leading-6">{it.title} <span className="text-[var(--pencil)]">، {fa(it.minutes)} دقیقه</span></li>)}</ul></div>)}</div>;
}
