import { Card, Head } from './ui.jsx';

export const MORE = [
  ['history', 'ورود سابقه', 'تست‌های قبل از برنامه را وارد کن', '⤓'],
  ['topics', 'مباحث خوانده‌شده', 'تدریس شد یا خودم خواندم', '☑'],
  ['rewards', 'پاداش', 'ماموریت‌ها، سطح و فروشگاه', '★'],
  ['assistant', 'دستیار', 'سؤال بپرس، سریع ثبت کن', '✉'],
  ['profile', 'نیمرخ من', 'پرسشنامه‌ها و الگوهای رفتاری', '◐'],
  ['network', 'کاربران، کلاس و مرکز', 'چند کاربر، مدرسه و کلاس، فایل مرکز', '⇄'],
  ['settings', 'تنظیمات و پشتیبان', 'سقف روزانه، پشتیبان، داده نمونه', '⚙'],
];

export default function More({ go }) {
  return (
    <div>
      <Head kicker="بیشتر" title="بقیه ابزارها" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MORE.map(([k, t, d, i]) => (
          <button key={k} type="button" onClick={() => go(k)} className="text-right">
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-[0_1px_0_var(--rule),0_14px_30px_-18px_rgba(60,20,35,.45)]">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-[var(--wash)] text-[20px] text-[var(--ink)]" aria-hidden>{i}</span>
              <p className="text-[18px] font-black">{t}</p>
              <p className="mt-1 text-[15px] text-[var(--pencil)]">{d}</p>
            </Card>
          </button>))}
      </div>
    </div>
  );
}
