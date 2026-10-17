import { useEffect, useState } from 'react';
import { Check, Clock3, HeartHandshake, Phone, ShieldAlert, Wind } from 'lucide-react';
import type { AddictionGoal } from '../../../types';
import { CustomButton } from '../../../components/CustomButton';
import { CircularProgress } from '../../../components/CircularProgress';
import { Modal } from '../../../components/Modal';
import { formatDuration } from '../../../utils/format';
import { COPING_ACTIONS } from '../addictionModel';

const PAUSE_SECONDS = 120;

export function UrgeSupportModal({
  open,
  onClose,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  profile: AddictionGoal;
}) {
  const [secondsLeft, setSecondsLeft] = useState(PAUSE_SECONDS);
  const [checked, setChecked] = useState<string[]>([]);
  const actions = profile.copingActions?.length ? profile.copingActions : COPING_ACTIONS.slice(0, 4);
  const phone = (profile.supportPhone ?? '').replace(/[^\d+*#]/g, '');
  const progress = (PAUSE_SECONDS - secondsLeft) / PAUSE_SECONDS;

  useEffect(() => {
    if (!open) {
      setSecondsLeft(PAUSE_SECONDS);
      setChecked([]);
      return;
    }
    const timer = window.setInterval(() => setSecondsLeft((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  const toggle = (action: string) => {
    setChecked((current) => current.includes(action)
      ? current.filter((item) => item !== action)
      : [...current, action]);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sheet
      className="max-h-[88dvh] overflow-y-auto"
      title="Pause with support"
      description="You do not have to solve everything right now. Choose one safe next step."
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-amber-400/15 bg-amber-500/[0.07] p-4">
          <CircularProgress
            value={progress}
            size={142}
            thickness={11}
            from="#fbbf24"
            to="#34d399"
            gradientId="recovery-pause-timer"
            trackClassName="stroke-white/8"
          >
            <div className="text-center">
              <Clock3 className="mx-auto mb-1 size-4 text-amber-300" />
              <p className="text-[25px] font-black tabular-nums text-ink">{formatDuration(secondsLeft)}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-300">Optional pause</p>
            </div>
          </CircularProgress>
          <p className="max-w-[270px] text-center text-[11.5px] leading-relaxed text-ink3">
            A timer cannot make an urge disappear, but it can give you a little room to choose what happens next. You can close it at any time.
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-sky-400/15 bg-sky-500/[0.07] p-3">
          <Wind className="mt-0.5 size-4 shrink-0 text-sky-300" />
          <p className="text-[11.5px] leading-relaxed text-sky-100/80">
            Try this: put both feet on the floor, breathe out slowly, and name five things you can see. If that does not help, choose another step or contact someone.
          </p>
        </div>

        <section>
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-ink3">Your chosen next steps</p>
          <div className="space-y-2">
            {actions.map((action) => {
              const done = checked.includes(action);
              return (
                <button
                  key={action}
                  type="button"
                  aria-pressed={done}
                  onClick={() => toggle(action)}
                  className={`flex w-full items-start gap-2.5 rounded-2xl border p-3 text-left ${done ? 'border-emerald-400/35 bg-emerald-500/[0.08]' : 'border-hairline bg-surface3/40'}`}
                >
                  <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${done ? 'border-emerald-400 bg-emerald-400 text-emerald-950' : 'border-ink3/40'}`}>
                    {done && <Check className="size-3.5" />}
                  </span>
                  <span className="text-[11.5px] leading-relaxed text-ink2">{action}</span>
                </button>
              );
            })}
          </div>
        </section>

        {(profile.supportName || phone) && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] p-3">
            <HeartHandshake className="size-5 shrink-0 text-emerald-300" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink3">Someone you chose</p>
              <p className="truncate text-[12.5px] font-bold text-ink">{profile.supportName || 'Trusted support'}</p>
            </div>
            {phone && <a href={`tel:${phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 text-[11px] font-bold text-emerald-200"><Phone className="size-3.5" /> Call</a>}
          </div>
        )}

        <div className="rounded-2xl border border-red-400/15 bg-red-500/[0.06] p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-300" />
            <p className="text-[11px] leading-relaxed text-ink2">
              If there may be an overdose, trouble breathing, a seizure, severe confusion, or immediate risk of harm, skip this tool and get emergency help now.
            </p>
          </div>
          <a href="tel:999" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-400/15 px-3 py-1.5 text-[10.5px] font-bold text-red-200">
            <Phone className="size-3" /> 999 in Bangladesh · local number elsewhere
          </a>
        </div>

        <CustomButton variant="outline" fullWidth onClick={onClose}>
          {secondsLeft === 0 ? 'Close pause' : 'I have a next step'}
        </CustomButton>
      </div>
    </Modal>
  );
}
