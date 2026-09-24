import { useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { CustomButton } from '../../../components/CustomButton';
import { Stepper, TextField } from '../../../components/ui/controls';

interface DailyCheckInModalProps {
  open: boolean;
  onClose: () => void;
  dayNumber: number;
  addictionName: string;
  onSave: (mood: 'great' | 'good' | 'neutral' | 'struggling', note?: string, cravingsResisted?: number) => void;
}

const MOODS: { id: 'great' | 'good' | 'neutral' | 'struggling'; label: string; emoji: string; color: string }[] = [
  { id: 'great', label: 'Empowered', emoji: '🔥', color: '#10b981' },
  { id: 'good', label: 'Strong', emoji: '💪', color: '#0ea5e9' },
  { id: 'neutral', label: 'Steady', emoji: '🧘', color: '#f59e0b' },
  { id: 'struggling', label: 'Challenged', emoji: '🛡️', color: '#ef4444' },
];

export function DailyCheckInModal({
  open,
  onClose,
  dayNumber,
  addictionName,
  onSave,
}: DailyCheckInModalProps) {
  const [selectedMood, setSelectedMood] = useState<'great' | 'good' | 'neutral' | 'struggling'>('great');
  const [cravingsCount, setCravingsCount] = useState(1);
  const [journalNote, setJournalNote] = useState('');

  const handleCommit = () => {
    onSave(selectedMood, journalNote.trim() || undefined, cravingsCount);
    setJournalNote('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sheet
      title={`Day ${dayNumber} Victory Check-In 🏆`}
      description={`Record your daily victory remaining clean from ${addictionName}. Every day cements new neural pathways.`}
      footer={
        <>
          <CustomButton variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </CustomButton>
          <CustomButton
            variant="success"
            fullWidth
            onClick={handleCommit}
            leadingIcon={<Sparkles className="size-4" />}
          >
            Log Day {dayNumber} Clean!
          </CustomButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Mood selection */}
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink3">
            How do you feel today?
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MOODS.map((m) => {
              const active = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 transition-all ${
                    active
                      ? 'border-emerald-500/50 bg-emerald-500/20 shadow-md scale-105'
                      : 'border-hairline bg-surface3/60 hover:bg-surface3'
                  }`}
                >
                  <span className="text-[24px]">{m.emoji}</span>
                  <span className={`text-[11px] font-bold ${active ? 'text-ink' : 'text-ink3'}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cravings Resisted */}
        <div className="flex items-center justify-between rounded-2xl border border-hairline bg-surface3/60 p-3.5">
          <div>
            <p className="text-[13px] font-bold text-ink">Cravings Resisted Today</p>
            <p className="text-[11px] text-ink3">Each urge resisted strengthens self-control</p>
          </div>
          <Stepper
            value={cravingsCount}
            min={0}
            max={50}
            step={1}
            suffix=" urges"
            onChange={setCravingsCount}
          />
        </div>

        {/* Daily reflection note */}
        <TextField
          label="Daily Reflection / Victory Notes (optional)"
          placeholder="e.g. Felt a slight craving around 3 PM, drank water and took a walk. Proud of my discipline!"
          value={journalNote}
          onChange={setJournalNote}
        />

        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-3 text-[12px] font-medium text-emerald-300">
          <Trophy className="size-4 shrink-0 text-emerald-400" />
          <span>Keep up the streak! You are 1 day closer to completing your 21-Day Challenge.</span>
        </div>
      </div>
    </Modal>
  );
}
