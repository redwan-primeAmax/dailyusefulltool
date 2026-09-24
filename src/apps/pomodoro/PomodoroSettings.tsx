import { Timer, RotateCcw, Bell, Flame } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { Stepper, Toggle } from '../../components/ui/controls';
import { useSettings } from '../../hooks/useTracker';
import { DEFAULT_POMODORO, SETTINGS_KEYS, type PomodoroSettings as PomSettings } from '../../db/trackerService';

/** Pomodoro — dedicated settings screen (opened from the top settings gear). */
export function PomodoroSettings() {
  const { settings, update, reset } = useSettings<PomSettings>(SETTINGS_KEYS.pomodoro, DEFAULT_POMODORO);

  return (
    <ScreenShell
      title="Pomodoro settings"
      subtitle="Tune your focus & break cycles"
      icon={<Timer className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="Session lengths" description="Minutes for each phase of a cycle.">
        <SettingsRow
          icon={<Flame className="size-[17px]" />}
          label="Focus"
          description="Main work block"
          control={
            <Stepper
              value={settings.focusMin}
              step={5}
              min={5}
              max={120}
              suffix="m"
              onChange={(focusMin) => update({ focusMin })}
            />
          }
        />
        <SettingsRow
          icon={<Timer className="size-[17px]" />}
          label="Short break"
          description="After every focus block"
          control={
            <Stepper
              value={settings.shortMin}
              step={1}
              min={1}
              max={30}
              suffix="m"
              onChange={(shortMin) => update({ shortMin })}
            />
          }
        />
        <SettingsRow
          icon={<Timer className="size-[17px]" />}
          label="Long break"
          description="After a full set of sessions"
          control={
            <Stepper
              value={settings.longMin}
              step={5}
              min={5}
              max={60}
              suffix="m"
              onChange={(longMin) => update({ longMin })}
            />
          }
        />
        <SettingsRow
          icon={<Timer className="size-[17px]" />}
          label="Sessions per set"
          description="Focus blocks before a long break"
          control={
            <Stepper
              value={settings.sessionsBetweenLong}
              step={1}
              min={2}
              max={8}
              suffix=""
              onChange={(sessionsBetweenLong) => update({ sessionsBetweenLong })}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Behaviour">
        <SettingsRow
          icon={<Bell className="size-[17px]" />}
          label="Auto-advance"
          description="Jump to the next phase when a timer ends"
          control={
            <Toggle
              label="Auto-advance"
              checked={settings.autoAdvance}
              onChange={(autoAdvance) => update({ autoAdvance })}
            />
          }
        />
        <SettingsRow
          icon={<RotateCcw className="size-[17px]" />}
          label="Reset to defaults"
          description="25m focus · 5m short · 15m long"
          onClick={reset}
        />
      </SettingsGroup>

      <section className="pb-2 text-center text-[11.5px] text-ink3">
        Pomodoro · v3.0.0 · a focused mind beats a busy mind
      </section>
    </ScreenShell>
  );
}
