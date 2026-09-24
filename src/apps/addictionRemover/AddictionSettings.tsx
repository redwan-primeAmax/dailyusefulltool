import { useState } from 'react';
import {
  ShieldCheck,
  Target,
  Flame,
  Clock,
  Calendar,
} from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { TextField, Toggle, Stepper } from '../../components/ui/controls';
import { CustomButton } from '../../components/CustomButton';
import { ConfirmDialog } from '../../components/Modal';
import { DangerZone } from '../../components/ui/DangerZone';
import { useOS } from '../../context/OSContext';
import { useAddictionTracker } from './useAddictionTracker';
import { SETTINGS_KEYS } from '../../db/trackerService';
import { DEFAULT_ADDICTION } from '../../db/trackerService';

export function AddictionSettings() {
  const { notify, goBack } = useOS();
  const tracker = useAddictionTracker();
  const { activeGoal, updateGoal, relapseAndRestart, resetAllData } = tracker;

  const [editName, setEditName] = useState(activeGoal?.name ?? '');
  const [targetDays, setTargetDays] = useState(activeGoal?.targetDays ?? 21);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleSaveGoal = () => {
    if (!editName.trim()) {
      notify({ title: 'Addiction name cannot be blank', tone: 'warning' });
      return;
    }
    updateGoal({
      name: editName.trim(),
      targetDays: Math.max(7, Math.min(365, targetDays)),
    });
    notify({ title: 'Goal settings updated', tone: 'success' });
  };

  const handleAdjustStartTime = (daysAgo: number) => {
    if (!activeGoal) return;
    const newStartTs = Date.now() - daysAgo * 86400 * 1000;
    updateGoal({ startTs: newStartTs });
    notify({
      title: 'Start time adjusted',
      description: `Streak shifted by ${daysAgo} days`,
      tone: 'info',
    });
  };

  return (
    <ScreenShell
      title="Addiction settings"
      subtitle="Goal, streak & milestone options"
      icon={<ShieldCheck className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      {activeGoal && (
        <SettingsGroup title="Current challenge">
          <div className="p-4 space-y-3">
            <TextField
              label="Target Addiction / Habit Name"
              value={editName}
              onChange={setEditName}
              placeholder="e.g. Smoking, Sugar, Social Media..."
            />
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-[13px] font-bold text-ink">Challenge Duration</p>
                <p className="text-[11px] text-ink3">Standard neural rewiring is 21 days</p>
              </div>
              <Stepper
                value={targetDays}
                min={7}
                max={90}
                step={7}
                suffix=" days"
                onChange={setTargetDays}
              />
            </div>
            <CustomButton
              variant="tonal"
              fullWidth
              onClick={handleSaveGoal}
            >
              Update Goal Details
            </CustomButton>
          </div>
        </SettingsGroup>
      )}

      {activeGoal && (
        <SettingsGroup title="Start time adjustments" description="If you quit earlier, adjust your starting baseline.">
          <SettingsRow
            icon={<Clock className="size-[17px]" />}
            label="Quit today"
            description="Reset start timestamp to right now"
            onClick={() => handleAdjustStartTime(0)}
          />
          <SettingsRow
            icon={<Calendar className="size-[17px]" />}
            label="Quit 1 day ago (+24h)"
            description="Add 1 day to existing streak"
            onClick={() => handleAdjustStartTime(1)}
          />
          <SettingsRow
            icon={<Calendar className="size-[17px]" />}
            label="Quit 3 days ago (+72h)"
            description="Add 3 days to existing streak"
            onClick={() => handleAdjustStartTime(3)}
          />
          <SettingsRow
            icon={<Calendar className="size-[17px]" />}
            label="Quit 1 week ago (+7d)"
            description="Add 7 days to existing streak"
            onClick={() => handleAdjustStartTime(7)}
          />
        </SettingsGroup>
      )}

      <SettingsGroup title="Support tools">
        <SettingsRow
          icon={<Flame className="size-[17px]" />}
          label="Urge Surfing SOS Tool"
          description="Emergency 3-minute craving wave timer on dashboard"
          control={
            <Toggle
              label="Urge SOS"
              checked={tracker.settings.enableUrgeSOS}
              onChange={(enableUrgeSOS) => tracker.update({ enableUrgeSOS })}
            />
          }
        />
        <SettingsRow
          icon={<Target className="size-[17px]" />}
          label="Daily Victory Reminder"
          description="Encourages daily check-in and mood logging"
          control={
            <Toggle
              label="Daily Reminder"
              checked={tracker.settings.dailyReminder}
              onChange={(dailyReminder) => tracker.update({ dailyReminder })}
            />
          }
        />
      </SettingsGroup>

      {/* Danger Zone */}
      <DangerZone
        appName="Addiction Remover"
        actions={[
          {
            label: 'Restart active streak (Day 1)',
            description: 'Log a slip/relapse and restart with a clean Day 1',
            confirmTitle: 'Restart active streak?',
            confirmDescription: 'Your previous run will be preserved in history and your counter will restart at Day 1.',
            stores: [],
          },
          {
            label: 'Erase all addiction history & data',
            description: 'Permanently wipe all goals, check-ins, and milestone logs',
            stores: ['addictionCheckIns'],
            settingsKeys: [{ key: SETTINGS_KEYS.addiction, defaults: DEFAULT_ADDICTION }],
            confirmTitle: 'Erase all addiction history?',
            confirmDescription: 'This will completely reset the Addiction Remover module to a clean uninitialized state.',
          },
        ]}
        onCleared={() => {
          void resetAllData();
          goBack();
        }}
      />

      <section className="pb-2 text-center text-[11.5px] text-ink3">
        Addiction Remover · v1.0.0 · 21-Day Neural Rewiring
      </section>

      <ConfirmDialog
        open={resetConfirmOpen}
        tone="warning"
        title="Restart Challenge Streak?"
        description="Resetting your streak will keep your previous challenge recorded in history and begin a fresh Day 1."
        confirmLabel="Restart Day 1"
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          relapseAndRestart();
          setResetConfirmOpen(false);
          notify({ title: 'Streak reset — fresh start begins now! 💪', tone: 'info' });
          goBack();
        }}
      />
    </ScreenShell>
  );
}
