/*
 SS v4 (handoff package v4, Release 1 core). Ported from v3 prototype with spec 38 fixes + spec 37 navigation.
 Subject: SS — personal study cockpit for an Iranian grade-11 math-physics student (owner: Mehran).
 Job: log tests in seconds, see where percent leaks, predict the next exam, plan prep, stay motivated.
 Design spine: the Ghalamchi-style answer sheet (پاسخ‌برگ): crimson print ink on off-white paper,
 graphite pencil bubbles, and the black timing marks running down the sheet's edge.
 Type: Vazirmatn (900 statement headlines, 400–700 UI). Color: paper #F6F1EA, ink #B3184A (lead),
 ink-deep #7E0F33, graphite #26232B, pencil #6E6873, wash #F3E3E8, ok #2F7D4F, bad #C2362B, amber #B9800F.
 Signature: timing-mark rail on the sheet edge; the active section's mark extends like a filled bubble.
*/
import { useEffect, useState } from 'react';
import { load, save, settleRewards } from './store.js';
import { ensureFirstUser, users, currentUserId } from './profiles.js';
import Network from './Network.jsx';
import Review from './Review.jsx';
import Planner from './Planner.jsx';
import Topics from './Topics.jsx';
import Settings from './Settings.jsx';
import History from './History.jsx';
import More, { MORE } from './More.jsx';
import Home from './Home.jsx';
import Practice from './Practice.jsx';
import Books from './Books.jsx';
import Analytics from './Analytics.jsx';
import Exam from './Exam.jsx';
import Rewards from './Rewards.jsx';
import Assistant from './Assistant.jsx';
import Profile from './Profile.jsx';

const NAV = [
  ['home', 'داشبورد', '◉'], ['practice', 'ثبت تست', '✎'], ['review', 'مرور', '↻'], ['exam', 'آزمون‌ها', '◎'],
  ['planner', 'برنامه', '▦'], ['analytics', 'تحلیل', '▤'], ['books', 'کتاب‌ها', '▥'], ['more', 'بیشتر', '⋯'],
];
const UNDER_MORE = new Set(MORE.map(m => m[0]));

export default function App() {
  const [s, setS] = useState(() => { ensureFirstUser(); return load(); });
  const [page, setPage] = useState('home');
  useEffect(() => { save(s); }, [s]);
  // F-09: append-only reward ledger, settled whenever raw data changes
  useEffect(() => { const add = settleRewards(s); if (add.length) setS(p => ({ ...p, ledger: [...p.ledger, ...add] })); }, [s.sessions, s.errorTasks, s.reviews, s.placements, s.settings.rewards]);
  const set = fn => setS(prev => fn(prev));
  const go = p => { setPage(p); window.scrollTo?.({ top: 0 }); };
  const P = { s, set, go, reload: st => setS(st) };
  const userName = users().find(u => u.id === currentUserId())?.name;
  return (
    <div dir="rtl" lang="fa" className="ss min-h-screen bg-[var(--paper)] text-[var(--graphite)]">
      <style>{`
        .ss{--paper:#F6F1EA;--card:#FFFCF8;--ink:#B3184A;--ink-deep:#7E0F33;--ink-faint:#E3A9BA;--graphite:#26232B;--pencil:#57515B;--wash:#F3E3E8;--rule:#EBD3DA;--ok:#2F7D4F;--bad:#C2362B;--amber:#B9800F;font-family:Vazirmatn,system-ui,sans-serif;font-size:16px}
        .ss input,.ss button{font-family:inherit}
        .ss .mark{display:inline-block;width:10px;height:4px;border-radius:1px;background:var(--graphite);opacity:.75}
        .rail{background:repeating-linear-gradient(to bottom,var(--graphite) 0 5px,transparent 5px 22px)}
        @keyframes drift{0%{transform:translateY(0)}100%{transform:translateY(22px)}}
        .rail-live{animation:drift 6s linear infinite}
        @media (prefers-reduced-motion:reduce){.rail-live{animation:none}}
      `}</style>
      <div className="mx-auto flex max-w-[1400px]">
        <nav aria-label="بخش‌ها" className="sticky top-0 hidden h-screen w-[230px] shrink-0 flex-col py-8 pr-0 md:flex">
          <div className="relative flex h-full">
            <div className="relative w-[18px] overflow-hidden" aria-hidden><div className="rail rail-live absolute inset-x-[4px] -top-[22px] bottom-0 opacity-80" /></div>
            <div className="flex flex-1 flex-col pr-4">
              <p className="mb-8 text-[26px] font-black leading-none text-[var(--ink)]">SS<span className="block text-[14px] font-bold text-[var(--pencil)]">سیستم مطالعه</span></p>
              {NAV.map(([k, t, i]) => (
                <button key={k} type="button" onClick={() => go(k)} aria-current={(page === k || (k === 'more' && UNDER_MORE.has(page))) ? 'page' : undefined}
                  className={`group relative mb-1 flex min-h-[44px] items-center gap-3 rounded-l-[10px] pr-3 text-right text-[15px] font-bold transition ${(page === k || (k === 'more' && UNDER_MORE.has(page))) ? 'bg-[var(--ink)] text-[var(--paper)]' : 'text-[var(--graphite)] hover:bg-[var(--wash)]'}`}>
                  <span className={`absolute -right-[22px] h-[14px] w-[14px] rounded-full border-2 ${(page === k || (k === 'more' && UNDER_MORE.has(page))) ? 'border-[var(--ink)] bg-[var(--ink)]' : 'border-[var(--ink-faint)] bg-[var(--paper)]'}`} aria-hidden />
                  <span className="w-5 text-center opacity-80">{i}</span>{t}
                </button>))}
              <button type="button" onClick={() => go('network')} className="mt-auto text-right text-[14px] leading-6 text-[var(--pencil)]"><b className="block text-[var(--graphite)]">👤 {s.me?.name || userName || 'کاربر'}</b>{s.demo ? 'داده نمونه' : 'همه داده‌ها فقط روی همین دستگاه.'}</button>
            </div>
          </div>
        </nav>
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-12 md:pt-10">
          {page === 'home' && <Home {...P} />}
          {page === 'practice' && <Practice {...P} />}
          {page === 'books' && <Books {...P} />}
          {page === 'analytics' && <Analytics {...P} />}
          {page === 'exam' && <Exam {...P} />}
          {page === 'rewards' && <Rewards {...P} />}
          {page === 'assistant' && <Assistant {...P} />}
          {page === 'profile' && <Profile {...P} />}
          {page === 'review' && <Review {...P} />}
          {page === 'planner' && <Planner {...P} />}
          {page === 'topics' && <Topics {...P} />}
          {page === 'settings' && <Settings {...P} />}
          {page === 'history' && <History {...P} />}
          {page === 'more' && <More {...P} />}
          {page === 'network' && <Network {...P} />}
        </main>
      </div>
      {page !== 'assistant' && <button type="button" onClick={() => go('assistant')} aria-label="دستیار"
        className="fixed bottom-24 left-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-[var(--ink)] text-[22px] text-[var(--paper)] shadow-[0_10px_24px_-8px_rgba(126,15,51,.6)] transition hover:scale-105 md:bottom-6">✉</button>}
      <nav aria-label="بخش‌ها (موبایل)" className="fixed inset-x-0 bottom-0 z-20 flex overflow-x-auto border-t-2 border-[var(--rule)] bg-[var(--card)] md:hidden">
        {NAV.map(([k, t, i]) => <button key={k} type="button" onClick={() => go(k)} aria-current={(page === k || (k === 'more' && UNDER_MORE.has(page))) ? 'page' : undefined} className={`flex min-w-[48px] flex-1 flex-col items-center gap-0.5 py-2 text-[12px] font-bold ${(page === k || (k === 'more' && UNDER_MORE.has(page))) ? 'text-[var(--ink)]' : 'text-[var(--pencil)]'}`}><span className="text-[17px]">{i}</span>{t}</button>)}
      </nav>
    </div>
  );
}
