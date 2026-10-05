import { useEffect, useMemo, useRef, useState } from 'react';
import * as E from './engine.js';
import { REASONS, bookById, leaves, nodePath, rangeOverlap, sessionStats, uid, attemptsOf, label } from './store.js';
import { Btn, Card, Chip, Head, Bubble, fa, pct } from './ui.jsx';

const STEPS = ['درس', 'کتاب', 'بازه', 'لیست پاسخ', 'زمان حدودی'];
const TIME_CHIPS = [10, 15, 20, 30, 45, 60, 90];

function nextBlock(s, b, node, size = 20) {
  if (node.qStart == null) return null;
  const done = new Set(attemptsOf(s).filter(a => a.bookId === b.id).map(a => a.num));
  let from = node.qStart; while (from <= node.qEnd && done.has(from)) from++;
  if (from > node.qEnd) return null; // node finished
  return { from, to: Math.min(node.qEnd, from + size - 1) };
}

export default function Practice({ s, set, go, preset }) {
  const subjects = [...new Set(s.books.map(b => b.subject))];
  const draft = s.draft;
  const [step, setStep] = useState(draft?.step ?? 0);
  const [subject, setSubject] = useState(draft?.subject ?? null);
  const [bookId, setBookId] = useState(draft?.bookId ?? null);
  const [ranges, setRanges] = useState(draft?.ranges ?? []);
  const [answers, setAnswers] = useState(draft?.answers ?? {});
  const [guesses, setGuesses] = useState(draft?.guesses ?? {});
  const [minutes, setMinutes] = useState(draft?.minutes ?? null);
  const [savedId, setSavedId] = useState(null);

  // autosave draft (VKS-10)
  useEffect(() => {
    if (savedId) return;
    const d = { step, subject, bookId, ranges, answers, guesses, minutes };
    set(x => ({ ...x, draft: step === 0 && !subject ? null : d }));
  }, [step, subject, bookId, ranges, answers, guesses, minutes, savedId]);

  useEffect(() => { if (preset) { setSubject(preset.subject); setBookId(preset.bookId); setRanges([preset.range]); setStep(3); } }, [preset]);

  const b = bookId ? bookById(s, bookId) : null;
  const nums = useMemo(() => ranges.flatMap(r => Array.from({ length: Math.max(0, r.to - r.from + 1) }, (_, i) => r.from + i)), [ranges]);

  if (savedId) return <Result s={s} set={set} go={go} id={savedId} again={() => { setSavedId(null); setStep(0); setSubject(null); setBookId(null); setRanges([]); setAnswers({}); setGuesses({}); setMinutes(null); }} />;

  const pickSubject = sub => {
    setSubject(sub); const bs = s.books.filter(x => x.subject === sub);
    if (bs.length === 1) { setBookId(bs[0].id); setStep(2); } else setStep(1);
  };

  const save = () => {
    const ses = { id: uid(), bookId, nodeId: ranges[0].nodeId, ranges, answers: Object.fromEntries(nums.map(n => [n, answers[n] ?? 0])), guesses, reasons: {}, minutes, timeSource: minutes ? 'estimated' : 'none', at: new Date().toISOString(), mixed: new Set(ranges.map(r => r.nodeId)).size >= 3 || ranges.some(r => b.nodes.find(n => n.id === r.nodeId)?.kind !== 'topic') };
    const st = sessionStats({ books: s.books }, ses);
    ses.flags = E.antiGamingFlags(st, minutes ? E.secPerQ(minutes * 60, st) : null, Object.values(ses.answers));
    set(x => ({ ...x, sessions: [...x.sessions, ses], draft: null }));
    setSavedId(ses.id);
  };

  return (
    <div>
      <Head kicker="ثبت تست" title="جلسه جدید">
        {(subject || ranges.length > 0) && <Btn kind="ghost" onClick={() => { setStep(0); setSubject(null); setBookId(null); setRanges([]); setAnswers({}); setGuesses({}); setMinutes(null); set(x => ({ ...x, draft: null })); }}>شروع از اول</Btn>}
      </Head>
      <ol className="mb-6 flex flex-wrap gap-2" aria-label="مراحل">
        {STEPS.map((t, i) => (
          <li key={t}>
            <button type="button" disabled={i > step} onClick={() => setStep(i === 1 && s.books.filter(x => x.subject === subject).length === 1 ? 0 : i)}
              className={`flex items-center gap-2 rounded-full px-3 min-h-[34px] text-[14px] font-bold ${i === step ? 'bg-[var(--ink)] text-[var(--paper)]' : i < step ? 'bg-[var(--wash)] text-[var(--ink-deep)]' : 'text-[var(--pencil)]'}`}>
              <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-current text-[12px]">{fa(i + 1)}</span>{t}
              {i === 0 && subject && i < step ? `: ${subject}` : ''}{i === 1 && b && i < step ? `: ${b.publisher}` : ''}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card>
          <p className="mb-4 text-[18px] font-black">کدام درس؟</p>
          <div className="flex flex-wrap gap-3">{subjects.map(sub => <Chip key={sub} onClick={() => pickSubject(sub)} className="min-h-[52px] px-6 text-[17px]">{sub}</Chip>)}</div>
          <ContinueCard s={s} onPick={(sub, bid, r) => { setSubject(sub); setBookId(bid); setRanges([r]); setStep(3); }} />
        </Card>
      )}

      {step === 1 && (
        <Card>
          <p className="mb-4 text-[18px] font-black">کدام کتاب؟</p>
          <div className="flex flex-wrap gap-3">{s.books.filter(x => x.subject === subject).map(x => <Chip key={x.id} onClick={() => { setBookId(x.id); setStep(2); }}>{x.title}، {x.publisher}</Chip>)}</div>
        </Card>
      )}

      {step === 2 && b && <RangeStep s={s} set={set} b={b} ranges={ranges} setRanges={setRanges} onNext={() => setStep(3)} />}

      {step === 3 && b && <AnswerStep b={b} nums={nums} answers={answers} setAnswers={setAnswers} guesses={guesses} setGuesses={setGuesses} onNext={() => setStep(4)} />}

      {step === 4 && (
        <Card>
          <p className="mb-1 text-[18px] font-black">حدوداً چقدر طول کشید؟</p>
          <p className="mb-4 text-[15px] text-[var(--pencil)]">{fa(nums.length)} تست. فقط یک عدد تقریبی، همین.</p>
          <div className="flex flex-wrap gap-3">
            {TIME_CHIPS.map(m => <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>{fa(m)} دقیقه</Chip>)}
            <Chip active={minutes === 0} onClick={() => setMinutes(0)}>نمی‌دانم</Chip>
          </div>
          <label className="mt-4 flex items-center gap-3 text-[15px]">یا دقیق:
            <input inputMode="numeric" className="w-24 rounded-[10px] border-2 border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-center" placeholder="۲۵"
              value={minutes && !TIME_CHIPS.includes(minutes) ? fa(minutes) : ''} onChange={e => { const v = +E.normalizeDigits(e.target.value); if (v >= 0 && v <= 600) setMinutes(v || null); }} /> دقیقه
          </label>
          {minutes > 0 && <p className="mt-3 text-[14px] text-[var(--pencil)]">≈ {fa(Math.round(minutes * 60 / nums.length))} ثانیه برای هر تست</p>}
          <div className="mt-6 flex gap-3"><Btn disabled={minutes == null} onClick={save}>ثبت و تصحیح</Btn></div>
        </Card>
      )}
    </div>
  );
}

function ContinueCard({ s, onPick }) {
  const last = [...s.sessions].sort((a, z) => z.at.localeCompare(a.at))[0]; if (!last) return null;
  const b = bookById(s, last.bookId); if (!b) return null;
  const ls = leaves(b).filter(n => n.qStart != null); const start = Math.max(0, ls.findIndex(n => n.id === last.nodeId));
  let node = null, nb = null;
  for (let i = start; i < ls.length && !nb; i++) { node = ls[i]; nb = nextBlock(s, b, node, Math.max(10, Object.keys(last.answers).length)); }
  if (!nb) return null;
  return (
    <button type="button" onClick={() => onPick(b.subject, b.id, { nodeId: node.id, ...nb })}
      className="mt-6 flex w-full items-center justify-between gap-4 rounded-[12px] bg-[var(--wash)] p-4 text-right hover:brightness-95">
      <span><span className="block text-[14px] font-bold text-[var(--ink)]">ادامه از جایی که ماندی</span>
        <span className="block text-[16px] font-black">{b.subject}، {label(b, node)}، تست {fa(nb.from)} تا {fa(nb.to)}</span></span>
      <span className="text-[22px] text-[var(--ink)]">←</span>
    </button>
  );
}

function RangeStep({ s, set, b, ranges, setRanges, onNext }) {
  const chapters = b.nodes.filter(n => n.depth === 0);
  const [open, setOpen] = useState(() => { const n = ranges[0] && b.nodes.find(x => x.id === ranges[0].nodeId); let c = n; while (c?.parentId) c = b.nodes.find(x => x.id === c.parentId); return c?.id ?? chapters[0]?.id; });
  const [pending, setPending] = useState(null); // {node, from, to, save}
  const [err, setErr] = useState('');
  const kids = id => b.nodes.filter(n => n.parentId === id && n.kind !== 'theory');

  const choose = node => {
    setErr('');
    if (node.qStart == null) { setPending({ node, from: '', to: '', save: true }); return; }
    const nb = nextBlock(s, b, node, 20) || { from: node.qStart, to: Math.min(node.qEnd, node.qStart + 19) }; setPending({ node, from: nb.from, to: nb.to, save: false, known: true });
  };
  const add = () => {
    const from = +E.normalizeDigits(pending.from), to = +E.normalizeDigits(pending.to);
    if (!from || !to || from > to) return setErr('شماره شروع باید از پایان کوچک‌تر باشد.');
    if (to - from >= 300) return setErr('حداکثر ۳۰۰ تست در یک جلسه.');
    if (pending.save && !pending.known) {
      const ov = rangeOverlap(b, pending.node.id, from, to);
      if (ov) return setErr(`این بازه با «${ov.title}» (${fa(ov.qStart)}–${fa(ov.qEnd)}) تداخل دارد.`);
      set(x => ({ ...x, books: x.books.map(bb => bb.id !== b.id ? bb : { ...bb, nodes: bb.nodes.map(n => n.id === pending.node.id ? { ...n, qStart: from, qEnd: to } : n) }) }));
    }
    setRanges(r => [...r, { nodeId: pending.node.id, from, to }]); setPending(null);
  };
  const leaf = n => {
    const sel = ranges.some(r => r.nodeId === n.id);
    return (
      <button key={n.id} type="button" onClick={() => choose(n)} className={`flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-right text-[15px] hover:bg-[var(--wash)] ${sel ? 'bg-[var(--wash)] font-bold' : ''}`}>
        <span>{n.title}{n.kind !== 'topic' && <span className="mr-2 rounded bg-[var(--wash)] px-2 text-[13px] text-[var(--ink-deep)]">{{ mixed: 'مخلوط', checkup: 'چکاپ', comprehensive: 'جامع', final: 'نهایی' }[n.kind]}</span>}</span>
        <span className="shrink-0 text-[14px] text-[var(--pencil)]">{n.qStart != null ? `${fa(n.qStart)}–${fa(n.qEnd)}` : 'بازه ندارد'}</span>
      </button>
    );
  };
  const tree = id => kids(id).map(n => n.isLeaf ? leaf(n) : (
    <div key={n.id} className="mt-1"><p className="px-3 pt-2 text-[14px] font-bold text-[var(--pencil)]">{n.title}</p><div className="border-r-2 border-[var(--rule)] pr-2">{tree(n.id)}</div></div>));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <Card>
        <p className="mb-3 text-[18px] font-black">کدام بازه از {b.title}؟</p>
        <div className="mb-3 flex flex-wrap gap-2">{chapters.map(c => <Chip key={c.id} active={open === c.id} onClick={() => setOpen(c.id)}>{c.title.replace(/^فصل\s*/, 'فصل ').split(':')[0]}</Chip>)}</div>
        <p className="mb-2 px-3 text-[15px] font-bold text-[var(--ink)]">{b.nodes.find(n => n.id === open)?.title}</p>
        <div className="max-h-[52vh] overflow-auto">{b.nodes.find(n => n.id === open)?.isLeaf ? leaf(b.nodes.find(n => n.id === open)) : tree(open)}</div>
      </Card>
      <div className="grid content-start gap-4">
        {pending && (
          <Card className="outline outline-2 outline-[var(--ink)]">
            <p className="text-[14px] font-bold text-[var(--ink)]">{nodePath(b, pending.node).slice(-2).join(' › ')}</p>
            {!pending.known && <p className="mt-2 text-[15px]">این مبحث هنوز بازه ندارد. از تست چند تا چند است؟</p>}
            <div className="mt-3 flex items-center gap-2 text-[15px]">از
              <input aria-label="از" inputMode="numeric" autoFocus className="w-20 rounded-[10px] border-2 border-[var(--rule)] bg-[var(--paper)] px-2 py-2 text-center" value={fa(pending.from)} onChange={e => setPending({ ...pending, from: E.normalizeDigits(e.target.value) })} />
              تا
              <input aria-label="تا" inputMode="numeric" className="w-20 rounded-[10px] border-2 border-[var(--rule)] bg-[var(--paper)] px-2 py-2 text-center" value={fa(pending.to)} onChange={e => setPending({ ...pending, to: E.normalizeDigits(e.target.value) })} onKeyDown={e => e.key === 'Enter' && add()} />
            </div>
            {!pending.known && <label className="mt-3 flex items-center gap-2 text-[14px]"><input type="checkbox" checked={pending.save} onChange={e => setPending({ ...pending, save: e.target.checked })} /> این بازه برای این مبحث ذخیره شود</label>}
            {pending.known && <p className="mt-2 text-[14px] text-[var(--pencil)]">پیشنهاد: اولین تست‌های نزده این مبحث. قابل تغییر است.</p>}
            {err && <p role="alert" className="mt-2 text-[14px] font-bold text-[var(--bad)]">{err}</p>}
            <div className="mt-4 flex gap-2"><Btn onClick={add}>افزودن بازه</Btn><Btn kind="ghost" onClick={() => setPending(null)}>لغو</Btn></div>
          </Card>
        )}
        <Card>
          <p className="mb-2 text-[16px] font-black">بازه‌های این جلسه</p>
          {!ranges.length ? <p className="text-[15px] text-[var(--pencil)]">از فهرست یک مبحث را انتخاب کن.</p> :
            <ul className="grid gap-2">{ranges.map((r, i) => <li key={i} className="flex items-center justify-between rounded-[10px] bg-[var(--wash)] px-3 py-2 text-[15px]"><span><b>{label(b, b.nodes.find(n => n.id === r.nodeId))}</b>، {fa(r.from)} تا {fa(r.to)}</span><button type="button" aria-label="حذف بازه" className="px-2 text-[var(--bad)]" onClick={() => setRanges(rs => rs.filter((_, j) => j !== i))}>✕</button></li>)}</ul>}
          <Btn className="mt-4 w-full" disabled={!ranges.length} onClick={onNext}>باز کردن لیست پاسخ ({fa(ranges.reduce((a, r) => a + r.to - r.from + 1, 0))} تست)</Btn>
          {ranges.length > 0 && <p className="mt-2 text-[13px] text-[var(--pencil)]">می‌توانی بازه دیگری هم اضافه کنی.</p>}
        </Card>
      </div>
    </div>
  );
}

function AnswerStep({ b, nums, answers, setAnswers, guesses, setGuesses, onNext }) {
  const [cur, setCur] = useState(() => nums.find(n => answers[n] == null) ?? nums[0]);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');
  const refs = useRef({});
  const filled = nums.filter(n => answers[n] != null).length;
  const setAns = (n, v) => { setAnswers(a => ({ ...a, [n]: v })); const i = nums.indexOf(n); if (i < nums.length - 1) { setCur(nums[i + 1]); refs.current[nums[i + 1]]?.scrollIntoView({ block: 'nearest' }); } };
  useEffect(() => {
    const h = e => {
      if (e.target.tagName === 'INPUT') return;
      const k = E.normalizeDigits(e.key);
      if (/^[0-4]$/.test(k)) { e.preventDefault(); setAns(cur, +k); }
      else if (e.key === ' ') { e.preventDefault(); setAns(cur, 0); }
      else if (e.key === '?' || e.key === '؟') setGuesses(g => ({ ...g, [cur]: !g[cur] }));
      else if (e.key === 'ArrowDown') setCur(nums[Math.min(nums.length - 1, nums.indexOf(cur) + 1)]);
      else if (e.key === 'ArrowUp') setCur(nums[Math.max(0, nums.indexOf(cur) - 1)]);
      else if (e.key === 'Backspace') setAnswers(a => { const x = { ...a }; delete x[cur]; return x; });
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [cur, nums]);
  const applyPaste = () => {
    const r = E.parseAnswerString(paste); if (!r.ok) return setMsg('فقط ارقام ۰ تا ۴ مجاز است (۰ یعنی نزده).');
    const start = nums.indexOf(cur); const upd = {};
    r.values.forEach((v, i) => { if (nums[start + i] != null) upd[nums[start + i]] = v; });
    setAnswers(a => ({ ...a, ...upd })); setMsg(`${fa(Object.keys(upd).length)} پاسخ از تست ${fa(cur)} وارد شد${r.values.length > nums.length - start ? ' (اضافه‌ها نادیده گرفته شد)' : ''}.`); setPaste('');
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card className="p-0">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[14px] bg-[var(--card)] px-5 py-3 shadow-[0_1px_0_var(--rule)]">
          <p className="text-[16px] font-black">پاسخ‌برگ، {b.subject}</p>
          <p className="text-[14px] text-[var(--pencil)]">{fa(filled)} از {fa(nums.length)}</p>
        </div>
        <div className="max-h-[60vh] overflow-auto px-3 py-2">
          {nums.map(n => (
            <div key={n} ref={el => refs.current[n] = el} onClick={() => setCur(n)}
              className={`flex items-center gap-3 rounded-[10px] px-2 py-1.5 ${n === cur ? 'bg-[var(--wash)]' : ''} ${(nums.indexOf(n) + 1) % 10 === 0 ? 'mb-2 border-b-2 border-[var(--rule)] pb-3' : ''}`}>
              <span className="mark" aria-hidden />
              <span className="w-10 text-left text-[15px] font-bold tabular-nums text-[var(--ink)]">{fa(n)}</span>
              <div className="flex gap-2">{[1, 2, 3, 4].map(o => <Bubble key={o} label={fa(o)} filled={answers[n] === o} onClick={() => setAns(n, o)} title={`تست ${fa(n)} گزینه ${fa(o)}`} />)}</div>
              <button type="button" onClick={() => setAns(n, 0)} className={`rounded-full px-3 min-h-[30px] text-[13px] font-bold ${answers[n] === 0 ? 'bg-[var(--pencil)] text-[var(--paper)]' : 'text-[var(--pencil)] hover:bg-[var(--wash)]'}`}>نزده</button>
              <button type="button" onClick={() => setGuesses(g => ({ ...g, [n]: !g[n] }))} aria-pressed={!!guesses[n]} className={`mr-auto rounded-full px-3 min-h-[30px] text-[13px] font-bold ${guesses[n] ? 'bg-[var(--amber)] text-[var(--paper)]' : 'text-[var(--pencil)] hover:bg-[var(--wash)]'}`}>حدسی</button>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid content-start gap-4">
        <Card>
          <p className="mb-2 text-[16px] font-black">ورود سریع</p>
          <p className="mb-3 text-[14px] text-[var(--pencil)]">پاسخ‌ها را پشت هم بنویس، از تست {fa(cur)} پر می‌شود. ۰ یعنی نزده.</p>
          <input aria-label="رشته پاسخ" inputMode="numeric" dir="ltr" className="w-full rounded-[10px] border-2 border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-center text-[18px] tracking-[0.3em]" placeholder="۳۱۴۰۲۲۱" value={fa(paste)} onChange={e => setPaste(E.normalizeDigits(e.target.value))} onKeyDown={e => e.key === 'Enter' && applyPaste()} />
          <Btn kind="soft" className="mt-3 w-full" onClick={applyPaste} disabled={!paste}>وارد کن</Btn>
          {msg && <p className="mt-2 text-[14px] text-[var(--ink-deep)]">{msg}</p>}
          <p className="mt-4 text-[13px] leading-6 text-[var(--pencil)]">صفحه‌کلید: ۱ تا ۴ انتخاب، فاصله یا ۰ نزده، ؟ حدسی، ↑↓ جابه‌جایی</p>
        </Card>
        <Btn onClick={onNext} disabled={!filled}>{filled < nums.length ? `ادامه (${fa(nums.length - filled)} تست خالی = نزده)` : 'ادامه'}</Btn>
      </div>
    </div>
  );
}

function Result({ s, set, go, id, again }) {
  const ses = s.sessions.find(x => x.id === id); const b = bookById(s, ses.bookId);
  const st = sessionStats(s, ses); const nums = Object.keys(ses.answers).map(Number);
  const [analyze, setAnalyze] = useState(false);
  const [shown, setShown] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i += 1; setShown(i); if (i >= nums.length) clearInterval(t); }, 25); return () => clearInterval(t); }, []);
  const res = n => E.correct(ses.answers[n], b.keys[n] ?? null);
  const wrong = nums.filter(n => ['W', 'B'].includes(res(n)));
  const setReason = (n, rid) => set(x => ({ ...x, sessions: x.sessions.map(z => z.id !== id ? z : { ...z, reasons: { ...z.reasons, [n]: (z.reasons[n] || []).includes(rid) ? z.reasons[n].filter(r => r !== rid) : [...(z.reasons[n] || []), rid] } }) }));
  const later = () => { set(x => ({ ...x, errorTasks: [...x.errorTasks, { id: uid(), sessionId: id, status: 'open', at: new Date().toISOString() }] })); go('home'); };
  const spq = E.secPerQ(ses.minutes * 60, st);
  const lost = st.N ? E.pointsLost(st.N, st.W, st.B) : null;
  return (
    <div>
      <Head kicker={`${b.subject}، ${label(b, b.nodes.find(n => n.id === ses.nodeId))}`} title={st.P == null ? 'منتظر کلید' : pct(st.P)} />
      {ses.flags?.length > 0 && <p className="mb-4 rounded-[10px] bg-[var(--wash)] p-3 text-[15px]">این جلسه غیرعادی به نظر می‌رسد (خیلی سریع یا گزینه‌های یکسان)؛ ذخیره شد ولی پاداش ندارد.</p>}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card>
          <div className="mb-4 grid grid-cols-4 gap-3 text-center">
            {[['C', 'درست', st.C], ['W', 'غلط', st.W], ['B', 'نزده', st.B], ['U', 'بدون کلید', st.U]].map(([k, t, v]) => (
              <div key={k} className="rounded-[12px] bg-[var(--wash)] p-3"><p className="text-[28px] font-black" style={{ color: { C: 'var(--ok)', W: 'var(--bad)', B: 'var(--pencil)', U: 'var(--amber)' }[k] }}>{fa(v)}</p><p className="text-[14px]">{t}</p></div>))}
          </div>
          <div className="flex flex-wrap gap-1.5" aria-label="نتیجه تست‌ها">
            {nums.map((n, i) => { const r = res(n); return <span key={n} title={`تست ${fa(n)}`} className="grid h-9 w-9 place-items-center rounded-full text-[12px] font-bold transition-all duration-200" style={{ background: i < shown ? { C: 'var(--ok)', W: 'var(--bad)', B: 'var(--pencil)', U: 'var(--amber)' }[r] : 'var(--wash)', color: i < shown ? 'var(--paper)' : 'var(--pencil)', transform: i < shown ? 'scale(1)' : 'scale(.8)' }}>{fa(n)}</span>; })}
          </div>
          <p className="mt-4 text-[15px] text-[var(--pencil)]">{ses.minutes ? `${fa(ses.minutes)} دقیقه، حدود ${fa(Math.round(spq))} ثانیه برای هر تست (تخمینی)` : 'زمان ثبت نشد'}{st.U ? `، ${fa(st.U)} تست وقتی کلیدش وارد شود خودکار تصحیح می‌شود` : ''}</p>
          {lost && lost.total > 0 && <p className="mt-2 text-[15px]">هر غلط {fa(lost.perW.toFixed(1))} و هر نزده {fa(lost.perB.toFixed(1))} درصد از این جلسه کم کرد.</p>}
        </Card>
        <Card>
          {!wrong.length ? <p className="text-[16px] font-black">هیچ غلط یا نزده‌ای نیست 👏</p> : !analyze ? (<>
            <p className="text-[17px] font-black">{fa(wrong.length)} غلط و نزده</p>
            <p className="mt-1 mb-4 text-[15px] text-[var(--pencil)]">علتشان را الان می‌زنی یا بعداً؟ «بعداً» به کارهای امروزت اضافه می‌شود.</p>
            <div className="flex gap-2"><Btn onClick={() => setAnalyze(true)}>تحلیل خطا الان</Btn><Btn kind="line" onClick={later}>بعداً</Btn></div>
          </>) : (
            <div className="max-h-[50vh] overflow-auto">
              <ReasonList ses={ses} wrong={wrong} res={res} setReason={setReason} />
              <Btn className="mt-3 w-full" onClick={() => go('home')}>تمام</Btn>
            </div>
          )}
          <Btn kind="ghost" className="mt-3 w-full" onClick={again}>یک جلسه دیگر</Btn>
        </Card>
      </div>
    </div>
  );
}

export function ReasonList({ ses, wrong, res, setReason }) {
  return wrong.map(n => (
    <div key={n} className="mb-3 border-b border-[var(--rule)] pb-3">
      <p className="mb-2 text-[15px] font-bold">تست {fa(n)} <span className="text-[13px]" style={{ color: res(n) === 'W' ? 'var(--bad)' : 'var(--pencil)' }}>{res(n) === 'W' ? 'غلط' : 'نزده'}</span></p>
      <div className="flex flex-wrap gap-1.5">{REASONS.map(r => <button key={r.id} type="button" aria-pressed={(ses.reasons[n] || []).includes(r.id)} onClick={() => setReason(n, r.id)} className={`rounded-full border-2 px-3 min-h-[30px] text-[13px] font-bold ${(ses.reasons[n] || []).includes(r.id) ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]' : 'border-[var(--rule)]'}`}>{r.fa}</button>)}</div>
    </div>
  ));
}
