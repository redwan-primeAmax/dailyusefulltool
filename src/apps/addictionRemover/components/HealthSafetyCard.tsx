import { AlertTriangle, HeartHandshake } from 'lucide-react';

export function HealthSafetyCard() {
  return (
    <aside className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/[0.07] p-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
        <AlertTriangle className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-amber-100">নিরাপত্তার কথা</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink3">
          মাদক বা ওষুধ হঠাৎ বন্ধ করা বিপজ্জনক হতে পারে। প্রয়োজন হলে চিকিৎসক বা বিশ্বস্ত কারও সাহায্য নাও—এই অ্যাপ চিকিৎসার বিকল্প নয়।
        </p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-amber-200/90">
          <HeartHandshake className="size-3.5" /> প্রয়োজনে সাহায্য চাও
        </span>
      </div>
    </aside>
  );
}
