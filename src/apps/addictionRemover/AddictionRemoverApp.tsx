import { useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import type { AddictionGoal } from '../../types';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';
import { DailyCheckInModal } from './components/DailyCheckInModal';
import { RecoveryDashboard } from './components/RecoveryDashboard';
import { RecoverySetup } from './components/RecoverySetup';
import { UrgeSupportModal } from './components/UrgeSupportModal';
import type { RecoveryPlanDraft } from './addictionModel';
import { useAddictionTracker } from './useAddictionTracker';

const GENERIC_SUPPORT_PROFILE: AddictionGoal = {
  id: 'temporary-support',
  name: 'your next step',
  category: 'Personal',
  presetId: 'other',
  startTs: Date.now(),
  mode: 'explore',
  reasons: [],
  triggers: [],
  copingActions: [],
  supportName: '',
  supportPhone: '',
  active: true,
  relapses: 0,
};

export function AddictionRemoverApp() {
  const { openScreen, notify } = useOS();
  const tracker = useAddictionTracker();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [urgeSupportOpen, setUrgeSupportOpen] = useState(false);
  const profile = tracker.activeGoal;

  const startPlan = async (draft: RecoveryPlanDraft) => {
    try {
      await tracker.startPlan(draft);
      notify({
        title: 'Your plan is ready',
        description: 'Start with one step that feels safe and manageable.',
        tone: 'success',
      });
    } catch {
      notify({ title: 'Could not save your plan', description: 'Please check browser storage and try again.', tone: 'danger' });
    }
  };

  const saveCheckIn = async (draft: Parameters<typeof tracker.saveDailyCheckIn>[0]) => {
    const entry = await tracker.saveDailyCheckIn(draft);
    if (!entry) return;
    if (entry.mode === 'quit' && entry.goalMet === false) {
      notify({
        title: 'Thank you for checking in',
        description: 'A lapse does not erase your progress. Consider a safe next step or reaching out for support.',
        tone: 'info',
      });
    } else {
      notify({ title: 'Check-in saved', description: 'You showed up for yourself today.', tone: 'success' });
    }
  };

  return (
    <ScreenShell
      title="Addiction Remove"
      subtitle={profile ? `${profile.name} · a plan at your pace` : 'A private recovery companion'}
      icon={<HeartHandshake className="size-[19px]" />}
      onOpenSettings={profile ? () => openScreen('addiction', 'settings') : undefined}
      contentClassName="!space-y-0 !px-0 !pt-4"
    >
      {!tracker.settingsLoaded ? (
        <div className="px-4 py-16 text-center">
          <div className="mx-auto size-8 animate-pulse rounded-full bg-emerald-400/20" />
          <p className="mt-3 text-[12px] text-ink3">Opening your private plan…</p>
        </div>
      ) : profile ? (
        <RecoveryDashboard
          profile={profile}
          checkIns={tracker.checkIns}
          todayCheckIn={tracker.todayCheckIn}
          onOpenCheckIn={() => setCheckInOpen(true)}
          onOpenUrgeSupport={() => setUrgeSupportOpen(true)}
        />
      ) : (
        <div className="px-4">
          <RecoverySetup
            onStart={(draft) => void startPlan(draft)}
            onNeedSupport={() => setUrgeSupportOpen(true)}
          />
        </div>
      )}

      <DailyCheckInModal
        open={checkInOpen && Boolean(profile)}
        onClose={() => setCheckInOpen(false)}
        profile={profile ?? GENERIC_SUPPORT_PROFILE}
        existing={tracker.todayCheckIn}
        dayNumber={tracker.journeyDay}
        onSave={saveCheckIn}
      />
      <UrgeSupportModal
        open={urgeSupportOpen}
        onClose={() => setUrgeSupportOpen(false)}
        profile={profile ?? GENERIC_SUPPORT_PROFILE}
      />
    </ScreenShell>
  );
}
