import { useState } from 'react';
import { CalendarClock, Clock3, Droplets, Gauge, Plus, RefreshCw, RotateCcw, Target, Trash2 } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { Segmented, Slider, Stepper, TextField, Toggle } from '../../components/ui/controls';
import { CustomButton } from '../../components/CustomButton';
import { ConfirmDialog } from '../../components/Modal';
import { useOS } from '../../context/OSContext';
import { useWaterTracker } from './useWaterTracker';
import { formatVolume, uid } from '../../utils/format';
import { mlToOz, ozToMl } from '../../utils/format';
import { minutesToClock } from '../../utils/date';
import type { VolumeUnit, WaterQuickAdd } from '../../types';

const RESET_OPTIONS = [
  { value: 'midnight' as const, label: 'Midnight' },
  { value: '4am' as const, label: '4 AM' },
  { value: 'manual' as const, label: 'Manual' },
];

/** Water Tracker — settings screen. */
export function WaterSettings() {
  const { notify } = useOS();
  const { settings, update, setSettings, today, clearLogs, removeLog, triggerManualReset } = useWaterTracker();
  const [confirm, setConfirm] = useState<'today' | 'all' | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [newPreset, setNewPreset] = useState({ label: '', ml: '300' });
  const startMin = settings.scheduleStartMin ?? (7 * 60);
  const endMin = settings.scheduleEndMin ?? (22 * 60);
  const stepMin = settings.scheduleStepMin ?? 30;

  const targetOz = mlToOz(settings.dailyTargetMl);

  const changeUnit = (unit: VolumeUnit) => {
    if (unit === settings.unit) return;
    // Convert the goal so the number stays meaningful after switching units.
    const converted = unit === 'oz' ? Math.round(targetOz) : ozToMl(targetOz);
    update({ unit, dailyTargetMl: Math.max(200, Math.min(8000, converted)) });
    notify({ title: `Units switched to ${unit}`, tone: 'info' });
  };

  const updatePreset = (id: string, ml: number) =>
    setSettings({
      ...settings,
      quickAdds: settings.quickAdds.map((p) => (p.id === id ? { ...p, ml } : p)),
    });

  const removePreset = (id: string) =>
    setSettings({ ...settings, quickAdds: settings.quickAdds.filter((p) => p.id !== id) });

  const addPreset = () => {
    const ml = Math.round(Number(newPreset.ml));
    if (!Number.isFinite(ml) || ml <= 0) {
      notify({ title: 'Enter a valid volume', tone: 'warning' });
      return;
    }
    const preset: WaterQuickAdd = {
      id: uid(),
      label: newPreset.label.trim() || 'Preset',
      ml: Math.min(3000, ml),
    };
    setSettings({ ...settings, quickAdds: [...settings.quickAdds, preset] });
    setNewPreset({ label: '', ml: '300' });
    notify({ title: `${preset.label} preset added`, tone: 'success' });
  };

  return (
    <ScreenShell
      title="Water settings"
      subtitle="Goal, units, presets & reset schedule"
      icon={<Droplets className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="Daily goal">
        <SettingsRow
          icon={<Target className="size-[17px]" />}
          label="Target intake"
          description={`Currently ${formatVolume(settings.dailyTargetMl, settings.unit)}`}
          control={
            <Stepper
              value={settings.unit === 'ml' ? settings.dailyTargetMl : Math.round(targetOz)}
              step={settings.unit === 'ml' ? 100 : 2}
              min={settings.unit === 'ml' ? 500 : 16}
              max={settings.unit === 'ml' ? 6000 : 200}
              suffix={settings.unit}
              onChange={(next) =>
                update({ dailyTargetMl: settings.unit === 'ml' ? next : ozToMl(next) })
              }
            />
          }
        />
        <SettingsRow
          icon={<Gauge className="size-[17px]" />}
          label="Fine tune"
          inline={
            <Slider
              ariaLabel="Daily water target"
              value={settings.dailyTargetMl}
              min={500}
              max={5000}
              step={50}
              onChange={(dailyTargetMl) => update({ dailyTargetMl })}
              format={(v) => formatVolume(v, settings.unit)}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Units & reset">
        <SettingsRow
          icon={<Droplets className="size-[17px]" />}
          label="Volume unit"
          description="Goals convert automatically"
          control={
            <Segmented
              className="w-[130px]"
              size="sm"
              ariaLabel="unit"
              value={settings.unit}
              onChange={changeUnit}
              options={[
                { value: 'ml' as VolumeUnit, label: 'ml' },
                { value: 'oz' as VolumeUnit, label: 'oz' },
              ]}
            />
          }
        />
        <SettingsRow
          icon={<CalendarClock className="size-[17px]" />}
          label="Daily reset schedule"
          description={
            settings.resetSchedule === 'midnight'
              ? 'Intake progress clears each night at 00:00'
              : settings.resetSchedule === '4am'
                ? 'Intake progress clears each morning at 04:00 AM'
                : 'Intake progress stays until manually cleared'
          }
          control={
            <Segmented
              className="w-[220px]"
              size="sm"
              ariaLabel="reset"
              value={settings.resetSchedule}
              onChange={(resetSchedule) => {
                update({ resetSchedule });
                notify({
                  title: `Reset set to ${resetSchedule}`,
                  description: resetSchedule === 'manual' ? 'You can reset intake progress anytime on command' : undefined,
                  tone: 'info',
                });
              }}
              options={RESET_OPTIONS}
            />
          }
        />
        {settings.resetSchedule === 'manual' && (
          <SettingsRow
            icon={<RotateCcw className="size-[17px]" />}
            label="Manual reset on command"
            description="Immediately clear today's logged intake baseline"
            control={
              <CustomButton
                size="sm"
                variant="danger"
                onClick={() => {
                  triggerManualReset();
                  notify({
                    title: "Intake progress reset",
                    description: "Today's intake has been manually reset to 0ml",
                    tone: 'success',
                  });
                }}
              >
                Reset now
              </CustomButton>
            }
          />
        )}
        <SettingsRow
          icon={<Plus className="size-[17px]" />}
          label="Default glass size"
          description="Used by the glass shortcut"
          control={
            <Stepper
              value={settings.glassSizeMl}
              step={50}
              min={100}
              max={1000}
              suffix="ml"
              onChange={(glassSizeMl) => update({ glassSizeMl })}
            />
          }
        />
        <SettingsRow
          icon={<Gauge className="size-[17px]" />}
          label="Weekly chart"
          description="Show the 7-day trend card"
          control={
            <Toggle
              label="Show weekly chart"
              checked={settings.showWeekChart}
              onChange={(showWeekChart) => update({ showWeekChart })}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup
        title="Schedule bounds & calculator"
        description="Configure target time window for the Water Time Calculator and Range Estimator."
      >
        <SettingsRow
          icon={<Clock3 className="size-[17px]" />}
          label="Schedule start time"
          description={`First reminder begins at ${minutesToClock(startMin)}`}
          control={
            <Stepper
              value={Math.round(startMin / 60)}
              step={1}
              min={4}
              max={12}
              suffix=":00"
              format={(v) => minutesToClock(v * 60)}
              onChange={(h) => update({ scheduleStartMin: h * 60 })}
            />
          }
        />
        <SettingsRow
          icon={<Clock3 className="size-[17px]" />}
          label="Schedule end time"
          description={`Last reminder finishes at ${minutesToClock(endMin)}`}
          control={
            <Stepper
              value={Math.round(endMin / 60)}
              step={1}
              min={16}
              max={23}
              suffix=":00"
              format={(v) => minutesToClock(v * 60)}
              onChange={(h) => update({ scheduleEndMin: h * 60 })}
            />
          }
        />
        <SettingsRow
          icon={<CalendarClock className="size-[17px]" />}
          label="Reminder interval"
          description="Step size for half-hour schedule grid"
          control={
            <Segmented
              className="w-[180px]"
              size="sm"
              ariaLabel="schedule-step"
              value={stepMin}
              onChange={(scheduleStepMin) => update({ scheduleStepMin })}
              options={[
                { value: 30, label: '30m' },
                { value: 45, label: '45m' },
                { value: 60, label: '60m' },
              ]}
            />
          }
        />
        <div className="p-4 pt-2 space-y-2.5">
          <div className="rounded-2xl bg-surface3/60 p-3 text-[12px] text-ink2 leading-relaxed">
            Active window: <span className="font-bold text-ink">{minutesToClock(startMin)}</span> to <span className="font-bold text-ink">{minutesToClock(endMin)}</span> in <span className="font-bold text-ink">{stepMin}m</span> steps ({Math.floor((endMin - startMin) / stepMin) + 1} intervals of ~{Math.round(settings.dailyTargetMl / Math.max(1, Math.floor((endMin - startMin) / stepMin) + 1))}ml).
          </div>
          <CustomButton
            variant="tonal"
            fullWidth
            onClick={() => notify({ title: 'Schedule updated', description: `Regenerated from ${minutesToClock(startMin)} to ${minutesToClock(endMin)}`, tone: 'success' })}
            leadingIcon={<RefreshCw className="size-4" />}
          >
            Regenerate & sync schedule
          </CustomButton>
        </div>
      </SettingsGroup>

      <SettingsGroup
        title="Quick-add presets"
        description="Volumes shown as chips on the dashboard."
      >
        {settings.quickAdds.map((preset) => (
          <SettingsRow
            key={preset.id}
            label={preset.label}
            description={formatVolume(preset.ml, settings.unit)}
            control={
              <div className="flex items-center gap-1">
                <Stepper
                  value={preset.ml}
                  step={50}
                  min={50}
                  max={2000}
                  suffix=""
                  onChange={(ml) => updatePreset(preset.id, ml)}
                />
                <button
                  type="button"
                  aria-label={`Remove ${preset.label}`}
                  onClick={() => removePreset(preset.id)}
                  className="tap grid size-9 place-items-center rounded-full text-ink3 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            }
          />
        ))}
        <div className="grid grid-cols-[1fr_112px_auto] items-end gap-2 p-4">
          <TextField
            label="Name"
            value={newPreset.label}
            placeholder="Thermos"
            onChange={(label) => setNewPreset((prev) => ({ ...prev, label }))}
          />
          <TextField
            label="ml"
            type="decimal"
            value={newPreset.ml}
            onChange={(ml) => setNewPreset((prev) => ({ ...prev, ml }))}
          />
          <CustomButton className="h-[46px]" onClick={addPreset} leadingIcon={<Plus className="size-4" />}>
            Add
          </CustomButton>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Data">
        <SettingsRow
          danger
          icon={<Trash2 className="size-[17px]" />}
          label="Clear today's log"
          description={`${today.length} entries will be removed`}
          onClick={() => setConfirm('today')}
        />
        <SettingsRow
          danger
          icon={<Trash2 className="size-[17px]" />}
          label="Erase all water history"
          description="Cannot be undone"
          onClick={() => setConfirm('all')}
        />
      </SettingsGroup>

      <ConfirmDialog
        open={confirm !== null}
        tone="danger"
        busy={confirmBusy}
        title={confirm === 'today' ? 'Clear today’s log?' : 'Erase all water history?'}
        description={
          confirm === 'today'
            ? 'Your goal and presets stay intact.'
            : 'Every logged glass will be permanently deleted.'
        }
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirmBusy(true);
          void (confirm === 'today' ? clearToday() : clearLogs()).then(() => {
            setConfirmBusy(false);
            setConfirm(null);
            notify({ title: 'History cleared', tone: 'warning' });
          });
        }}
      />

      <section className="pb-2 text-center text-[11.5px] text-ink3">
        Water Tracker · v1.5.0 · data stored offline in IndexedDB
      </section>
    </ScreenShell>
  );

  async function clearToday() {
    await Promise.all(today.map((row) => removeLog(row.id)));
  }
}
