import {
  CalendarDays,
  Clock3,
  Hourglass,
  Sparkles,
  Timer,
  Trophy,
} from 'lucide-react';
import { CustomButton } from '../../../components/CustomButton';
import type { AddictionChallenge, ChallengeTimeUnit } from '../../../types';
import {
  COUNTDOWN_OPTIONS,
  getChallengeDay,
  getCountdownValue,
  getDailyMessage,
  getChallengeOption,
  getNormalCountdown,
  getRemainingMs,
} from '../addictionModel';
import { HealthSafetyCard } from './HealthSafetyCard';

const TIME_ICONS = {
  seconds: Timer,
  minutes: Clock3,
  normal: CalendarDays,
  hours: Hourglass,
} satisfies Record<ChallengeTimeUnit, typeof Timer>;

const NORMAL_UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
] as const;

const SINGLE_UNIT_LABELS: Record<Exclude<ChallengeTimeUnit, 'normal'>, string> = {
  seconds: 'seconds remaining',
  minutes: 'minutes remaining',
  hours: 'hours remaining',
};

export function ChallengeDashboard({
  challenge,
  displayUnit,
  now,
  onDisplayUnitChange,
  onNewChallenge,
}: {
  challenge: AddictionChallenge;
  displayUnit: ChallengeTimeUnit;
  now: number;
  onDisplayUnitChange: (unit: ChallengeTimeUnit) => void;
  onNewChallenge: () => void;
}) {
  const remainingMs = getRemainingMs(challenge, now);
  const complete = remainingMs === 0;
  const day = getChallengeDay(challenge, now);
  const progress = Math.min(100, Math.max(0, ((now - challenge.startTs) / (challenge.durationDays * 86_400_000)) * 100));
  const challengeOption = getChallengeOption(challenge.difficulty);
  const normalCountdown = getNormalCountdown(challenge, now);

  return (
    <div className="space-y-4 px-4 pb-2">
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950/70 via-surface2 to-slate-900 p-5 shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-10 size-40 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
            {complete ? <Trophy className="size-3.5" /> : <Sparkles className="size-3.5" />}
            {complete ? 'Challenge complete' : 'Your challenge is underway'}
          </span>
          <h2 className="mt-3 break-words text-[25px] font-black leading-tight tracking-tight text-ink">
            {challenge.name}
          </h2>
          <p className="mt-1 text-[12px] text-ink2">
            {complete
              ? 'This challenge period has ended.'
              : `${challengeOption.title} · ${challenge.durationDays.toLocaleString('en-US')}-day challenge`}
          </p>
        </div>
      </section>

      <section className="card overflow-hidden p-4">
        <div className="text-center">
          <p className="text-[13px] font-bold text-ink">
            {complete ? 'Your challenge period is complete' : 'Time remaining'}
          </p>
          <p className="mt-1 text-[10.5px] text-ink3">Choose a countdown display</p>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5" role="group" aria-label="Countdown display format">
          {COUNTDOWN_OPTIONS.map((option) => {
            const Icon = TIME_ICONS[option.id];
            const active = displayUnit === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => onDisplayUnitChange(option.id)}
                className={`tap flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-1.5 transition-colors ${
                  active
                    ? 'border-accent/40 bg-accentsoft text-accent'
                    : 'border-hairline bg-surface3/45 text-ink3 hover:text-ink'
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="text-[9px] font-bold leading-none">{option.label}</span>
              </button>
            );
          })}
        </div>

        {displayUnit === 'normal' ? (
          <div className="mt-4 grid grid-cols-4 gap-1 text-center">
            {NORMAL_UNITS.map((unit) => (
              <div key={unit.key} className="min-w-0 rounded-xl bg-surface3/50 px-1 py-3">
                <p className="text-[21px] font-black leading-none tabular-nums text-ink sm:text-[25px]">
                  {normalCountdown[unit.key].toLocaleString('en-US')}
                </p>
                <p className="mt-1.5 text-[9px] font-medium text-ink3">{unit.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-surface3/50 px-3 py-5 text-center">
            <p className="break-all text-[40px] font-black leading-none tabular-nums tracking-tight text-ink sm:text-[48px]">
              {getCountdownValue(challenge, displayUnit, now).toLocaleString('en-US')}
            </p>
            <p className="mt-2 text-[11px] font-medium text-ink3">
              {SINGLE_UNIT_LABELS[displayUnit]}
            </p>
          </div>
        )}

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[10.5px]">
            <span className="font-semibold text-ink2">Day {day.toLocaleString('en-US')} / {challenge.durationDays.toLocaleString('en-US')}</span>
            <span className="text-ink3">{complete ? '100%' : `${Math.floor(progress).toLocaleString('en-US')}%`}</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-surface3"
            role="progressbar"
            aria-label="Challenge progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={complete ? 100 : Math.floor(progress)}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-[width] duration-500"
              style={{ width: `${complete ? 100 : progress}%` }}
            />
          </div>
        </div>
      </section>

      <section className="card flex items-start gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-violet-400/10 text-violet-300">
          <Sparkles className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-300">Today's message · Day {day.toLocaleString('en-US')}</p>
          <p className="mt-1.5 text-[13px] font-semibold leading-relaxed text-ink">
            {getDailyMessage(day, challenge.durationDays)}
          </p>
        </div>
      </section>

      <HealthSafetyCard />

      <CustomButton fullWidth variant="outline" onClick={onNewChallenge}>
        Choose a new challenge
      </CustomButton>
    </div>
  );
}
