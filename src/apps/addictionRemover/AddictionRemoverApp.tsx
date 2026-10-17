import { useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { ConfirmDialog } from '../../components/Modal';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';
import type { ChallengeDifficulty } from '../../types';
import { ChallengeDashboard } from './components/ChallengeDashboard';
import { ChallengeSetup } from './components/ChallengeSetup';
import { useAddictionTracker } from './useAddictionTracker';

export function AddictionRemoverApp() {
  const { notify } = useOS();
  const tracker = useAddictionTracker();
  const [confirmNewChallenge, setConfirmNewChallenge] = useState(false);

  const startChallenge = async (difficulty: ChallengeDifficulty, name: string) => {
    try {
      await tracker.startChallenge(difficulty, name);
      notify({
        title: 'চ্যালেঞ্জ শুরু হয়েছে',
        description: 'প্রতিটি দিনই একটি নতুন পদক্ষেপ।',
        tone: 'success',
      });
    } catch {
      notify({ title: 'সেভ করা যায়নি', description: 'আবার চেষ্টা করো।', tone: 'danger' });
    }
  };

  const createNewChallenge = async () => {
    try {
      await tracker.resetChallenge();
      setConfirmNewChallenge(false);
    } catch {
      notify({ title: 'চ্যালেঞ্জ বদলানো যায়নি', description: 'আবার চেষ্টা করো।', tone: 'danger' });
    }
  };

  return (
    <ScreenShell
      title="আসক্তি চ্যালেঞ্জ"
      subtitle={tracker.challenge ? 'তোমার ব্যক্তিগত চ্যালেঞ্জ' : 'আজই তোমার চ্যালেঞ্জ বেছে নাও'}
      icon={<HeartHandshake className="size-[19px]" />}
      contentClassName="!space-y-0 !px-0 !pt-4"
    >
      {!tracker.settingsLoaded ? (
        <div className="px-4 py-16 text-center">
          <div className="mx-auto size-8 animate-pulse rounded-full bg-emerald-400/20" />
          <p className="mt-3 text-[12px] text-ink3">তোমার চ্যালেঞ্জ খোলা হচ্ছে…</p>
        </div>
      ) : tracker.challenge ? (
        <ChallengeDashboard
          challenge={tracker.challenge}
          displayUnit={tracker.displayUnit}
          now={tracker.now}
          onDisplayUnitChange={(unit) => void tracker.setDisplayUnit(unit)}
          onNewChallenge={() => setConfirmNewChallenge(true)}
        />
      ) : (
        <ChallengeSetup onStart={(difficulty, name) => void startChallenge(difficulty, name)} />
      )}

      <ConfirmDialog
        open={confirmNewChallenge}
        title="নতুন চ্যালেঞ্জ শুরু করবে?"
        description="বর্তমান কাউন্টডাউন ও দিন গণনা মুছে যাবে। তোমার নতুন চ্যালেঞ্জ বেছে নেওয়ার পর আবার শুরু হবে।"
        confirmLabel="নতুন চ্যালেঞ্জ"
        cancelLabel="ফিরে যাও"
        tone="warning"
        onConfirm={() => void createNewChallenge()}
        onCancel={() => setConfirmNewChallenge(false)}
      />
    </ScreenShell>
  );
}
