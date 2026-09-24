import { useState } from 'react';
import { Flame, Target, Trash2 } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { Stepper, Toggle } from '../../components/ui/controls';
import { ConfirmDialog } from '../../components/Modal';
import { useOS } from '../../context/OSContext';
import { useSettings } from '../../hooks/useTracker';
import { clearStore } from '../../db/indexedDB';
import { DEFAULT_HABITS, SETTINGS_KEYS, type HabitSettings } from '../../db/trackerService';

export function HabitsSettings() {
  const { notify } = useOS();
  const { settings, update } = useSettings<HabitSettings>(SETTINGS_KEYS.habits, DEFAULT_HABITS);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <ScreenShell
      title="Habit settings"
      subtitle="Goals & behaviour"
      icon={<Flame className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="Daily goal">
        <SettingsRow
          icon={<Target className="size-[17px]" />}
          label="Habits per day"
          description="Target used for the progress ring"
          control={
            <Stepper value={settings.dailyGoal} step={1} min={1} max={12}
              onChange={(dailyGoal) => update({ dailyGoal })} />
          }
        />
        <SettingsRow
          icon={<Flame className="size-[17px]" />}
          label="Streak flames"
          description="Show 🔥 next to active streaks"
          control={
            <Toggle label="Streak flames" checked={settings.showStreakFlames}
              onChange={(showStreakFlames) => update({ showStreakFlames })} />
          }
        />
        <SettingsRow
          icon={<Flame className="size-[17px]" />}
          label="Week starts Monday"
          description="Otherwise the week starts on Sunday"
          control={
            <Toggle label="Week start" checked={settings.weekStartsMonday}
              onChange={(weekStartsMonday) => update({ weekStartsMonday })} />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Data">
        <SettingsRow
          danger
          icon={<Trash2 className="size-[17px]" />}
          label="Clear all habit history"
          description="Completion records will be permanently removed"
          onClick={() => setConfirmClear(true)}
        />
      </SettingsGroup>

      <ConfirmDialog
        open={confirmClear}
        tone="danger"
        title="Clear all habit history?"
        description="Every completion tick across all habits will be erased."
        confirmLabel="Clear"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          void clearStore('habits');
          setConfirmClear(false);
          notify({ title: 'Habit history cleared', tone: 'warning' });
        }}
      />

      <section className="pb-2 text-center text-[11.5px] text-ink3">Habit Tracker · v1.9.0</section>
    </ScreenShell>
  );
}
