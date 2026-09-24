import { BookOpenCheck, Info, Mic, Timer } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { Stepper, Toggle } from '../../components/ui/controls';
import { DangerZone } from '../../components/ui/DangerZone';
import { useSettings } from '../../hooks/useTracker';
import { DEFAULT_READER, SETTINGS_KEYS, type ReaderSettingsDoc } from '../../db/trackerService';
import { isSpeechSupported } from './speech';

export function ReaderSettings() {
  const { settings, update } = useSettings<ReaderSettingsDoc>(SETTINGS_KEYS.reader, DEFAULT_READER);
  const speech = isSpeechSupported();

  return (
    <ScreenShell
      title="Reader settings"
      subtitle="Chunking, voice & Pomodoro defaults"
      icon={<BookOpenCheck className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="Reading">
        <SettingsRow
          icon={<BookOpenCheck className="size-[17px]" />}
          label="Words per step"
          description="How many words appear at once"
          control={
            <Stepper value={settings.chunkSize} step={1} min={1} max={10}
              onChange={(chunkSize) => update({ chunkSize })} />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Voice navigation">
        <SettingsRow
          icon={<Mic className="size-[17px]" />}
          label="Auto-enable microphone"
          description="Start listening as soon as a session begins"
          control={
            <Toggle label="Auto voice" checked={settings.autoVoice}
              onChange={(autoVoice) => update({ autoVoice })} />
          }
        />
        <SettingsRow
          icon={<Mic className="size-[17px]" />}
          label="Recognition sensitivity"
          description={`${Math.round(settings.voiceThreshold * 100)}% — lower accepts less clear speech`}
          control={
            <Stepper
              value={Math.round(settings.voiceThreshold * 100)}
              step={5} min={40} max={95} suffix="%"
              onChange={(v) => update({ voiceThreshold: v / 100 })}
            />
          }
        />
        <SettingsRow
          icon={<Info className="size-[17px]" />}
          label="Browser support"
          description={speech ? 'Speech recognition is available' : 'This browser does not support speech recognition'}
        />
      </SettingsGroup>

      <SettingsGroup title="Pomodoro defaults">
        <SettingsRow
          icon={<Timer className="size-[17px]" />}
          label="Focus length"
          control={
            <Stepper value={settings.focusMin} step={5} min={5} max={90} suffix="m"
              onChange={(focusMin) => update({ focusMin })} />
          }
        />
        <SettingsRow
          icon={<Timer className="size-[17px]" />}
          label="Break length"
          control={
            <Stepper value={settings.breakMin} step={1} min={1} max={30} suffix="m"
              onChange={(breakMin) => update({ breakMin })} />
          }
        />
      </SettingsGroup>

      <DangerZone
        appName="Reader"
        actions={[{
          label: 'Reset reader settings',
          description: 'Restore chunk size, voice and Pomodoro defaults',
          settingsKeys: [{ key: SETTINGS_KEYS.reader, defaults: DEFAULT_READER }],
          confirmTitle: 'Reset reader settings?',
          confirmDescription: 'All reader preferences return to their factory values.',
        }]}
      />

      <section className="pb-2 text-center text-[11.5px] text-ink3">Reader · v1.0.0</section>
    </ScreenShell>
  );
}
