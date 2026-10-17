import { useEffect, useState } from 'react';
import { Heart, Save, ShieldCheck } from 'lucide-react';
import type { AddictionCheckIn, AddictionGoal } from '../../../types';
import { CustomButton } from '../../../components/CustomButton';
import { Modal } from '../../../components/Modal';
import { Slider } from '../../../components/ui/controls';
import type { DailyCheckInDraft } from '../useAddictionTracker';
import { getGoalQuestion } from '../addictionModel';

const MOODS: { id: AddictionCheckIn['mood']; label: string; emoji: string }[] = [
  { id: 'great', label: 'Good', emoji: '🌤️' },
  { id: 'good', label: 'Okay', emoji: '🙂' },
  { id: 'neutral', label: 'Steady', emoji: '🌿' },
  { id: 'struggling', label: 'Hard', emoji: '🌧️' },
  { id: 'skipped', label: 'Skip', emoji: '—' },
];

type CheckInOutcome = AddictionCheckIn['goalMet'];

export function DailyCheckInModal({
  open,
  onClose,
  profile,
  existing,
  dayNumber,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  profile: AddictionGoal;
  existing?: AddictionCheckIn;
  dayNumber: number;
  onSave: (draft: DailyCheckInDraft) => Promise<unknown> | unknown;
}) {
  const [mood, setMood] = useState<AddictionCheckIn['mood']>('skipped');
  const [cravingLevel, setCravingLevel] = useState(0);
  const [goalMet, setGoalMet] = useState<CheckInOutcome>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const mode = profile.mode ?? 'quit';

  useEffect(() => {
    if (!open) return;
    setMood(existing?.mood ?? 'skipped');
    setCravingLevel(existing?.cravingLevel ?? 0);
    setGoalMet(existing?.goalMet ?? null);
    setNote(existing?.note ?? '');
    setError('');
  }, [open, existing]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave({ mood, cravingLevel, goalMet: goalMet ?? null, note: note.trim() || undefined });
      onClose();
    } catch {
      setError('Your check-in could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const question = getGoalQuestion(mode, profile.name);
  const positiveAnswer = mode === 'explore' ? 'Yes, I did' : 'Yes, today';
  const negativeAnswer = mode === 'explore' ? 'Not today' : 'Not today';

  return (
    <Modal
      open={open}
      onClose={onClose}
      sheet
      className="max-h-[88dvh] overflow-y-auto"
      title={`Day ${dayNumber} check-in`}
      description="A check-in is a moment to notice, not a test. Skip anything you do not want to answer."
      footer={(
        <>
          <CustomButton variant="ghost" fullWidth onClick={onClose} disabled={saving}>Not now</CustomButton>
          <CustomButton variant="success" fullWidth onClick={() => void save()} loading={saving} leadingIcon={<Save className="size-4" />}>
            Save check-in
          </CustomButton>
        </>
      )}
    >
      <div className="space-y-5">
        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink3">How are you feeling?</p>
          <div className="grid grid-cols-5 gap-1.5">
            {MOODS.map((item) => {
              const active = mood === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setMood(item.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border p-2 transition-colors ${active ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-hairline bg-surface3/45'}`}
                >
                  <span className="text-[22px]" aria-hidden="true">{item.emoji}</span>
                  <span className="text-[10px] font-semibold text-ink2">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-hairline bg-surface3/40 p-3.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold text-ink">How strong was the urge?</p>
              <p className="text-[10.5px] text-ink3">Optional · 0 is none, 10 is very strong</p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-[14px] font-black tabular-nums text-amber-300">{cravingLevel}</span>
          </div>
          <Slider value={cravingLevel} onChange={setCravingLevel} min={0} max={10} ariaLabel="Urge strength from zero to ten" />
        </section>

        <section>
          <p className="mb-2 text-[12px] font-bold text-ink">{question}</p>
          {profile.planText && <p className="mb-2 rounded-xl bg-surface3/45 p-2.5 text-[11px] leading-relaxed text-ink3">My next goal: {profile.planText}</p>}
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: true, label: positiveAnswer },
              { value: false, label: negativeAnswer },
            ].map((option) => {
              const active = goalMet === option.value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setGoalMet(option.value)}
                  className={`rounded-2xl border px-3 py-3 text-[11.5px] font-bold transition-colors ${active ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : 'border-hairline bg-surface3/40 text-ink2'}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setGoalMet(null)} className={`mt-2 w-full rounded-xl px-3 py-2 text-[10.5px] font-semibold ${goalMet === null ? 'bg-surface3 text-ink2' : 'text-ink3'}`}>
            Skip this question
          </button>
          {mode === 'quit' && goalMet === false && (
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-sky-500/[0.08] p-3 text-[11px] leading-relaxed text-sky-100/80">
              <Heart className="mt-0.5 size-4 shrink-0 text-sky-300" />
              A lapse does not erase your progress. If useful, note what was happening and choose one safe next step.
            </div>
          )}
        </section>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink3">Anything you want to remember? (optional)</span>
          <textarea
            name="recovery-checkin-note"
            autoComplete="off"
            autoCorrect="off"
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="A thought, a trigger, or something that helped…"
            className="w-full resize-none rounded-2xl border border-hairline bg-surface3/60 px-4 py-3 text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink3 focus:border-accent/60"
          />
        </label>

        {error && <p role="alert" className="text-[11px] font-medium text-red-300">{error}</p>}
        <p className="flex items-start gap-2 text-[10.5px] leading-relaxed text-ink3">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
          This stays in this browser unless you export a device backup. You can clear it in Settings.
        </p>
      </div>
    </Modal>
  );
}
