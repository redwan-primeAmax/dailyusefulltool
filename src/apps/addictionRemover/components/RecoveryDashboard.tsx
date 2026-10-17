import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Heart,
  HeartHandshake,
  Phone,
  Sparkles,
  Target,
} from 'lucide-react';
import type { AddictionCheckIn, AddictionGoal } from '../../../types';
import { CustomButton } from '../../../components/CustomButton';
import { Chip } from '../../../components/ui/controls';
import { lastDateKeys } from '../../../utils/date';
import { DAILY_STEPS, RECOVERY_MODES, formatCheckInOutcome, getJourneyDay } from '../addictionModel';
import { HealthSafetyCard } from './HealthSafetyCard';

const MOOD_LABELS: Record<AddictionCheckIn['mood'], string> = {
  great: 'Good',
  good: 'Okay',
  neutral: 'Steady',
  struggling: 'Hard day',
  skipped: 'Prefer not to say',
};

export function RecoveryDashboard({
  profile,
  checkIns,
  todayCheckIn,
  onOpenCheckIn,
  onOpenUrgeSupport,
}: {
  profile: AddictionGoal;
  checkIns: AddictionCheckIn[];
  todayCheckIn?: AddictionCheckIn;
  onOpenCheckIn: () => void;
  onOpenUrgeSupport: () => void;
}) {
  const journeyDay = getJourneyDay(profile.startTs);
  const weekKeys = lastDateKeys(7);
  const thisWeek = checkIns.filter((checkIn) => weekKeys.includes(checkIn.dateKey));
  const recent = [...checkIns].sort((a, b) => b.ts - a.ts).slice(0, 4);
  const mode = RECOVERY_MODES.find((item) => item.id === (profile.mode ?? 'quit')) ?? RECOVERY_MODES[0];
  const dayStep = DAILY_STEPS[(journeyDay - 1) % DAILY_STEPS.length];
  const phone = (profile.supportPhone ?? '').replace(/[^\d+*#]/g, '');

  return (
    <div className="space-y-4 px-4 pb-32 pt-4">
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950/80 via-surface2 to-slate-900 p-5 shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
              <CalendarDays className="size-3.5" /> Plan day {journeyDay}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-ink2">{mode.title} goal</span>
          </div>
          <h2 className="mt-3 text-[24px] font-black leading-tight tracking-tight text-ink">One day, one choice at a time.</h2>
          <p className="mt-1.5 text-[12px] text-ink2">Your plan for <span className="font-bold text-ink">{profile.name}</span></p>
          <p className="mt-2 max-w-[310px] text-[11.5px] leading-relaxed text-ink3">
            This is your journey—not a test. A difficult day does not erase what you have learned or the steps you have taken.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300">
            <Clock3 className="size-4" />
          </span>
          <p className="mt-3 text-[26px] font-black leading-none tabular-nums text-ink">{journeyDay}</p>
          <p className="mt-1 text-[11px] font-semibold text-ink3">day{journeyDay === 1 ? '' : 's'} on this plan</p>
        </div>
        <div className="card p-4">
          <span className="grid size-9 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
            <CheckCircle2 className="size-4" />
          </span>
          <p className="mt-3 text-[26px] font-black leading-none tabular-nums text-ink">{thisWeek.length}</p>
          <p className="mt-1 text-[11px] font-semibold text-ink3">check-ins this week</p>
        </div>
      </div>

      <section className="card space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${todayCheckIn ? 'bg-emerald-500/12 text-emerald-300' : 'bg-sky-500/10 text-sky-300'}`}>
            {todayCheckIn ? <CheckCircle2 className="size-5" /> : <Target className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-ink">A quick check-in</p>
            {todayCheckIn ? (
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink3">
                Today: {MOOD_LABELS[todayCheckIn.mood]} · urge level {todayCheckIn.cravingLevel ?? '—'}/10 · {formatCheckInOutcome(todayCheckIn.goalMet, todayCheckIn.mode ?? profile.mode)}
              </p>
            ) : (
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink3">Notice how you are feeling. You can skip any question.</p>
            )}
          </div>
        </div>
        <CustomButton fullWidth variant={todayCheckIn ? 'outline' : 'tonal'} onClick={onOpenCheckIn}>
          {todayCheckIn ? "Update today's check-in" : 'Check in with myself'}
        </CustomButton>
      </section>

      <button
        type="button"
        onClick={onOpenUrgeSupport}
        className="tap relative flex w-full items-center gap-3 overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/10 p-4 text-left shadow-lg shadow-amber-950/10"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-300">
          <HeartHandshake className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-extrabold text-ink">An urge is here? Pause with support.</span>
          <span className="mt-0.5 block text-[11px] leading-relaxed text-ink3">A short grounding guide, your chosen steps, and a way to contact someone.</span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-amber-300" />
      </button>

      <section className="card relative overflow-hidden p-4">
        <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wider text-violet-200">A small step for today</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink2">{dayStep}</p>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-emerald-300" />
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink">Your personal plan</h3>
        </div>

        {profile.planText && (
          <div className="rounded-2xl border border-emerald-400/10 bg-emerald-500/[0.06] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">My next goal</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink2">{profile.planText}</p>
          </div>
        )}

        {profile.triggers && profile.triggers.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold text-ink3">Things that may make it harder</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.triggers.map((trigger) => <Chip key={trigger} className="h-8 px-3 text-[10.5px]">{trigger}</Chip>)}
            </div>
          </div>
        )}

        {profile.copingActions && profile.copingActions.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold text-ink3">Things I can try</p>
            <div className="space-y-2">
              {profile.copingActions.map((action, index) => (
                <div key={action} className="flex items-start gap-2.5 rounded-xl bg-surface3/45 p-2.5">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/12 text-[10px] font-bold text-emerald-300">{index + 1}</span>
                  <p className="text-[11.5px] leading-relaxed text-ink2">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.reasons.length > 0 && (
          <div className="rounded-2xl border border-rose-400/10 bg-rose-500/[0.06] p-3">
            <div className="flex items-center gap-1.5 text-rose-300">
              <Heart className="size-3.5" />
              <p className="text-[10.5px] font-bold uppercase tracking-wider">Why this matters to me</p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {profile.reasons.map((reason) => <li key={reason} className="flex gap-2 text-[11.5px] text-ink2"><span className="text-rose-300">•</span>{reason}</li>)}
            </ul>
          </div>
        )}

        {(profile.supportName || phone) && (
          <div className="flex items-center gap-3 rounded-2xl border border-sky-400/15 bg-sky-500/[0.06] p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-300"><HeartHandshake className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-300/80">Someone in my corner</p>
              <p className="truncate text-[13px] font-bold text-ink">{profile.supportName || 'Trusted support'}</p>
            </div>
            {phone && (
              <a href={`tel:${phone}`} aria-label={`Call ${profile.supportName || 'trusted support'}`} className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-400/15 text-sky-300">
                <Phone className="size-4" />
              </a>
            )}
          </div>
        )}

        {(!profile.planText && !profile.copingActions?.length && !profile.triggers?.length && !profile.reasons.length) && (
          <p className="text-[11.5px] text-ink3">You can add triggers, reasons, or coping ideas in your plan settings.</p>
        )}
      </section>

      <section className="card space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink">Recent check-ins</h3>
          <span className="text-[10px] text-ink3">Only visible in this browser</span>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-2xl bg-surface3/40 p-3 text-[11.5px] leading-relaxed text-ink3">
            No entries yet. A check-in is a moment to notice—not a score.
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((checkIn) => (
              <div key={checkIn.id} className="flex items-center gap-3 rounded-2xl bg-surface3/40 p-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-surface3 text-[12px] text-ink2">
                  {checkIn.mood === 'skipped' ? '—' : checkIn.mood === 'struggling' ? '◌' : checkIn.mood === 'great' ? '✦' : '•'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold text-ink">{MOOD_LABELS[checkIn.mood]} · {formatCheckInOutcome(checkIn.goalMet, checkIn.mode ?? profile.mode)}</p>
                  <p className="text-[10px] text-ink3">{new Date(checkIn.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · urge {checkIn.cravingLevel ?? '—'}/10</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <HealthSafetyCard presetId={profile.presetId} />
      <p className="px-2 pb-2 text-center text-[10px] leading-relaxed text-ink3">
        Your plan is stored locally in this browser. There is no account or live counselor here; consider professional or peer support as part of your care.
      </p>
    </div>
  );
}
