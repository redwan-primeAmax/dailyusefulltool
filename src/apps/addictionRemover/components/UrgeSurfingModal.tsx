import { useState, useEffect } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { CustomButton } from '../../../components/CustomButton';
import { CircularProgress } from '../../../components/CircularProgress';
import { formatDuration } from '../../../utils/format';

interface UrgeSurfingModalProps {
  open: boolean;
  onClose: () => void;
  onVictory: (cravingsCount: number) => void;
  addictionName?: string;
}

const DISTRACTION_STEPS = [
  { id: 1, text: 'Drink a cold glass of fresh water 💧', tip: 'Physical sensation resets the dopamine cue' },
  { id: 2, text: 'Change your physical room or take a brisk walk 🚶', tip: 'Breaking environmental context interrupts the craving loop' },
  { id: 3, text: 'Take 5 slow, deep belly breaths 🫁', tip: 'Activates the parasympathetic nervous system to lower heart rate' },
  { id: 4, text: 'Remember your "Why" — freedom is worth it 🛡️', tip: 'Neuroscience shows urges peak at 3 minutes and naturally fade' },
];

export function UrgeSurfingModal({
  open,
  onClose,
  onVictory,
  addictionName = 'craving',
}: UrgeSurfingModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(180); // 3 minutes = 180 seconds
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!open) {
      setSecondsLeft(180);
      setCheckedSteps([]);
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [open]);

  const toggleStep = (id: number) => {
    setCheckedSteps((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleVictory = () => {
    onVictory(1);
    onClose();
  };

  const progress = (180 - secondsLeft) / 180;
  const isComplete = secondsLeft === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      sheet
      title="🚨 Craving SOS — Urge Surfing"
      description={`Ride the wave without giving in to ${addictionName}. Cravings peak and dissipate in 3 minutes.`}
    >
      <div className="space-y-5 py-2">
        {/* 3-Minute Urge Timer */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
          <CircularProgress
            value={progress}
            size={160}
            thickness={14}
            from="#f59e0b"
            to={isComplete ? '#10b981' : '#f97316'}
            gradientId="sos-timer"
            celebrate={isComplete}
            trackClassName="stroke-white/10"
          >
            <div className="flex flex-col items-center">
              <span className="text-[32px] font-black tabular-nums tracking-tight text-ink">
                {formatDuration(secondsLeft)}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                {isComplete ? 'WAVE CONQUERED!' : 'RIDE THE WAVE'}
              </span>
            </div>
          </CircularProgress>

          <p className="text-center text-[12px] font-medium text-ink2 leading-relaxed max-w-[280px]">
            {isComplete
              ? '🎉 Outstanding victory! The craving wave has passed. Your brain has rewired stronger.'
              : 'Observe the urge like an ocean wave: it rises, peaks, and naturally fades away.'}
          </p>
        </div>

        {/* Action checklist */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink3 px-1">
            4 Instant Grounding Actions
          </p>
          <div className="space-y-2">
            {DISTRACTION_STEPS.map((step, idx) => {
              const isChecked = checkedSteps.includes(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className={`w-full flex items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                    isChecked
                      ? 'border-emerald-500/40 bg-emerald-500/15'
                      : 'border-hairline bg-surface3/60 hover:bg-surface3'
                  }`}
                >
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border border-hairline">
                    {isChecked ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : (
                      <span className="text-[11px] font-bold text-ink3">{idx + 1}</span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-bold ${isChecked ? 'text-emerald-200 line-through' : 'text-ink'}`}>
                      {step.text}
                    </p>
                    <p className="text-[11px] text-ink3 mt-0.5">{step.tip}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2 pt-2">
          <CustomButton
            variant="success"
            fullWidth
            size="lg"
            onClick={handleVictory}
            leadingIcon={<Sparkles className="size-5" />}
          >
            I Conquered This Craving! (+1 Victory)
          </CustomButton>

          <CustomButton
            variant="ghost"
            fullWidth
            onClick={onClose}
          >
            Close SOS
          </CustomButton>
        </div>
      </div>
    </Modal>
  );
}
