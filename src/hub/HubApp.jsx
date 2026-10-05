/* پروژه مرکز (Hub) — the owner's control room: collect students' files, manage schools/outside classes and their members,
   build the shared test-book library, define shared class exams, compare (with consent) and publish ONE bulletin file. */
import { useEffect, useMemo, useState } from 'react';
import * as H from './hubStore.js';
import { downloadJson, readJsonFile } from '../exchange.js';
import { httpTransport } from '../sync/transport.js';
import { TEXTBOOKS, textbookById, SUBJECTS, GRADES, GRADE_FA, STREAMS, textbooksFor } from '../curriculum.js';
import BookWizard from '../BookWizard.jsx';
import { Btn, Card, Chip, Head, Empty, fa, jDate, jShort } from '../ui.jsx';
import { todayStr, addDays } from '../store.js';

const inp = 'mt-1 w-full rounded-[10px] border-2 border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-[15px] font-normal';
const NAV = [['home', 'میز کار', '◉'], ['people', 'افراد', '👥'], ['classes', 'مدارس و کلاس‌ها', '🏫'], ['books', 'کتاب‌های تست', '▥'], ['exams', 'آزمون‌های مشترک', '◎'], ['compare', 'مقایسه', '▤'], ['notes', 'اطلاعیه‌ها', '📣']];
const tbTitle = ref => { const tb = TEXTBOOKS.find(t => ref.startsWith(t.id)); const n = tb?.nodes.find(x => x.id === ref); return tb ? `${tb.title}${n ? '، ' + n.title : ''}` : ref; };

export default function HubApp() {
  const [h, setH] = useState(H.loadHub); const [page, setPage] = useState('home');
  useEffect(() => { H.saveHub(h); }, [h]);
  const P = { h, setH, go: setPage };
  return (
    <div dir="rtl" lang="fa" className="ss min-h-screen bg-[var(--paper)] text-[var(--graphite)]">
      <style>{`.ss{--paper:#F2F0EC;--card:#FFFDF9;--ink:#1F5F8B;--ink-deep:#123C59;--ink-faint:#A9C6DA;--graphite:#26232B;--pencil:#57515B;--wash:#E4EEF5;--rule:#D3DFE8;--ok:#2F7D4F;--bad:#C2362B;--amber:#B9800F;font-family:Vazirmatn,system-ui,sans-serif;font-size:16px}.ss input,.ss button,.ss select,.ss textarea{font-family:inherit}`}</style>
      <div className="mx-auto flex max-w-[1400px]">
        <nav aria-label="بخش‌های مرکز" className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col gap-1 py-8 pr-4 md:flex">
          <p className="mb-6 text-[24px] font-black leading-none text-[var(--ink)]">پروژه مرکز<span className="block text-[13px] font-bold text-[var(--pencil)]">{h.name}</span></p>
          {NAV.map(([k, t, i]) => <button key={k} type="button" onClick={() => setPage(k)} aria-current={page === k ? 'page' : undefined} className={`flex min-h-[42px] items-center gap-3 rounded-l-[10px] pr-3 text-right text-[15px] font-bold ${page === k ? 'bg-[var(--ink)] text-[var(--paper)]' : 'hover:bg-[var(--wash)]'}`}><span className="w-5 text-center">{i}</span>{t}</button>)}
          <a href="./index.html" className="mt-auto text-[14px] font-bold text-[var(--pencil)] underline">← اپ دانش‌آموز</a>
        </nav>
        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-8 md:pt-10">
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">{NAV.map(([k, t]) => <Chip key={k} active={page === k} onClick={() => setPage(k)}>{t}</Chip>)}</div>
          {page === 'home' && <Desk {...P} />}
          {page === 'people' && <People {...P} />}
          {page === 'classes' && <Classes {...P} />}
          {page === 'books' && <Library {...P} />}
          {page === 'exams' && <ClassExams {...P} />}
          {page === 'compare' && <Compare {...P} />}
          {page === 'notes' && <Notes {...P} />}
        </main>
      </div>
    </div>
  );
}

function Desk({ h, setH, go }) {
  const [log, setLog] = useState([]); const [token, setToken] = useState(''); const [url, setUrl] = useState(h.serverUrl || '');
  const people = Object.values(h.people); const lib = H.libraryBooks(h);
  const importFiles = async e => {
    const fs = [...(e.target.files || [])]; e.target.value = ''; let cur = h; const out = [];
    for (const f of fs) { try { const r = await H.importPack(cur, await readJsonFile(f)); if (r.ok) { cur = r.hub; out.push(`✓ ${f.name}: ${r.name}`); } else out.push(`✗ ${f.name}: ${r.error}`); } catch { out.push(`✗ ${f.name}: خوانده نشد`); } }
    setH(cur); setLog(out);
  };
  const publish = async () => { const b = await H.buildBulletin(h); downloadJson(b, `SS-bulletin-${todayStr()}.ssbulletin`); setH(x => ({ ...x, published: [{ id: b.bulletinId, at: b.createdAt, books: b.books.length, exams: b.classExams.length }, ...x.published].slice(0, 30) })); };
  const t = httpTransport(url, { token });
  const pull = async () => { const out = []; let cur = h; try { const list = await t.listPacks(); for (const it of list.items || []) { const r = await H.importPack(cur, await t.getPack(it.id)); if (r.ok) { cur = r.hub; out.push(`✓ ${r.name}`); } } setH({ ...cur, serverUrl: url }); setLog(out.length ? out : ['فایل تازه‌ای روی سرور نبود.']); } catch (x) { setLog(['✗ ' + x.message]); } };
  const push = async () => { try { await t.publishBulletin(await H.buildBulletin(h)); setLog(['✓ اطلاع‌رسانی روی سرور منتشر شد.']); } catch (x) { setLog(['✗ ' + x.message]); } };
  return (
    <div>
      <Head kicker="پروژه مرکز" title="میز کار" />
      <div className="mb-5 grid gap-4 sm:grid-cols-4">{[['نفر', people.length, 'people'], ['کلاس', h.classes.length, 'classes'], ['کتاب در کتابخانه', lib.length, 'books'], ['آزمون مشترک', h.classExams.length, 'exams']].map(([t, v, p]) => <button key={t} type="button" onClick={() => go(p)} className="text-right"><Card><p className="text-[40px] font-black leading-none text-[var(--ink)]">{fa(v)}</p><p className="mt-1 text-[15px]">{t}</p></Card></button>)}</div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <p className="mb-1 text-[16px] font-black">۱) جمع کردن فایل‌های افراد</p>
          <p className="mb-3 text-[14px] text-[var(--pencil)]">فایل‌های .sspack که دانش‌آموزان از «کاربران، کلاس و مرکز» ساخته‌اند را اینجا وارد کن (چندتا با هم). از هر نفر فقط تازه‌ترین فایل نگه داشته می‌شود.</p>
          <label className="inline-flex min-h-[42px] cursor-pointer items-center rounded-[10px] bg-[var(--ink)] px-4 text-[15px] font-bold text-[var(--paper)]">وارد کردن فایل‌ها<input type="file" multiple accept=".sspack,.json" className="sr-only" onChange={importFiles} /></label>
          {log.length > 0 && <ul className="mt-3 grid gap-1 text-[14px]">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}
        </Card>
        <Card>
          <p className="mb-1 text-[16px] font-black">۲) ساخت فایل اطلاع‌رسانی</p>
          <p className="mb-3 text-[14px] text-[var(--pencil)]">یک فایل .ssbulletin شامل کتاب‌های تأییدشده (با پاسخ‌نامه و بازه‌ها)، مدارس و کلاس‌ها، آزمون‌های مشترک کلاس‌ها، مقایسه ناشناس (فقط با اجازه افراد، گروه‌های حداقل {fa(h.minGroup)} نفره) و اطلاعیه‌ها. همین یک فایل را برای همه بفرست.</p>
          <div className="flex flex-wrap items-center gap-3"><Btn onClick={publish}>ساخت و دانلود</Btn>
            <label className="text-[14px]">نام مرکز<input className={inp + ' mt-0 w-48'} value={h.name} onChange={e => setH(x => ({ ...x, name: e.target.value }))} /></label></div>
          {h.published.length > 0 && <p className="mt-3 text-[13px] text-[var(--pencil)]">آخرین انتشار: {jDate(h.published[0].at)} · {fa(h.published[0].books)} کتاب · {fa(h.published[0].exams)} آزمون</p>}
        </Card>
        <Card className="lg:col-span-2">
          <p className="mb-1 text-[16px] font-black">وقتی سایت روی سرور رفت (اختیاری)</p>
          <p className="mb-3 text-[14px] text-[var(--pencil)]">با server/hub-server.mjs فایل‌ها خودکار رد و بدل می‌شوند؛ همان فرمت‌ها، بدون تغییر داده.</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto_auto] sm:items-end"><label className="text-[14px] font-bold">آدرس سرور<input dir="ltr" className={inp} placeholder="https://ss.example.ir" value={url} onChange={e => setUrl(e.target.value.trim())} /></label>
            <label className="text-[14px] font-bold">رمز مدیر<input dir="ltr" type="password" className={inp} value={token} onChange={e => setToken(e.target.value)} /></label>
            <Btn kind="soft" disabled={!t.enabled} onClick={pull}>گرفتن فایل‌ها</Btn><Btn kind="soft" disabled={!t.enabled} onClick={push}>انتشار روی سرور</Btn></div>
        </Card>
      </div>
    </div>
  );
}

function People({ h, setH }) {
  const [by, setBy] = useState('school'); const [open, setOpen] = useState(null);
  const g = H.groupPeople(h);
  const Person = ({ p }) => { const pack = h.packs[p.id]; const mine = h.classes.filter(c => c.members.includes(p.id)); return (
    <li className="rounded-[10px] bg-[var(--wash)] p-3 text-[14px]">
      <button type="button" className="flex w-full items-center justify-between text-right" onClick={() => setOpen(open === p.id ? null : p.id)}><span><b className="text-[15px]">{p.name}</b> · {GRADE_FA[p.grade] || ''} {STREAMS[p.stream] || ''}</span><span className="text-[12px] text-[var(--pencil)]">{jShort(p.lastPackAt)}</span></button>
      <p className="mt-1 text-[12px] text-[var(--pencil)]">{pack?.books?.length ? `${fa(pack.books.length)} کتاب · ` : ''}{p.consent?.compare ? 'اجازه مقایسه ✓' : 'بدون اجازه مقایسه'} · {p.consent?.results ? 'نتیجه آزمون ✓' : 'بدون نتیجه'}{mine.length ? ` · ${mine.map(c => c.name).join('، ')}` : ''}</p>
      {open === p.id && <div className="mt-2 grid gap-2">
        <label className="font-bold">مدرسه<select className={inp} value={p.schoolId || ''} onChange={e => setH(x => H.setPersonSchool(x, p.id, e.target.value || null))}><option value="">—</option>{h.schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <div><p className="font-bold">کلاس‌ها</p><div className="mt-1 flex flex-wrap gap-2">{h.classes.map(c => <Chip key={c.id} active={c.members.includes(p.id)} onClick={() => setH(x => H.setMember(x, c.id, p.id, !c.members.includes(p.id)))}>{c.name}</Chip>)}</div></div>
        <button type="button" className="justify-self-start text-[13px] font-bold text-[var(--bad)]" onClick={() => confirm(`«${p.name}» و فایلش از مرکز حذف شود؟`) && setH(x => { const { [p.id]: _, ...people } = x.people; const { [p.id]: __, ...packs } = x.packs; return { ...x, people, packs, classes: x.classes.map(c => ({ ...c, members: c.members.filter(m => m !== p.id) })) }; })}>حذف از مرکز</button></div>}
    </li>); };
  if (!Object.keys(h.people).length) return <div><Head kicker="مرکز" title="افراد" /><Card><Empty title="هنوز کسی نیست" text="از میز کار فایل‌های .sspack دانش‌آموزان را وارد کن." /></Card></div>;
  return (
    <div>
      <Head kicker="مرکز" title="افراد"><div className="flex gap-2"><Chip active={by === 'school'} onClick={() => setBy('school')}>بر اساس مدرسه</Chip><Chip active={by === 'class'} onClick={() => setBy('class')}>بر اساس کلاس</Chip></div></Head>
      <div className="grid gap-5 lg:grid-cols-2">{(by === 'school' ? g.bySchool.filter(x => x.people.length).map(x => [x.school.id || 'none', x.school.name, x.people]) : g.byClass.map(x => [x.cls.id, `${x.cls.kind === 'school' ? '🏫' : '📚'} ${x.cls.name}`, x.people])).map(([id, t, ps]) =>
        <Card key={id}><p className="mb-3 text-[16px] font-black">{t} <span className="text-[13px] font-normal text-[var(--pencil)]">{fa(ps.length)} نفر</span></p><ul className="grid gap-2">{ps.map(p => <Person key={p.id} p={p} />)}</ul></Card>)}</div>
    </div>
  );
}

function Classes({ h, setH }) {
  const [sch, setSch] = useState(''); const [c, setC] = useState({ kind: 'outside', name: '', schoolId: '', institute: '', teacher: '', grade: 11, stream: 'rf', subjectIds: [] });
  const [sel, setSel] = useState(null); const cls = h.classes.find(x => x.id === sel);
  const people = Object.values(h.people);
  return (
    <div>
      <Head kicker="مرکز" title="مدارس و کلاس‌ها" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-[16px] font-black">مدرسه‌ها</p>
          <ul className="mb-3 grid gap-1">{h.schools.map(s => <li key={s.id} className="flex justify-between rounded-[8px] bg-[var(--wash)] px-3 py-1.5 text-[15px]"><span>{s.name}</span><span className="text-[13px] text-[var(--pencil)]">{fa(people.filter(p => p.schoolId === s.id).length)} نفر</span></li>)}</ul>
          <div className="flex gap-2"><input aria-label="نام مدرسه" className={inp + ' mt-0'} placeholder="نام مدرسه" value={sch} onChange={e => setSch(e.target.value)} /><Btn disabled={!sch.trim()} onClick={() => { setH(x => H.addSchool(x, sch)); setSch(''); }}>افزودن</Btn></div>
        </Card>
        <Card>
          <p className="mb-3 text-[16px] font-black">کلاس جدید</p>
          <div className="mb-2 flex gap-2"><Chip active={c.kind === 'school'} onClick={() => setC({ ...c, kind: 'school' })}>کلاس مدرسه</Chip><Chip active={c.kind === 'outside'} onClick={() => setC({ ...c, kind: 'outside' })}>کلاس بیرون (آموزشگاه)</Chip></div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-[14px] font-bold">نام کلاس<input className={inp} placeholder="مثلاً شیمی آقای …" value={c.name} onChange={e => setC({ ...c, name: e.target.value })} /></label>
            {c.kind === 'school' ? <label className="text-[14px] font-bold">مدرسه<select className={inp} value={c.schoolId} onChange={e => setC({ ...c, schoolId: e.target.value })}><option value="">—</option>{h.schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              : <label className="text-[14px] font-bold">آموزشگاه<input className={inp} value={c.institute} onChange={e => setC({ ...c, institute: e.target.value })} /></label>}
            <label className="text-[14px] font-bold">دبیر<input className={inp} value={c.teacher} onChange={e => setC({ ...c, teacher: e.target.value })} /></label>
            <label className="text-[14px] font-bold">پایه<select className={inp} value={c.grade} onChange={e => setC({ ...c, grade: +e.target.value })}>{GRADES.map(g => <option key={g} value={g}>{GRADE_FA[g]}</option>)}</select></label>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">{SUBJECTS.map(x => <Chip key={x.id} active={c.subjectIds.includes(x.id)} onClick={() => setC({ ...c, subjectIds: c.subjectIds.includes(x.id) ? c.subjectIds.filter(y => y !== x.id) : [...c.subjectIds, x.id] })}>{x.fa}</Chip>)}</div>
          <Btn className="mt-3" disabled={!c.name.trim()} onClick={() => { setH(x => H.addClass(x, c)); setC({ ...c, name: '' }); }}>ساخت کلاس</Btn>
        </Card>
        <Card className="lg:col-span-2">
          <p className="mb-3 text-[16px] font-black">کلاس‌ها و اعضا</p>
          <div className="mb-3 flex flex-wrap gap-2">{h.classes.map(x => <Chip key={x.id} active={sel === x.id} onClick={() => setSel(x.id)}>{x.kind === 'school' ? '🏫' : '📚'} {x.name} ({fa(x.members.length)})</Chip>)}</div>
          {cls && <div className="grid gap-3">
            <p className="text-[14px] text-[var(--pencil)]">{cls.kind === 'school' ? h.schools.find(s => s.id === cls.schoolId)?.name : cls.institute}{cls.teacher ? ` · ${cls.teacher}` : ''} · {GRADE_FA[cls.grade] || ''} · {cls.subjectIds.map(id => SUBJECTS.find(s => s.id === id)?.fa).join('، ')}</p>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">{people.map(p => <label key={p.id} className="flex items-center gap-2 rounded-[8px] bg-[var(--wash)] px-3 py-1.5 text-[14px]"><input type="checkbox" checked={cls.members.includes(p.id)} onChange={e => setH(x => H.setMember(x, cls.id, p.id, e.target.checked))} />{p.name}<span className="text-[12px] text-[var(--pencil)]">{h.schools.find(s => s.id === p.schoolId)?.name || ''}</span></label>)}</div>
            <button type="button" className="justify-self-start text-[13px] font-bold text-[var(--bad)]" onClick={() => confirm('این کلاس حذف شود؟') && setH(x => ({ ...x, classes: x.classes.filter(y => y.id !== cls.id) }))}>حذف کلاس</button></div>}
        </Card>
      </div>
    </div>
  );
}

function Library({ h, setH }) {
  const [adding, setAdding] = useState(false); const [open, setOpen] = useState(null);
  const books = H.libraryBooks(h);
  if (adding) return <div><Head kicker="مرکز" title="کتاب تست جدید" /><BookWizard inactive author={h.name} onCancel={() => setAdding(false)} onCreate={b => { const { id, active, ...rest } = b; setH(x => ({ ...x, library: { ...x.library, [b.uid]: { uid: b.uid, hubBook: { ...rest }, versions: [] } }, approved: { ...x.approved, [b.uid]: true } })); setAdding(false); }} /></div>;
  return (
    <div>
      <Head kicker="مرکز" title="کتاب‌های تست"><Btn onClick={() => setAdding(true)}>+ افزودن کتاب تست</Btn></Head>
      {!books.length ? <Card><Empty title="کتابخانه خالی است" text="کتاب‌هایی که افراد ساخته‌اند با واردکردن فایلشان اینجا می‌آیند؛ یا خودت کتاب اضافه کن." /></Card> :
        <div className="grid gap-3">{books.map(b => { const e = h.library[b.uid]; const ranged = b.nodes.filter(n => n.qStart != null).length; const keys = Object.keys(b.keys || {}).length; return (
          <Card key={b.uid} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" className="text-right" onClick={() => setOpen(open === b.uid ? null : b.uid)}><p className="text-[16px] font-black">{b.title}، {b.publisher}</p>
                <p className="text-[13px] text-[var(--pencil)]">{GRADE_FA[b.grade] || ''} · {textbookById(b.textbookId)?.title || b.subject} · {b.numbering === 'perChapter' ? 'هر فصل از ۱' : 'سراسری'}{b.levels ? ' · ۳ سطح' : ''} · {fa(ranged)} بازه · {fa(keys)} کلید · {fa((e.versions || []).length)} نسخه از افراد{b.disputed?.length ? ` · ${fa(b.disputed.length)} کلید مورد اختلاف` : ''}</p></button>
              <label className="flex items-center gap-2 text-[14px] font-bold"><input type="checkbox" className="h-5 w-5" checked={!!h.approved[b.uid]} onChange={ev => setH(x => ({ ...x, approved: { ...x.approved, [b.uid]: ev.target.checked } }))} />انتشار برای همه</label>
            </div>
            {open === b.uid && <ul className="mt-3 max-h-[40vh] overflow-auto text-[14px]">{b.nodes.map(n => <li key={n.id} style={{ paddingRight: n.depth * 14 }} className="flex justify-between border-b border-[var(--rule)] py-1"><span className={n.depth ? '' : 'font-black'}>{n.title}</span><span className="text-[var(--pencil)]">{n.qStart != null ? `${fa(n.qStart % 100000)}–${fa(n.qEnd % 100000)}` : ''}</span></li>)}</ul>}
          </Card>); })}</div>}
    </div>
  );
}

function ClassExams({ h, setH }) {
  const [f, setF] = useState({ classId: h.classes[0]?.id || '', title: '', date: addDays(todayStr(), 14), target: 60, sections: [] });
  const cls = h.classes.find(c => c.id === f.classId);
  const tbs = cls ? TEXTBOOKS.filter(t => (!cls.grade || t.grade === cls.grade) && (!cls.subjectIds.length || cls.subjectIds.includes(t.subjectId)) && t.nodes.length) : [];
  const addSec = tb => setF({ ...f, sections: [...f.sections, { textbookId: tb.id, subjectId: tb.subjectId, count: 10, tbRefs: [] }] });
  const upSec = (i, p) => setF({ ...f, sections: f.sections.map((x, j) => j === i ? { ...x, ...p } : x) });
  const ok = f.classId && f.title.trim() && f.sections.some(x => x.count > 0 && x.tbRefs.length);
  return (
    <div>
      <Head kicker="مرکز" title="آزمون‌های مشترک کلاس‌ها" />
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card>
          <p className="mb-3 text-[16px] font-black">آزمون جدید</p>
          {!h.classes.length ? <p className="text-[15px] text-[var(--pencil)]">اول در «مدارس و کلاس‌ها» کلاس بساز.</p> : <>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-[14px] font-bold">کلاس<select className={inp} value={f.classId} onChange={e => setF({ ...f, classId: e.target.value, sections: [] })}>{h.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="text-[14px] font-bold">عنوان<input className={inp} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="آزمون مشترک فصل ۲" /></label>
            <label className="text-[14px] font-bold">تاریخ<input type="date" className={inp} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></label>
          </div>
          <p className="mt-4 text-[14px] font-bold">درس‌ها (مباحث از فهرست کتاب درسی؛ برای هر دانش‌آموز به کتاب تست خودش وصل می‌شود)</p>
          <div className="mt-2 flex flex-wrap gap-2">{tbs.map(tb => <Chip key={tb.id} onClick={() => addSec(tb)}>+ {tb.title}</Chip>)}</div>
          {f.sections.map((sec, i) => { const tb = textbookById(sec.textbookId); return (
            <div key={i} className="mt-3 rounded-[12px] bg-[var(--wash)] p-3">
              <div className="mb-2 flex items-center justify-between"><b>{tb.title}</b><label className="text-[14px]">تعداد سؤال <input inputMode="numeric" className="w-16 rounded-[8px] border-2 border-[var(--rule)] bg-[var(--paper)] px-2 text-center" value={sec.count} onChange={e => upSec(i, { count: +e.target.value || 0 })} /></label></div>
              <div className="max-h-[30vh] overflow-auto">{tb.nodes.filter(n => n.kind !== 'problemSet').map(n => <label key={n.id} className="flex items-center gap-2 py-0.5 text-[14px]" style={{ paddingRight: n.depth * 14 }}><input type="checkbox" checked={sec.tbRefs.includes(n.id)} onChange={() => upSec(i, { tbRefs: sec.tbRefs.includes(n.id) ? sec.tbRefs.filter(x => x !== n.id) : [...sec.tbRefs, n.id] })} /><span className={n.depth ? '' : 'font-bold'}>{n.title}</span></label>)}</div>
              <button type="button" className="mt-1 text-[13px] font-bold text-[var(--bad)]" onClick={() => setF({ ...f, sections: f.sections.filter((_, j) => j !== i) })}>حذف درس</button>
            </div>); })}
          <Btn className="mt-4" disabled={!ok} onClick={() => { setH(x => H.addClassExam(x, { classId: f.classId, title: f.title.trim(), date: f.date, target: f.target, sections: f.sections.filter(x => x.count > 0 && x.tbRefs.length) })); setF({ ...f, title: '', sections: [] }); }}>ثبت آزمون مشترک</Btn></>}
        </Card>
        <Card className="content-start">
          <p className="mb-3 text-[16px] font-black">آزمون‌های ثبت‌شده</p>
          {!h.classExams.length ? <p className="text-[15px] text-[var(--pencil)]">هنوز آزمونی نیست.</p> :
            <ul className="grid gap-2">{h.classExams.map(e => { const r = H.examResults(h, e.id); return <li key={e.id} className="rounded-[10px] bg-[var(--wash)] p-3 text-[14px]"><b>{e.title}</b> · {h.classes.find(c => c.id === e.classId)?.name} · {jShort(e.date)}
              <p className="text-[13px] text-[var(--pencil)]">{e.sections.map(x => textbookById(x.textbookId)?.title).join('، ')}{r.n ? ` · ${fa(r.n)} نتیجه، میانگین ${fa(Math.round(r.mean))}٪` : ''}</p>
              {r.rows.length > 0 && <ul className="mt-1">{r.rows.sort((a, z) => z.percent - a.percent).map(x => <li key={x.id}>{x.person}: {fa(Math.round(x.percent))}٪</li>)}</ul>}
              <button type="button" className="mt-1 text-[12px] font-bold text-[var(--bad)]" onClick={() => setH(x => ({ ...x, classExams: x.classExams.filter(y => y.id !== e.id) }))}>حذف</button></li>; })}</ul>}
        </Card>
      </div>
    </div>
  );
}

function Compare({ h, setH }) {
  const [cid, setCid] = useState('');
  const cls = h.classes.find(c => c.id === cid);
  const rows = useMemo(() => Object.entries(H.compareStats(h, cls?.members || null)).filter(([k]) => k.startsWith('ref:')).map(([k, v]) => ({ ref: k.slice(4), ...v })).sort((a, z) => a.p50 - z.p50), [h, cid]);
  const consenting = Object.values(h.packs).filter(p => p.consent?.compare).length;
  return (
    <div>
      <Head kicker="مرکز" title="مقایسه مباحث" />
      <div className="mb-4 flex flex-wrap items-center gap-2"><Chip active={!cid} onClick={() => setCid('')}>همه</Chip>{h.classes.map(c => <Chip key={c.id} active={cid === c.id} onClick={() => setCid(c.id)}>{c.name}</Chip>)}
        <label className="mr-auto text-[14px]">حداقل اندازه گروه <input inputMode="numeric" className="w-14 rounded-[8px] border-2 border-[var(--rule)] bg-[var(--paper)] px-2 text-center" value={h.minGroup} onChange={e => setH(x => ({ ...x, minGroup: Math.max(2, +e.target.value || 3) }))} /></label></div>
      <Card>
        <p className="mb-3 text-[14px] text-[var(--pencil)]">{fa(consenting)} نفر اجازه مقایسه داده‌اند. مباحث بر اساس کتاب درسی یکی می‌شوند، پس کتاب‌های تست مختلف و دو رشته هم قابل مقایسه‌اند. ضعیف‌ترین مباحث بالا هستند.</p>
        {!rows.length ? <Empty title="هنوز داده کافی نیست" text={`برای هر مبحث حداقل ${fa(h.minGroup)} نفر با اجازه لازم است.`} /> :
          <table className="w-full text-right text-[14px]"><thead><tr className="text-[13px] text-[var(--pencil)]"><th className="py-2">مبحث (کتاب درسی)</th><th>نفر</th><th>میانه تسلط</th><th>بازه میانی</th></tr></thead>
            <tbody>{rows.map(r => <tr key={r.ref} className="border-t border-[var(--rule)]"><td className="py-1.5">{tbTitle(r.ref)}</td><td>{fa(r.n)}</td><td><b>{fa(Math.round(r.p50 * 100))}٪</b></td><td>{fa(Math.round(r.p25 * 100))}–{fa(Math.round(r.p75 * 100))}٪</td></tr>)}</tbody></table>}
      </Card>
    </div>
  );
}

function Notes({ h, setH }) {
  const [a, setA] = useState({ title: '', text: '', classId: '' });
  return (
    <div>
      <Head kicker="مرکز" title="اطلاعیه‌ها" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <label className="block text-[14px] font-bold">عنوان<input className={inp} value={a.title} onChange={e => setA({ ...a, title: e.target.value })} /></label>
          <label className="mt-2 block text-[14px] font-bold">متن<textarea rows={4} className={inp} value={a.text} onChange={e => setA({ ...a, text: e.target.value })} /></label>
          <label className="mt-2 block text-[14px] font-bold">برای<select className={inp} value={a.classId} onChange={e => setA({ ...a, classId: e.target.value })}><option value="">همه</option>{h.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <Btn className="mt-3" disabled={!a.title.trim()} onClick={() => { setH(x => H.addAnnouncement(x, { ...a, classId: a.classId || null })); setA({ title: '', text: '', classId: '' }); }}>افزودن (در اطلاع‌رسانی بعدی می‌رود)</Btn>
        </Card>
        <Card><ul className="grid gap-2">{h.announcements.map(n => <li key={n.id} className="rounded-[10px] bg-[var(--wash)] p-3 text-[14px]"><b>{n.title}</b>{n.classId ? ` · ${h.classes.find(c => c.id === n.classId)?.name}` : ''}<p>{n.text}</p><button type="button" className="text-[12px] font-bold text-[var(--bad)]" onClick={() => setH(x => ({ ...x, announcements: x.announcements.filter(y => y.id !== n.id) }))}>حذف</button></li>)}</ul></Card>
      </div>
    </div>
  );
}
