import { Quote, Sparkles, CheckCircle2, Share2 } from 'lucide-react';
import { CustomButton } from '../../../components/CustomButton';
import type { DailyMotivation } from '../addictionModel';

interface DailyMotivationCardProps {
  motivation: DailyMotivation;
  dayNumber: number;
  isCheckedInToday: boolean;
  onOpenCheckIn: () => void;
  onShare?: () => void;
}

export function DailyMotivationCard({
  motivation,
  dayNumber,
  isCheckedInToday,
  onOpenCheckIn,
  onShare,
}: DailyMotivationCardProps) {

  return (
    <div className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-surface2 via-surface2/90 to-surface3/80 p-5 shadow-xl shadow-black/20">
      {/* Decorative ambient background accent */}
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative space-y-4">
        {/* Header tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-xl bg-accentsoft text-accent">
              <Quote className="size-3.5" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
              Day {dayNumber} Daily Fuel · {motivation.powerWord}
            </span>
          </div>

          {isCheckedInToday ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-400">
              <CheckCircle2 className="size-3" /> Logged Clean!
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-300 animate-pulse">
              Pending Check-In
            </span>
          )}
        </div>

        {/* Quote */}
        <blockquote className="space-y-1">
          <p className="text-[15px] font-semibold text-ink leading-relaxed italic">
            “{motivation.quote}”
          </p>
          <p className="text-[11.5px] font-bold text-ink3 text-right">
            — {motivation.author}
          </p>
        </blockquote>

        {/* Daily Actionable Tip */}
        <div className="rounded-2xl border border-hairline bg-surface3/50 p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="size-3" /> Today's Focus Action
          </p>
          <p className="text-[12.5px] text-ink2 leading-relaxed">
            {motivation.tip}
          </p>
        </div>

        {/* Action button */}
        <div className="flex gap-2.5 pt-1">
          <CustomButton
            variant={isCheckedInToday ? 'outline' : 'success'}
            fullWidth
            onClick={onOpenCheckIn}
            leadingIcon={<CheckCircle2 className="size-4" />}
          >
            {isCheckedInToday ? 'View / Edit Today\'s Log' : 'Log Day ' + dayNumber + ' Victory 🎉'}
          </CustomButton>

          {onShare && (
            <button
              type="button"
              aria-label="Share daily quote"
              onClick={onShare}
              className="tap grid size-11 shrink-0 place-items-center rounded-2xl border border-hairline bg-surface3/60 text-ink2 hover:text-ink"
            >
              <Share2 className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
