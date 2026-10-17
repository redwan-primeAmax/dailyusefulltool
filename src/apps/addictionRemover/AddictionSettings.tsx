import { useEffect, useState } from 'react';
import { HeartHandshake, ShieldCheck, UserRound } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup } from '../../components/ui/SettingsRow';
import { TextField } from '../../components/ui/controls';
import { CustomButton } from '../../components/CustomButton';
import { DangerZone } from '../../components/ui/DangerZone';
import { useOS } from '../../context/OSContext';
import { DEFAULT_ADDICTION, SETTINGS_KEYS } from '../../db/trackerService';
import type { RecoveryMode } from '../../types';
import { HealthSafetyCard } from './components/HealthSafetyCard';
import { RECOVERY_MODES } from './addictionModel';
import { useAddictionTracker } from './useAddictionTracker';

function lines(values: string[] | undefined): string {
  return (values ?? []).join('\n');
}

function parseLines(value: string): string[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

export function AddictionSettings() {
  const { notify, goBack } = useOS();
  const tracker = useAddictionTracker();
  const profile = tracker.activeGoal;
  const [name, setName] = useState('');
  const [mode, setMode] = useState<RecoveryMode>('explore');
  const [planText, setPlanText] = useState('');
  const [reasons, setReasons] = useState('');
  const [triggers, setTriggers] = useState('');
  const [copingActions, setCopingActions] = useState('');
  const [supportName, setSupportName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setMode(profile.mode ?? 'quit');
    setPlanText(profile.planText ?? '');
    setReasons(lines(profile.reasons));
    setTriggers(lines(profile.triggers));
    setCopingActions(lines(profile.copingActions));
    setSupportName(profile.supportName ?? '');
    setSupportPhone(profile.supportPhone ?? '');
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    if (!name.trim()) {
      notify({ title: 'Give your plan a name first', tone: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await tracker.updateGoal({
        name: name.trim(),
        mode,
        planText: planText.trim(),
        reasons: parseLines(reasons),
        triggers: parseLines(triggers),
        copingActions: parseLines(copingActions),
        supportName: supportName.trim(),
        supportPhone: supportPhone.trim(),
      });
      notify({ title: 'Recovery plan updated', tone: 'success' });
    } catch {
      notify({ title: 'Could not save changes', description: 'Please try again.', tone: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell
      title="Recovery plan settings"
      subtitle="Keep the plan practical and safe for you"
      icon={<HeartHandshake className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      {!tracker.settingsLoaded ? (
        <div className="card p-4 text-center text-[12px] text-ink3">Opening your private plan settings…</div>
      ) : profile ? (
        <>
          <SettingsGroup title="Your plan" description="Change any of these whenever your needs change.">
            <div className="space-y-4 p-4">
              <TextField label="What are you working on?" value={name} onChange={setName} placeholder="Name your target" />
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink3">Your current goal</p>
                <div className="space-y-2">
                  {RECOVERY_MODES.map((item) => {
                    const active = mode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setMode(item.id)}
                        className={`w-full rounded-2xl border p-3 text-left ${active ? 'border-emerald-400/40 bg-emerald-500/[0.08]' : 'border-hairline bg-surface3/35'}`}
                      >
                        <span className="text-[12.5px] font-bold text-ink">{item.title}</span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-ink3">{item.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <TextAreaField label="My next goal (optional)" value={planText} onChange={setPlanText} placeholder="One practical change I want to work toward" />
              <TextAreaField label="My reasons" value={reasons} onChange={setReasons} placeholder="One reason per line" />
              <TextAreaField label="Triggers I have noticed" value={triggers} onChange={setTriggers} placeholder="One trigger per line" />
              <TextAreaField label="Steps I want to try" value={copingActions} onChange={setCopingActions} placeholder="One coping step per line" />
            </div>
          </SettingsGroup>

          <SettingsGroup title="Support contact" description="Optional. Saved locally; use only a number you trust.">
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sky-300">
                <UserRound className="size-4" />
                <p className="text-[12px] font-semibold text-ink2">A person you may want to contact</p>
              </div>
              <TextField label="Name" value={supportName} onChange={setSupportName} placeholder="Name or reminder" />
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink3">Phone number</span>
                <span className="flex items-center rounded-2xl border border-hairline bg-surface3/60 px-4 py-3 focus-within:border-accent/60">
                  <input
                    type="tel"
                    name="recovery-settings-phone"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    data-1p-ignore="true"
                    data-lpignore="true"
                    data-form-type="other"
                    value={supportPhone}
                    onChange={(event) => setSupportPhone(event.target.value)}
                    placeholder="Optional"
                    className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink3"
                  />
                </span>
              </label>
              <CustomButton fullWidth variant="outline" loading={saving} onClick={() => void save()}>
                Save contact and plan
              </CustomButton>
            </div>
          </SettingsGroup>

          <HealthSafetyCard presetId={profile.presetId} />
        </>
      ) : (
        <div className="card p-4 text-[12px] leading-relaxed text-ink2">
          No active plan. Go back to Addiction Remove to build one when you are ready.
        </div>
      )}

      <SettingsGroup title="Privacy & support">
        <div className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" />
          <p className="text-[11.5px] leading-relaxed text-ink3">
            Plan details and check-ins stay in this browser's local storage and are not sent to a server. They are not encrypted; anyone with access to this browser profile may see them. Device backups include recovery data.
          </p>
        </div>
        <div className="flex items-start gap-3 border-t border-hairline p-4">
          <HeartHandshake className="mt-0.5 size-4 shrink-0 text-sky-300" />
          <p className="text-[11.5px] leading-relaxed text-ink3">
            This app does not provide counseling, clinical treatment, or notifications. A trusted person, qualified clinician, or local peer-support service can offer help beyond these tools.
          </p>
        </div>
      </SettingsGroup>

      {tracker.settingsLoaded && (
        <DangerZone
          appName="Addiction Remove"
          actions={[
            {
              label: 'Delete recovery plan and check-ins',
              description: 'Permanently erase this plan and all recovery reflections from this browser',
              stores: ['addictionCheckIns'],
              settingsKeys: [{ key: SETTINGS_KEYS.addiction, defaults: DEFAULT_ADDICTION }],
              confirmTitle: 'Delete all recovery data?',
              confirmDescription: 'Your plan, support contact, check-ins, and reflections will be permanently erased from this browser. This cannot be undone.',
            },
          ]}
          onCleared={goBack}
        />
      )}
    </ScreenShell>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink3">{label}</span>
      <textarea
        name={label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
        autoComplete="off"
        autoCorrect="off"
        data-1p-ignore="true"
        data-lpignore="true"
        data-form-type="other"
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-2xl border border-hairline bg-surface3/60 px-4 py-3 text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink3 focus:border-accent/60"
      />
    </label>
  );
}
