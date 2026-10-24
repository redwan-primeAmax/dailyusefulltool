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
        title: 'Challenge started',
        description: 'Every day is a new step forward.',
        tone: 'success',
      });
    } catch {
      notify({ title: 'Could not save the challenge', description: 'Please try again.', tone: 'danger' });
    }
  };

  const createNewChallenge = async () => {
    try {
      await tracker.resetChallenge();
      setConfirmNewChallenge(false);
    } catch {
      notify({ title: 'Could not reset the challenge', description: 'Please try again.', tone: 'danger' });
    }
  };

  return (
    <ScreenShell
      title="Addiction Challenge"
      subtitle={tracker.challenge ? 'Your personal challenge' : 'Choose your challenge'}
      icon={<HeartHandshake className="size-[19px]" />}
      contentClassName="!space-y-0 !px-0 !pt-4"
    >
      {!tracker.settingsLoaded ? (
        <div className="px-4 py-16 text-center">
          <div className="mx-auto size-8 animate-pulse rounded-full bg-emerald-400/20" />
          <p className="mt-3 text-[12px] text-ink3">Loading your challenge…</p>
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
        title="Start a new challenge?"
        description="Your current countdown and day count will be reset. The new challenge will begin after you choose it."
        confirmLabel="Start new challenge"
        cancelLabel="Go back"
        tone="warning"
        onConfirm={() => void createNewChallenge()}
        onCancel={() => setConfirmNewChallenge(false)}
      />
    </ScreenShell>
  );
}
