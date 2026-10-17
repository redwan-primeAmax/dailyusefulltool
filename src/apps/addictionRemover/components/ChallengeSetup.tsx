import { useState } from 'react';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import type { ChallengeDifficulty } from '../../../types';
import { CustomButton } from '../../../components/CustomButton';
import { TextField } from '../../../components/ui/controls';
import { CHALLENGE_OPTIONS, toBanglaDigits } from '../addictionModel';
import { HealthSafetyCard } from './HealthSafetyCard';

export function ChallengeSetup({
  onStart,
}: {
  onStart: (difficulty: ChallengeDifficulty, name: string) => void;
}) {
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty | null>(null);
  const [name, setName] = useState('');
  const selected = CHALLENGE_OPTIONS.find((option) => option.id === difficulty);
  const canStart = Boolean(selected && name.trim());

  return (
    <div className="space-y-4 px-4 pb-2">
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950/70 via-surface2 to-slate-900 p-5 shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-10 size-40 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
            <ShieldCheck className="size-3.5" /> তোমার ব্যক্তিগত চ্যালেঞ্জ
          </span>
          <h2 className="mt-3 max-w-[300px] text-[25px] font-black leading-tight tracking-tight text-ink">
            পরিবর্তনের পথে আজই শুরু হোক।
          </h2>
          <p className="mt-2 max-w-[310px] text-[12.5px] leading-relaxed text-ink2">
            প্রথমে সময় বেছে নাও, তারপর যে অভ্যাসটি বদলাতে চাও তার নাম লেখো।
          </p>
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <div>
          <p className="text-[14px] font-bold text-ink">১. চ্যালেঞ্জ বেছে নাও</p>
          <p className="mt-0.5 text-[11.5px] text-ink3">নিজের জন্য মানানসই সময় দিয়ে শুরু করো।</p>
        </div>
        <div className="space-y-2">
          {CHALLENGE_OPTIONS.map((option) => {
            const active = difficulty === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => setDifficulty(option.id)}
                className={`tap flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                  active ? 'border-emerald-400/50 bg-emerald-500/10' : 'border-hairline bg-surface3/45 hover:bg-surface3/80'
                }`}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface3 text-[23px]" aria-hidden="true">
                  {option.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[14px] font-extrabold text-ink">{option.title}</span>
                    <span className="text-[9px] font-bold tracking-[0.12em] text-ink3">{option.englishTitle}</span>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-ink3">{option.description}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end">
                  <span className="text-[16px] font-black tabular-nums text-ink">
                    {toBanglaDigits(option.durationDays)} <span className="text-[11px] font-semibold text-ink3">দিন</span>
                  </span>
                  {active && <Check className="mt-1 size-4 text-emerald-300" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {selected && (
        <section className="card space-y-3 p-4">
          <div>
            <p className="text-[14px] font-bold text-ink">২. কী বদলাতে চাও?</p>
            <p className="mt-0.5 text-[11.5px] text-ink3">নামটি শুধু এই ডিভাইসেই সেভ থাকবে।</p>
          </div>
          <TextField
            label="অভ্যাস বা আসক্তির নাম"
            placeholder="যেমন: ধূমপান, জুয়া, অতিরিক্ত স্ক্রলিং"
            value={name}
            onChange={setName}
          />
          <CustomButton
            fullWidth
            size="lg"
            disabled={!canStart}
            trailingIcon={<ArrowRight className="size-4" />}
            onClick={() => selected && name.trim() && onStart(selected.id, name.trim())}
          >
            চ্যালেঞ্জ শুরু করো
          </CustomButton>
        </section>
      )}

      <HealthSafetyCard />
    </div>
  );
}
