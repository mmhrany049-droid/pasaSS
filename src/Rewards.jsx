import { useMemo, useState } from 'react';
import * as E from './engine.js';
import { attemptsOf, rewardSummary, questsFor, uid, todayStr } from './store.js';
import { Btn, Card, Head, Meter, fa, jShort } from './ui.jsx';

export default function Rewards({ s, set }) {
  const atts = useMemo(() => attemptsOf(s), [s]);
  const r = rewardSummary(s); const quests = questsFor(s, atts);
  const [msg, setMsg] = useState(''); const [item, setItem] = useState({ title: '', price: '' });
  const redeem = it => { if (r.coins < it.price) return setMsg(`هنوز ${fa(it.price - r.coins)} سکه کم داری.`); set(x => ({ ...x, redemptions: [...x.redemptions, { id: uid(), itemId: it.id, price: it.price, at: new Date().toISOString() }] })); setMsg(`نوش جانت: ${it.title} 🎉`); };
  const add = () => { const p = +E.normalizeDigits(item.price); if (!item.title.trim() || !p) return; set(x => ({ ...x, shop: [...x.shop, { id: uid(), title: item.title, emoji: '⭐', price: p }] })); setItem({ title: '', price: '' }); };
  const swap = () => set(x => ({ ...x, swaps: { ...x.swaps, [todayStr()]: (x.swaps[todayStr()] || 0) + 1 } }));
  return (
    <div>
      <Head kicker="پاداش" title={`سطح ${fa(r.level)}`}>
        <div className="text-left"><p className="text-[40px] font-black leading-none text-[var(--amber)]">{fa(r.coins)}</p><p className="text-[14px] text-[var(--pencil)]">سکه قابل خرج</p></div>
      </Head>
      <Card className="mb-5"><div className="mb-2 flex justify-between text-[14px]"><span>{fa(r.xp)} امتیاز تجربه</span><span>سطح بعد: {fa(r.next)}</span></div><Meter value={r.xp - r.prev} max={r.next - r.prev} h={14} /><p className="mt-2 text-[14px] text-[var(--pencil)]">ثبات: {fa(r.consistency)} روز فعال از ۱۴ روز اخیر، زنجیره سخت نداریم؛ جا انداختن یک روز چیزی را خراب نمی‌کند.</p></Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between"><p className="text-[16px] font-black">ماموریت‌های امروز</p>{!s.swaps[todayStr()] && <Btn kind="ghost" className="min-h-[34px] text-[14px]" onClick={swap}>عوض کن</Btn>}</div>
          <ul className="grid gap-3">{quests.map(q => <li key={q.id} className="rounded-[12px] bg-[var(--wash)] p-3"><div className="mb-2 flex justify-between gap-2 text-[15px]"><b>{q.done ? '✅ ' : ''}{q.title}</b><span className="shrink-0 text-[14px] text-[var(--pencil)]">{fa(q.xp)} امتیاز و {fa(q.coins)} سکه</span></div><Meter value={Math.min(q.progress, q.target)} max={q.target} color={q.done ? 'var(--ok)' : 'var(--ink)'} h={6} /><p className="mt-1 text-[13px] text-[var(--pencil)]">{fa(Math.min(q.progress, q.target))} از {fa(q.target)}</p></li>)}</ul>
          <p className="mt-4 text-[13px] leading-6 text-[var(--pencil)]">امتیاز فقط برای رفتارهایی که یادگیری می‌سازند: تحلیل خطا، تست مخلوط، مرور و پیشرفت. برای «تعداد زیاد تست» یا «سرعت» امتیاز نمی‌دهیم.</p>
        </Card>
        <Card>
          <p className="mb-3 text-[16px] font-black">فروشگاه پاداش خودت</p>
          <ul className="grid gap-2">{s.shop.map(it => <li key={it.id} className="flex items-center justify-between gap-2 rounded-[12px] bg-[var(--wash)] px-3 py-2"><span className="text-[15px]">{it.emoji} {it.title}</span><Btn kind={r.coins >= it.price ? 'solid' : 'line'} className="min-h-[36px] px-3 text-[14px]" onClick={() => redeem(it)}>{fa(it.price)} سکه</Btn></li>)}</ul>
          {msg && <p role="status" className="mt-3 text-[15px] font-bold text-[var(--ink-deep)]">{msg}</p>}
          <div className="mt-4 flex flex-wrap gap-2"><input aria-label="عنوان پاداش" placeholder="پاداش جدید" className="min-w-0 flex-1 rounded-[10px] border-2 border-[var(--rule)] bg-[var(--paper)] px-3 py-2" value={item.title} onChange={e => setItem({ ...item, title: e.target.value })} /><input aria-label="قیمت" inputMode="numeric" placeholder="قیمت" className="w-24 rounded-[10px] border-2 border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-center" value={fa(item.price)} onChange={e => setItem({ ...item, price: E.normalizeDigits(e.target.value) })} /><Btn kind="soft" onClick={add}>افزودن</Btn></div>
          <p className="mt-2 text-[13px] text-[var(--pencil)]">پیشنهاد قیمت: هر دقیقه تفریح = ۳ دقیقه مطالعه. هر دقیقه مطالعه ثبت‌شده = ۱ سکه.</p>
        </Card>
      </div>
      <Card className="mt-5"><p className="mb-3 text-[16px] font-black">از کجا آمد؟</p><ul className="grid max-h-[36vh] gap-1 overflow-auto text-[14px]">{[...r.ev].filter(e => e.xp || e.coins || e.kind === 'flagged').sort((a, z) => z.at.localeCompare(a.at)).slice(0, 40).map((e, i) => <li key={i} className="flex justify-between border-b border-[var(--rule)] py-1.5"><span>{jShort(e.at)}، {e.fa}</span><span className="text-[var(--pencil)]">{[e.xp ? `${fa(e.xp)} امتیاز` : '', e.coins >= 1 ? `${fa(Math.floor(e.coins))} سکه` : ''].filter(Boolean).join(' و ')}</span></li>)}</ul></Card>
    </div>
  );
}
