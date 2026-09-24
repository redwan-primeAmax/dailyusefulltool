import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Flame,
  Clock,
  Sparkles,
  RotateCcw,
  Plus,
  Heart,
} from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { CustomButton } from '../../components/CustomButton';
import { TextField, Chip } from '../../components/ui/controls';
import { CircularProgress } from '../../components/CircularProgress';
import { useOS } from '../../context/OSContext';
import { useAddictionTracker } from './useAddictionTracker';
import {
  PRESET_ADDICTIONS,
  PRESET_REASONS,
  type PresetAddiction,
} from './addictionModel';
import { UrgeSurfingModal } from './components/UrgeSurfingModal';
import { DailyCheckInModal } from './components/DailyCheckInModal';
import { PhaseMilestones } from './components/PhaseMilestones';
import { DailyMotivationCard } from './components/DailyMotivationCard';
import { BadgesGrid } from './components/BadgesGrid';
import { ConfirmDialog } from '../../components/Modal';

export function AddictionRemoverApp() {
  const { openScreen, notify } = useOS();
  const tracker = useAddictionTracker();

  // Modals state
  const [sosOpen, setSosOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [relapseConfirmOpen, setRelapseConfirmOpen] = useState(false);

  // Setup / Onboarding state (when no active challenge)
  const [selectedPreset, setSelectedPreset] = useState<PresetAddiction | null>(PRESET_ADDICTIONS[0]);
  const [customName, setCustomName] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([PRESET_REASONS[0], PRESET_REASONS[1]]);
  const [newReasonInput, setNewReasonInput] = useState('');

  const activeGoal = tracker.activeGoal;

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason],
    );
  };

  const addCustomReason = () => {
    if (!newReasonInput.trim()) return;
    setSelectedReasons((prev) => [...prev, newReasonInput.trim()]);
    setNewReasonInput('');
  };

  const handleStartChallenge = () => {
    const finalName = selectedPreset ? selectedPreset.name : customName.trim();
    if (!finalName) {
      notify({ title: 'Please choose or name your target addiction', tone: 'warning' });
      return;
    }

    const category = selectedPreset ? selectedPreset.category : 'Personal Freedom';
    tracker.startChallenge(finalName, category, selectedReasons);
    notify({
      title: '21-Day Freedom Challenge Started! 🚀',
      description: `Target: Break ${finalName}. Your new life starts right now!`,
      tone: 'success',
    });
  };

  const handleUrgeSurfingVictory = (count: number) => {
    void tracker.logDailyCheckIn('great', 'Conquered acute craving with Urge Surfing SOS!', count);
    notify({
      title: '🎉 Craving Defeated!',
      description: 'Logged +1 Urge Resisted. Your willpower is growing stronger!',
      tone: 'success',
    });
  };

  /* ─────────────────────────────────────────────────────────────── */
  /*  VIEW 1: Setup & Onboarding (No Active Challenge)               */
  /* ─────────────────────────────────────────────────────────────── */
  if (!activeGoal || !activeGoal.active) {
    return (
      <ScreenShell
        title="Addiction Remover"
        subtitle="21-Day Neural Rewiring Challenge"
        icon={<ShieldCheck className="size-[19px]" />}
        onOpenSettings={() => openScreen('addiction', 'settings')}
        contentClassName="space-y-5"
      >
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-[28px] border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 via-surface2 to-surface3 p-6 shadow-2xl">
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="relative space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-emerald-300">
              <Sparkles className="size-3.5" /> 21-Day Transformation
            </span>
            <h2 className="text-[26px] font-black leading-tight tracking-tight text-ink">
              Break Any Addiction & Reclaim Your Life
            </h2>
            <p className="text-[13px] text-ink2 leading-relaxed max-w-[320px]">
              Based on neuroplasticity science: 21 consecutive days of conscious discipline breaks automated dopamine triggers and cements lifelong freedom.
            </p>
          </div>
        </div>

        {/* Step 1: Select or input target addiction */}
        <div className="card p-4 space-y-3">
          <div>
            <p className="text-[13px] font-bold text-ink">1. What habit do you want to quit?</p>
            <p className="text-[11.5px] text-ink3">Choose a common target or enter your own</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {PRESET_ADDICTIONS.map((preset) => {
              const active = selectedPreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset);
                    setCustomName('');
                  }}
                  className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/20 shadow-md scale-102'
                      : 'border-hairline bg-surface3/60 hover:bg-surface3'
                  }`}
                >
                  <span className="text-[22px] select-none">{preset.emoji}</span>
                  <div className="min-w-0">
                    <p className={`truncate text-[12.5px] font-bold ${active ? 'text-ink' : 'text-ink2'}`}>
                      {preset.name}
                    </p>
                    <p className="text-[10px] text-ink3">{preset.category}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <TextField
              label="Or Custom Addiction Name"
              placeholder="e.g. Energy drinks, Nail biting, Online Shopping..."
              value={customName}
              onChange={(val) => {
                setCustomName(val);
                setSelectedPreset(null);
              }}
            />
          </div>
        </div>

        {/* Step 2: "My Why" Motivation Selector */}
        <div className="card p-4 space-y-3">
          <div>
            <p className="text-[13px] font-bold text-ink">2. Why are you breaking this addiction?</p>
            <p className="text-[11.5px] text-ink3">Your reasons will be your shield during cravings</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_REASONS.map((reason) => {
              const active = selectedReasons.includes(reason);
              return (
                <Chip
                  key={reason}
                  active={active}
                  onClick={() => toggleReason(reason)}
                  className="text-[12px]"
                >
                  {active ? '✓ ' : '+ '} {reason}
                </Chip>
              );
            })}
          </div>

          <div className="flex items-end gap-2 pt-1">
            <TextField
              className="flex-1"
              placeholder="Add your personal reason..."
              value={newReasonInput}
              onChange={setNewReasonInput}
            />
            <CustomButton
              className="h-[46px]"
              variant="tonal"
              onClick={addCustomReason}
              leadingIcon={<Plus className="size-4" />}
            >
              Add
            </CustomButton>
          </div>
        </div>

        {/* Start Button CTA */}
        <div className="pt-2">
          <CustomButton
            variant="success"
            fullWidth
            size="lg"
            onClick={handleStartChallenge}
            leadingIcon={<Flame className="size-5" />}
            className="shadow-xl shadow-emerald-500/25 text-[16px] font-black h-14"
          >
            Start 21-Day Freedom Challenge! 🚀
          </CustomButton>
        </div>
      </ScreenShell>
    );
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  VIEW 2: Active Challenge Dashboard                             */
  /* ─────────────────────────────────────────────────────────────── */
  const { elapsedStats, motivation, badges, unlockedCount, todayCheckIn } = tracker;
  const isMasteryCompleted = elapsedStats.days >= 21;

  return (
    <ScreenShell
      title="Addiction Remover"
      subtitle={`${activeGoal.name} · Day ${elapsedStats.currentDay} of 21`}
      icon={<ShieldCheck className="size-[19px]" />}
      onOpenSettings={() => openScreen('addiction', 'settings')}
      contentClassName="space-y-5"
    >
      {/* ── TOP HERO: Live Elapsed Timer & Circular Ring ── */}
      <div className="flex flex-col items-center gap-5 px-4 pb-2 pt-4">
        <CircularProgress
          value={elapsedStats.progressPct / 100}
          size={216}
          thickness={18}
          from="#10b981"
          to={isMasteryCompleted ? '#f59e0b' : '#0ea5e9'}
          gradientId="addiction-ring"
          celebrate={isMasteryCompleted}
          trackClassName="stroke-white/8"
        >
          <div className="flex flex-col items-center">
            <span className="text-[36px] font-black leading-none tracking-tight text-ink tabular-nums">
              Day {elapsedStats.currentDay}
            </span>
            <span className="mt-1 text-[12px] font-bold uppercase tracking-wider text-emerald-400">
              {isMasteryCompleted ? '👑 21-DAY MASTER!' : `of 21 · ${elapsedStats.progressPct}%`}
            </span>
            <span className="mt-2 rounded-full bg-surface3/80 px-3 py-0.5 text-[11px] font-bold text-ink2 tabular-nums">
              {activeGoal.name}
            </span>
          </div>
        </CircularProgress>

        {/* Live Elapsed Digital Clock */}
        <div className="w-full space-y-2 rounded-3xl border border-hairline bg-surface2/80 p-4 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between border-b border-hairline pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-emerald-400" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-ink">
                Continuous Clean Time
              </span>
            </div>
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="rounded-2xl bg-surface3/60 p-2.5">
              <p className="text-[24px] font-black tabular-nums text-ink">{elapsedStats.days}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink3">Days</p>
            </div>
            <div className="rounded-2xl bg-surface3/60 p-2.5">
              <p className="text-[24px] font-black tabular-nums text-ink">{elapsedStats.hours}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink3">Hours</p>
            </div>
            <div className="rounded-2xl bg-surface3/60 p-2.5">
              <p className="text-[24px] font-black tabular-nums text-ink">{elapsedStats.minutes}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink3">Mins</p>
            </div>
            <div className="rounded-2xl bg-surface3/60 p-2.5">
              <p className="text-[24px] font-black tabular-nums text-emerald-400">{elapsedStats.seconds}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink3">Secs</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── EMERGENCY CRAVING SOS BUTTON ── */}
      <div className="px-1">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setSosOpen(true)}
          className="w-full flex items-center justify-between gap-3 rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 p-4 text-left shadow-lg shadow-amber-500/10"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500/30 text-amber-300 animate-pulse">
              <Flame className="size-6" />
            </span>
            <div>
              <p className="text-[14px] font-black text-ink">
                🚨 Craving Hit? Open 3-Min Urge SOS
              </p>
              <p className="text-[11.5px] text-amber-200/80">
                Grounding timer & wave-surfing guide to defeat any urge
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-500 px-3 py-1.5 text-[11px] font-black text-slate-950 shrink-0">
            SOS
          </span>
        </motion.button>
      </div>

      {/* ── DAILY MOTIVATION & VICTORY CHECK-IN CARD ── */}
      <DailyMotivationCard
        motivation={motivation}
        dayNumber={elapsedStats.currentDay}
        isCheckedInToday={Boolean(todayCheckIn)}
        onOpenCheckIn={() => setCheckInOpen(true)}
        onShare={() => {
          if (navigator.share) {
            void navigator.share({
              title: `Day ${elapsedStats.currentDay} Clean from ${activeGoal.name}!`,
              text: `“${motivation.quote}” — Day ${elapsedStats.currentDay} of my 21-Day Freedom Challenge!`,
            });
          } else {
            notify({ title: 'Quote copied to clipboard', tone: 'info' });
          }
        }}
      />

      {/* ── 21-DAY 3-PHASE PROGRESSION ROADMAP ── */}
      <PhaseMilestones currentDay={elapsedStats.currentDay} />

      {/* ── MILESTONE BADGES & TROPHIES ── */}
      <BadgesGrid badges={badges} unlockedCount={unlockedCount} />

      {/* ── "MY WHY" REINFORCEMENT ── */}
      {activeGoal.reasons.length > 0 && (
        <div className="card p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-rose-400" />
            <p className="text-[12px] font-bold uppercase tracking-wider text-ink">
              My Why & Commitments
            </p>
          </div>
          <div className="space-y-1.5">
            {activeGoal.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[12.5px] text-ink2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RELAPSE RESTART ASSISTANT ── */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => setRelapseConfirmOpen(true)}
          className="text-[12px] font-semibold text-ink3 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5 mx-auto"
        >
          <RotateCcw className="size-3.5" /> Had a slip or relapse? Restart streak with courage
        </button>
      </div>

      {/* ── MODALS ── */}
      <UrgeSurfingModal
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        addictionName={activeGoal.name}
        onVictory={handleUrgeSurfingVictory}
      />

      <DailyCheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        dayNumber={elapsedStats.currentDay}
        addictionName={activeGoal.name}
        onSave={(mood, note, cravings) => {
          void tracker.logDailyCheckIn(mood, note, cravings);
          notify({
            title: `Day ${elapsedStats.currentDay} Victory Recorded! 🏆`,
            description: 'Your self-control is growing stronger every day.',
            tone: 'success',
          });
        }}
      />

      <ConfirmDialog
        open={relapseConfirmOpen}
        tone="warning"
        title="Restart Challenge Streak?"
        description="A slip is not a failure — it is valuable data on your triggers. Resetting will preserve your history and start a fresh Day 1 immediately."
        confirmLabel="Restart Day 1"
        onCancel={() => setRelapseConfirmOpen(false)}
        onConfirm={() => {
          tracker.relapseAndRestart();
          setRelapseConfirmOpen(false);
          notify({
            title: 'Streak Reset — You Are Stronger Now! 💪',
            description: 'Day 1 begins right now. Focus on the next 24 hours.',
            tone: 'info',
          });
        }}
      />
    </ScreenShell>
  );
}
