import { useState } from 'react';
import { users, currentUserId, addUser, switchUser, renameUser, removeUser, ensureFirstUser } from './profiles.js';
import { buildPack, applyBulletin, downloadJson, readJsonFile } from './exchange.js';
import { httpTransport } from './sync/transport.js';
import { load, initialState, save, todayStr } from './store.js';
import { GRADES, GRADE_FA, STREAMS } from './curriculum.js';
import { Btn, Card, Chip, Head, fa, jDate } from './ui.jsx';

const inp = 'mt-1 w-full rounded-[10px] border-2 border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-[15px] font-normal';

/** Users on this device · my school & classes · consent · send my file to the Hub · import the Hub's bulletin. */
export default function Network({ s, set, reload }) {
  ensureFirstUser();
  const [us, setUs] = useState(users()); const cur = currentUserId();
  const [newName, setNewName] = useState(''); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const me = s.me || {}; const upMe = p => set(x => ({ ...x, me: { ...x.me, ...p } }));
  const upConsent = p => upMe({ consent: { ...(me.consent || {}), ...p } });
  const schools = s.org?.schools || [], classes = s.org?.classes || [];
  const sw = id => { save(s); switchUser(id); reload(load()); setUs(users()); };
  const make = () => { if (!newName.trim()) return; save(s); const u = addUser(newName); switchUser(u.id); const fresh = { ...initialState(), me: { ...initialState().me, name: u.name } }; save(fresh); reload(fresh); setUs(users()); setNewName(''); };
  const exportPack = async () => { const p = await buildPack(s); downloadJson(p, `SS-${(me.name || 'user').replace(/\s+/g, '-')}-${todayStr()}.sspack`); set(x => ({ ...x, hub: { ...(x.hub || {}), lastPackAt: new Date().toISOString() } })); setMsg('فایل ارسال به مرکز ساخته شد. آن را برای مسئول مرکز بفرست.'); };
  const importBulletin = async e => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; setErr(''); setMsg('');
    try { const r = await applyBulletin(s, await readJsonFile(f)); if (!r.ok) return setErr(r.error); set(() => r.state);
      const m = r.summary; setMsg(`وارد شد: ${fa(m.booksNew)} کتاب جدید (غیرفعال تا خودت فعال کنی)، ${fa(m.booksUpdated)} کتاب به‌روز، ${fa(m.exams)} آزمون مشترک، ${fa(m.classes)} کلاس، ${fa(m.notices)} اطلاعیه.`);
    } catch { setErr('فایل خوانده نشد.'); }
  };
  const t = httpTransport(s.settings.syncUrl);
  const online = async kind => { setErr(''); setMsg('');
    try { if (kind === 'send') { await t.sendPack(await buildPack(s)); setMsg('بسته به سرور مرکز فرستاده شد.'); } else { const b = await t.fetchBulletin(); const r = await applyBulletin(s, b); if (!r.ok) return setErr(r.error); set(() => r.state); setMsg('آخرین اطلاع‌رسانی مرکز گرفته شد.'); } }
    catch (x) { setErr('اتصال به سرور مرکز برقرار نشد: ' + (x.message || '')); } };
  return (
    <div>
      <Head kicker="شبکه" title="کاربران، کلاس‌ها و مرکز" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-[16px] font-black">کاربران این دستگاه</p>
          <ul className="grid gap-2">{us.map(u => <li key={u.id} className={`flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 ${u.id === cur ? 'bg-[var(--ink)] text-[var(--paper)]' : 'bg-[var(--wash)]'}`}>
            <span className="font-bold">{u.name}{u.id === cur ? ' (الان)' : ''}</span>
            <span className="flex gap-2">{u.id !== cur && <Btn kind="soft" className="min-h-[32px] px-3 text-[13px]" onClick={() => sw(u.id)}>ورود</Btn>}
              {u.id !== cur && <button type="button" className="text-[13px] font-bold text-[var(--bad)]" onClick={() => { if (confirm(`همه داده‌های «${u.name}» از این دستگاه پاک شود؟`)) { removeUser(u.id); setUs(users()); } }}>حذف</button>}</span></li>)}</ul>
          <div className="mt-3 flex gap-2"><input aria-label="نام کاربر جدید" className={inp + ' mt-0'} placeholder="نام کاربر جدید" value={newName} onChange={e => setNewName(e.target.value)} /><Btn onClick={make}>افزودن</Btn></div>
          <p className="mt-2 text-[13px] text-[var(--pencil)]">هر کاربر داده جدای خودش را دارد (مثلاً دو خواهر و برادر روی یک لپ‌تاپ).</p>
        </Card>
        <Card>
          <p className="mb-3 text-[16px] font-black">من</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[15px] font-bold">نام<input className={inp} value={me.name || ''} onChange={e => { upMe({ name: e.target.value }); renameUser(cur, e.target.value); }} /></label>
            <label className="text-[15px] font-bold">مدرسه<select className={inp} value={me.schoolId || ''} onChange={e => upMe({ schoolId: e.target.value || null })}><option value="">—</option>{schools.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{GRADES.map(g => <Chip key={g} active={me.grade === g} onClick={() => upMe({ grade: g })}>{GRADE_FA[g]}</Chip>)}{Object.entries(STREAMS).map(([k, v]) => <Chip key={k} active={me.stream === k} onClick={() => upMe({ stream: k })}>{v}</Chip>)}</div>
          <p className="mt-4 text-[15px] font-bold">کلاس‌های من</p>
          {!classes.length ? <p className="text-[14px] text-[var(--pencil)]">فهرست مدرسه‌ها و کلاس‌ها از فایل اطلاع‌رسانی مرکز می‌آید.</p> :
            <div className="mt-1 flex flex-wrap gap-2">{classes.map(c => <Chip key={c.id} active={(me.classIds || []).includes(c.id)} onClick={() => upMe({ classIds: (me.classIds || []).includes(c.id) ? me.classIds.filter(x => x !== c.id) : [...(me.classIds || []), c.id] })}>{c.kind === 'school' ? '🏫' : '📚'} {c.name}</Chip>)}</div>}
          <p className="mt-2 text-[12px] text-[var(--pencil)]">عضویت نهایی را مرکز تأیید می‌کند؛ انتخاب تو به مرکز اعلام می‌شود.</p>
        </Card>
        <Card>
          <p className="mb-3 text-[16px] font-black">اجازه‌ها (با رضایت خودت)</p>
          <div className="grid gap-3 text-[15px]">
            {[['books', 'کتاب‌ها، بازه‌ها و کلیدهایی که ساخته‌ام', 'تا دیگران هم بدون وارد کردن دوباره استفاده کنند'], ['results', 'نتیجه آزمون‌های مشترک کلاس', 'برای کارنامه کلاس'], ['compare', 'آمار مباحث برای مقایسه', 'فقط آمار خلاصه هر مبحث؛ پاسخ تک‌تک تست‌ها هرگز ارسال نمی‌شود. گروه‌های کمتر از ۳ نفر منتشر نمی‌شوند.']].map(([k, t, h]) =>
              <label key={k} className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--ink)]" checked={!!me.consent?.[k]} onChange={e => upConsent({ [k]: e.target.checked })} /><span>{t}<span className="block text-[13px] text-[var(--pencil)]">{h}</span></span></label>)}
          </div>
        </Card>
        <Card>
          <p className="mb-1 text-[16px] font-black">تبادل با پروژه مرکز</p>
          <p className="mb-3 text-[14px] text-[var(--pencil)]">۱) فایل خودت را بساز و برای مرکز بفرست. ۲) فایل اطلاع‌رسانی مرکز را که گرفتی اینجا وارد کن تا کتاب‌ها، پاسخ‌نامه‌ها، بازه‌ها، کلاس‌ها، آزمون‌های مشترک و مقایسه اضافه شوند.</p>
          <div className="flex flex-wrap gap-2"><Btn onClick={exportPack}>ساخت فایل برای مرکز</Btn>
            <label className="inline-flex min-h-[42px] cursor-pointer items-center rounded-[10px] border-2 border-[var(--ink)] px-4 text-[15px] font-bold text-[var(--ink)] hover:bg-[var(--wash)]">وارد کردن اطلاع‌رسانی مرکز<input type="file" accept=".ssbulletin,.json" className="sr-only" onChange={importBulletin} /></label></div>
          {t.enabled && <div className="mt-3 flex flex-wrap gap-2"><Btn kind="soft" onClick={() => online('send')}>ارسال آنلاین</Btn><Btn kind="soft" onClick={() => online('get')}>دریافت آنلاین</Btn></div>}
          <p className="mt-3 text-[13px] text-[var(--pencil)]">{s.hub?.lastPackAt ? `آخرین ارسال: ${jDate(s.hub.lastPackAt)}` : 'هنوز فایلی نساخته‌ای.'}{s.hub?.lastBulletinAt ? ` · آخرین اطلاع‌رسانی: ${jDate(s.hub.lastBulletinAt)}${s.hub.hubName ? ` از «${s.hub.hubName}»` : ''}` : ''}</p>
          {msg && <p role="status" className="mt-2 text-[14px] font-bold text-[var(--ok)]">{msg}</p>}
          {err && <p role="alert" className="mt-2 text-[14px] font-bold text-[var(--bad)]">{err}</p>}
        </Card>
        {(s.announcements || []).length > 0 && <Card className="lg:col-span-2"><p className="mb-3 text-[16px] font-black">اطلاعیه‌های مرکز</p>
          <ul className="grid gap-2">{s.announcements.map(a => <li key={a.id} className="rounded-[10px] bg-[var(--wash)] p-3 text-[15px]"><b>{a.title}</b>{a.classId ? <span className="text-[13px] text-[var(--pencil)]"> · {classes.find(c => c.id === a.classId)?.name}</span> : null}<p className="mt-1 whitespace-pre-line">{a.text}</p><p className="mt-1 text-[12px] text-[var(--pencil)]">{jDate(a.at)}</p></li>)}</ul></Card>}
      </div>
    </div>
  );
}
