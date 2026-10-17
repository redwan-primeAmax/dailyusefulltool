import { useState } from 'react';
import { ArrowRight, HeartHandshake, Plus, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import type { RecoveryMode } from '../../../types';
import { CustomButton } from '../../../components/CustomButton';
import { Chip, TextField } from '../../../components/ui/controls';
import {
  COMMON_TRIGGERS,
  COPING_ACTIONS,
  PRESET_ADDICTIONS,
  RECOVERY_MODES,
  RECOVERY_REASONS,
  type RecoveryPlanDraft,
} from '../addictionModel';
import { HealthSafetyCard } from './HealthSafetyCard';

export function RecoverySetup({
  onStart,
  onNeedSupport,
}: {
  onStart: (draft: RecoveryPlanDraft) => void;
  onNeedSupport: () => void;
}) {
  const [presetId, setPresetId] = useState('');
  const [customName, setCustomName] = useState('');
  const [mode, setMode] = useState<RecoveryMode>('explore');
  const [planText, setPlanText] = useState('');
  const [reasons, setReasons] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [customTrigger, setCustomTrigger] = useState('');
  const [copingActions, setCopingActions] = useState<string[]>([COPING_ACTIONS[1], COPING_ACTIONS[3]]);
  const [supportName, setSupportName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');

  const selectedPreset = PRESET_ADDICTIONS.find((preset) => preset.id === presetId);
  const name = presetId === 'other' ? customName.trim() : selectedPreset?.name ?? '';
  const canStart = Boolean(selectedPreset && name);

  const toggle = (values: string[], setValues: (next: string[]) => void, value: string) => {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const addCustomTrigger = () => {
    const value = customTrigger.trim();
    if (!value || triggers.includes(value)) return;
    setTriggers((current) => [...current, value]);
    setCustomTrigger('');
  };

  const start = () => {
    if (!selectedPreset || !name) return;
    onStart({
      presetId: selectedPreset.id,
      name,
      category: selectedPreset.category,
      mode,
      planText,
      reasons,
      triggers,
      copingActions,
      supportName,
      supportPhone,
    });
  };

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950/70 via-surface2 to-slate-900 p-5 shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-10 size-40 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-300">
            <ShieldCheck className="size-3.5" /> A private place to start
          </span>
          <h2 className="mt-3 max-w-[290px] text-[25px] font-black leading-tight tracking-tight text-ink">
            Change can start with one honest next step.
          </h2>
          <p className="mt-2 max-w-[310px] text-[12.5px] leading-relaxed text-ink2">
            Make a plan that fits you. There is no countdown to “fix” yourself, and a hard day does not erase the progress you have made.
          </p>
        </div>
      </section>

      <button
        type="button"
        onClick={onNeedSupport}
        className="tap flex w-full items-center gap-3 rounded-2xl border border-sky-400/20 bg-sky-500/[0.08] p-3.5 text-left"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-400/15 text-sky-300">
          <HeartHandshake className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold text-ink">Need help with an urge right now?</span>
          <span className="block text-[11px] text-ink3">Open a short pause and support plan</span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-sky-300" />
      </button>

      <section className="card space-y-3 p-4">
        <div>
          <p className="text-[13px] font-bold text-ink">1. What would you like help changing?</p>
          <p className="mt-0.5 text-[11.5px] text-ink3">Choose a close match, or write your own.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_ADDICTIONS.map((preset) => {
            const active = preset.id === presetId;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() => setPresetId(preset.id)}
                className={`flex min-h-[62px] items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-colors ${
                  active
                    ? 'border-emerald-400/50 bg-emerald-500/15'
                    : 'border-hairline bg-surface3/45 hover:bg-surface3/80'
                }`}
              >
                <span className="text-[20px]" aria-hidden="true">{preset.emoji}</span>
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-bold leading-tight text-ink">{preset.name}</span>
                  <span className="mt-0.5 block text-[10px] text-ink3">{preset.category}</span>
                </span>
              </button>
            );
          })}
        </div>
        {presetId === 'other' && (
          <TextField
            label="Name it in your own words"
            placeholder="A habit, substance, or pattern"
            value={customName}
            onChange={setCustomName}
          />
        )}
        <HealthSafetyCard presetId={presetId || undefined} />
      </section>

      <section className="card space-y-3 p-4">
        <div>
          <p className="text-[13px] font-bold text-ink">2. What kind of change feels right today?</p>
          <p className="mt-0.5 text-[11.5px] text-ink3">You can change your plan later.</p>
        </div>
        <div className="space-y-2">
          {RECOVERY_MODES.map((item) => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setMode(item.id)}
                className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                  active ? 'border-emerald-400/45 bg-emerald-500/10' : 'border-hairline bg-surface3/35'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`grid size-5 place-items-center rounded-full border ${active ? 'border-emerald-300 bg-emerald-400 text-emerald-950' : 'border-ink3/50'}`}>
                    {active && <span className="size-2 rounded-full bg-current" />}
                  </span>
                  <span className="text-[13px] font-bold text-ink">{item.title}</span>
                </span>
                <span className="mt-1 block pl-7 text-[11.5px] leading-relaxed text-ink3">{item.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <div>
          <p className="text-[13px] font-bold text-ink">3. What is one practical next goal?</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink3">
            Optional. For substances or medicines, make a change plan with a qualified clinician.
          </p>
        </div>
        <textarea
          name="recovery-change-goal"
          autoComplete="off"
          autoCorrect="off"
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          rows={3}
          value={planText}
          onChange={(event) => setPlanText(event.target.value)}
          placeholder={mode === 'reduce' ? 'e.g. Follow a change plan I agreed with a clinician' : 'e.g. Ask for support, notice a trigger, or make my space safer'}
          className="w-full resize-y rounded-2xl border border-hairline bg-surface3/60 px-4 py-3 text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink3 focus:border-accent/60"
        />
      </section>

      <section className="card space-y-3 p-4">
        <div>
          <p className="text-[13px] font-bold text-ink">4. Why does this matter to you?</p>
          <p className="mt-0.5 text-[11.5px] text-ink3">Pick any that feel true. You can leave this blank.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RECOVERY_REASONS.map((reason) => (
            <Chip
              key={reason}
              active={reasons.includes(reason)}
              onClick={() => toggle(reasons, setReasons, reason)}
              className="h-auto min-h-9 whitespace-normal py-2 text-left text-[11.5px]"
            >
              {reason}
            </Chip>
          ))}
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <div>
            <p className="text-[13px] font-bold text-ink">5. Notice your triggers</p>
          <p className="mt-0.5 text-[11.5px] text-ink3">You do not have to solve them all at once.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMMON_TRIGGERS.map((trigger) => (
            <Chip
              key={trigger}
              active={triggers.includes(trigger)}
              onClick={() => toggle(triggers, setTriggers, trigger)}
              className="h-auto min-h-9 whitespace-normal py-2 text-left text-[11.5px]"
            >
              {trigger}
            </Chip>
          ))}
          {triggers.filter((trigger) => !COMMON_TRIGGERS.includes(trigger)).map((trigger) => (
            <Chip key={trigger} active onClick={() => toggle(triggers, setTriggers, trigger)} className="h-auto min-h-9 py-2 text-[11.5px]">
              {trigger} ×
            </Chip>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <TextField
            className="min-w-0 flex-1"
            placeholder="Add a personal trigger"
            value={customTrigger}
            onChange={setCustomTrigger}
          />
          <CustomButton
            variant="tonal"
            className="h-[46px] shrink-0"
            onClick={addCustomTrigger}
            leadingIcon={<Plus className="size-4" />}
          >
            Add
          </CustomButton>
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <div>
          <p className="text-[13px] font-bold text-ink">6. Choose a few next steps</p>
          <p className="mt-0.5 text-[11.5px] text-ink3">These are ideas, not rules. Pick what feels safe and realistic.</p>
        </div>
        <div className="space-y-2">
          {COPING_ACTIONS.map((action) => {
            const active = copingActions.includes(action);
            return (
              <button
                key={action}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(copingActions, setCopingActions, action)}
                className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left ${
                  active ? 'border-emerald-400/35 bg-emerald-500/[0.08]' : 'border-hairline bg-surface3/30'
                }`}
              >
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${active ? 'border-emerald-400 bg-emerald-400 text-emerald-950' : 'border-ink3/40 text-transparent'}`}>
                  {active && <span className="size-2 rounded-sm bg-current" />}
                </span>
                <span className="text-[11.5px] leading-relaxed text-ink2">{action}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
            <UserRound className="size-4" />
          </span>
          <div>
            <p className="text-[13px] font-bold text-ink">Who could support you?</p>
            <p className="text-[11px] text-ink3">Optional. Saved only in this browser.</p>
          </div>
        </div>
        <TextField
          label="Trusted person's name"
          placeholder="Name or a reminder to yourself"
          value={supportName}
          onChange={setSupportName}
        />
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink3">Phone number (optional)</span>
          <span className="flex items-center gap-2 rounded-2xl border border-hairline bg-surface3/60 px-4 py-3 focus-within:border-accent/60">
            <input
              type="tel"
              name="recovery-support-phone"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
              value={supportPhone}
              onChange={(event) => setSupportPhone(event.target.value)}
              placeholder="Add only if you want a quick-call button"
              className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink3"
            />
          </span>
        </label>
        <p className="text-[10.5px] leading-relaxed text-ink3">
          Recovery notes stay on this device and are not sent to a server. Anyone who can access this browser profile may see them; exported backups include this information.
        </p>
      </section>

      <div className="space-y-2 pb-2 pt-1">
        <CustomButton
          variant="success"
          size="lg"
          fullWidth
          disabled={!canStart}
          onClick={start}
          leadingIcon={<Sparkles className="size-5" />}
          trailingIcon={<ArrowRight className="size-4" />}
          className="h-14 text-[15px] font-extrabold"
        >
          Create my recovery plan
        </CustomButton>
        <p className="flex items-center justify-center gap-1 text-center text-[10.5px] text-ink3">
          <ShieldCheck className="size-3" /> A plan is a starting point—not a guarantee or a substitute for care.
        </p>
      </div>
    </div>
  );
}
