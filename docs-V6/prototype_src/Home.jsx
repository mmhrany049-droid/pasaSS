import { useMemo, useState } from 'react';
import * as E from './engine.js';
import { attemptsOf, bookById, questsFor, rewardSummary, examForecast, withDemo, initialState, todayStr } from './store.js';
import { ReasonList } from './Practice.jsx';
import { Btn, Card, Meter, Empty, fa, pct, jDate } from './ui.jsx';

export default function Home({ s, set, go }) {
  const atts = useMemo(() => attemptsOf(s), [s]);
  const r = rewardSummary(s, atts); const quests = questsFor(s, atts);
  const exam = [...s.exams].filter(e => e.date >= todayStr()).sort((a, z) => a.date.localeCompare(z.date))[0];
  const fc = useMemo(() => exam ? examForecast(s, exam, atts, { runs: 1500 }) : null, [exam, atts]);
  const open = s.errorTasks.filter(t => t.status === 'open');
  const [task, setTask] = useState(null);
  const todayPlan = s.exams.find(e => e.planApproved)?.plan?.find(d => d.date === todayStr());
  const empty = !s.sessions.length;
  return (
    <div>
      <header className="mb-8 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <p className="mb-2 text-[15px] font-bold text-[var(--ink)]">{jDate(new Date().toISOString())}</p>
          <h1 className="text-[44px] font-black leading-[1.05] tracking-[-0.03em] sm:text-[64px]">{exam ? <>{fa(fc?.daysLeft ?? 0)} روز تا<br /><span className="text-[var(--ink)]">{exam.title}</span></> : <>امروز چند تست<br /><span className="text-[var(--ink)]">می‌زنی؟</span></>}</h1>
          <div className="mt-6 flex flex-wrap gap-3"><Btn className="min-h-[52px] px-6 text-[17px]" onClick={() => go('practice')}>📝 ثبت تست</Btn><Btn kind="line" className="min-h-[52px]" onClick={() => go('assistant')}>از دستیار بپرس</Btn></div>
        </div>
        {fc && <Card><p className="text-[15px] font-bold">شاخص آمادگی</p><p className="text-[56px] font-black leading-none text-[var(--ink)]">{fa(Math.round(fc.RI))}<span className="text-[20px] text-[var(--pencil)]"> / ۱۰۰</span></p>
          <p className="mt-3 text-[15px]">پیش‌بینی کل: <b>{fa(Math.round(fc.sim.total.P10))} تا {fa(Math.round(fc.sim.total.P90))}٪</b></p>
          <p className="text-[14px] text-[var(--pencil)]">نخوانده {fa(fc.gaps.untaught.length)}، نزده {fa(fc.gaps.untested.length)}، در حال فراموشی {fa(fc.gaps.fading.length)}</p>
          <Btn kind="soft" className="mt-4" onClick={() => go('exam')}>آمادگی و برنامه</Btn></Card>}
      </header>
      {empty && <Card className="mb-5"><Empty title="هنوز جلسه‌ای ثبت نشده" text="اولین تست‌ها را ثبت کن، یا برای دیدن همه قابلیت‌ها با داده نمونه (۳۴ جلسه، یک آزمون در ۹ روز آینده) شروع کن. داده نمونه بعداً با یک دکمه پاک می‌شود." action={<div className="flex gap-2"><Btn onClick={() => go('practice')}>ثبت اولین تست</Btn><Btn kind="line" onClick={() => set(() => withDemo())}>داده نمونه</Btn></div>} /></Card>}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <p className="mb-3 text-[16px] font-black">کارهای امروز</p>
          <ul className="grid gap-2">
            {todayPlan?.items.map((it, i) => <li key={'p' + i} className="rounded-[10px] bg-[var(--wash)] px-3 py-2 text-[14px]">{it.title} <span className="text-[var(--pencil)]">، {fa(it.minutes)} دقیقه</span></li>)}
            {open.map(t => { const ses = s.sessions.find(x => x.id === t.sessionId); const b = ses && bookById(s, ses.bookId); return ses && <li key={t.id}><button type="button" onClick={() => setTask(task === t.id ? null : t.id)} className="w-full rounded-[10px] bg-[var(--wash)] px-3 py-2 text-right text-[14px]">🧩 تحلیل خطای جلسه {b.subject} ({fa(Object.keys(ses.answers).length)} تست)</button>
              {task === t.id && <div className="mt-2 max-h-[40vh] overflow-auto rounded-[10px] border-2 border-[var(--rule)] p-3"><ReasonList ses={ses} wrong={Object.keys(ses.answers).map(Number).filter(n => ['W', 'B'].includes(E.correct(ses.answers[n], b.keys[n] ?? null)))} res={n => E.correct(ses.answers[n], b.keys[n] ?? null)} setReason={(n, rid) => set(x => ({ ...x, sessions: x.sessions.map(z => z.id !== ses.id ? z : { ...z, reasons: { ...z.reasons, [n]: (z.reasons[n] || []).includes(rid) ? z.reasons[n].filter(q => q !== rid) : [...(z.reasons[n] || []), rid] } }) }))} />
                <Btn className="w-full" onClick={() => { set(x => ({ ...x, errorTasks: x.errorTasks.map(z => z.id === t.id ? { ...z, status: 'done', doneAt: new Date().toISOString() } : z) })); setTask(null); }}>بستن (+۵ امتیاز)</Btn></div>}</li>; })}
            {!todayPlan && !open.length && <li className="text-[15px] text-[var(--pencil)]">کار بازی نیست. برنامه آمادگی را از صفحه آزمون بساز.</li>}
          </ul>
        </Card>
        <Card>
          <p className="mb-3 text-[16px] font-black">ماموریت‌ها</p>
          <ul className="grid gap-3">{quests.map(q => <li key={q.id}><div className="mb-1 flex justify-between gap-2 text-[14px]"><span>{q.done ? '✅ ' : ''}{q.title}</span><span className="shrink-0 text-[var(--pencil)]">{fa(Math.min(q.progress, q.target))}/{fa(q.target)}</span></div><Meter value={Math.min(q.progress, q.target)} max={q.target} color={q.done ? 'var(--ok)' : 'var(--ink)'} h={6} /></li>)}</ul>
        </Card>
        <Card>
          <p className="mb-1 text-[16px] font-black">سطح {fa(r.level)}، {fa(r.coins)} سکه</p>
          <Meter value={r.xp - r.prev} max={r.next - r.prev} />
          <p className="mt-2 text-[14px] text-[var(--pencil)]">{fa(r.next - r.xp)} امتیاز تا سطح بعد، {fa(r.consistency)} روز فعال از ۱۴</p>
          <Btn kind="soft" className="mt-4" onClick={() => go('rewards')}>فروشگاه پاداش</Btn>
        </Card>
      </div>
      {s.demo && <p className="mt-6 text-[14px] text-[var(--pencil)]">داری داده نمونه را می‌بینی. <button type="button" className="font-bold text-[var(--ink)] underline" onClick={() => set(() => initialState())}>پاک کردن و شروع واقعی</button></p>}
    </div>
  );
}
