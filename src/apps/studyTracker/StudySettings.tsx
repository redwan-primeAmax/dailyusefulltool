import { useState } from 'react';
import { CalendarRange, GraduationCap, ListChecks, Plus, Target, Timer, Trash2 } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { Chip, Slider, Stepper, TextField, Toggle } from '../../components/ui/controls';
import { CustomButton } from '../../components/CustomButton';
import { ConfirmDialog } from '../../components/Modal';
import { useOS } from '../../context/OSContext';
import { useStudyTracker } from './useStudyTracker';
import { formatMinutes, percent } from '../../utils/format';

const PALETTE = ['#0ea5e9', '#06b6d4', '#f59e0b', '#eab308', '#22c55e', '#14b8a6', '#ef4444'];

/** Study Tracker — settings screen. */
export function StudySettings() {
  const { notify, goBack } = useOS();
  const study = useStudyTracker();
  const { settings, update, setSettings } = study;
  const [newSubject, setNewSubject] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [confirm, setConfirm] = useState(false);

  const togglePreset = (minutes: number) => {
    const exists = settings.quickSessions.includes(minutes);
    const next = exists
      ? settings.quickSessions.filter((m) => m !== minutes)
      : [...settings.quickSessions, minutes].sort((a, b) => a - b);
    update({ quickSessions: next });
  };

  const addSubject = () => {
    const name = newSubject.trim();
    if (!name) {
      notify({ title: 'Name your subject first', tone: 'warning' });
      return;
    }
    study.addSubject(name, color);
    setNewSubject('');
    notify({ title: `${name} added`, tone: 'success' });
  };

  return (
    <ScreenShell
      title="Study settings"
      subtitle="Goals, subjects & session defaults"
      icon={<GraduationCap className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="Goals">
        <SettingsRow
          icon={<Target className="size-[17px]" />}
          label="Daily goal"
          description={`${formatMinutes(settings.dailyGoalMin)} · ${percent(
            study.todayMinutes,
            settings.dailyGoalMin,
          )}% reached`}
          control={
            <Stepper
              value={settings.dailyGoalMin}
              step={15}
              min={15}
              max={720}
              suffix="m"
              onChange={(dailyGoalMin) => update({ dailyGoalMin })}
            />
          }
        />
        <SettingsRow
          icon={<Target className="size-[17px]" />}
          label="Daily goal slider"
          inline={
            <Slider
              ariaLabel="Daily study goal"
              value={settings.dailyGoalMin}
              min={15}
              max={480}
              step={15}
              onChange={(dailyGoalMin) => update({ dailyGoalMin })}
              format={(v) => formatMinutes(v)}
            />
          }
        />
        <SettingsRow
          icon={<CalendarRange className="size-[17px]" />}
          label="Weekly goal"
          description={`${formatMinutes(settings.weeklyGoalMin)} total`}
          control={
            <Stepper
              value={settings.weeklyGoalMin}
              step={60}
              min={60}
              max={3360}
              suffix="m"
              onChange={(weeklyGoalMin) => update({ weeklyGoalMin })}
            />
          }
        />
        <SettingsRow
          icon={<Timer className="size-[17px]" />}
          label="Default session length"
          description="Pre-selects the highlighted preset"
          control={
            <Stepper
              value={settings.defaultSessionMin}
              step={5}
              min={5}
              max={180}
              suffix="m"
              onChange={(defaultSessionMin) => update({ defaultSessionMin })}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Quick sessions" description="Presets shown on the focus card.">
        <SettingsRow
          icon={<ListChecks className="size-[17px]" />}
          label="Durations"
          inline={
            <div className="flex flex-wrap gap-2">
              {[5, 15, 25, 30, 45, 60, 90, 120].map((minutes) => (
                <Chip
                  key={minutes}
                  active={settings.quickSessions.includes(minutes)}
                  onClick={() => togglePreset(minutes)}
                >
                  {minutes}m
                </Chip>
              ))}
            </div>
          }
        />
        <SettingsRow
          icon={<Timer className="size-[17px]" />}
          label="Carry overnight sessions"
          description="Attribute a late session to the next day"
          control={
            <Toggle
              label="Carry overnight"
              checked={settings.allowOvernightCarry}
              onChange={(allowOvernightCarry) => update({ allowOvernightCarry })}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Subjects" description="Colour-coded categories for every session.">
        {settings.subjects.map((subject) => (
          <SettingsRow
            key={subject.id}
            label={subject.name}
            description={`${study.sessions.filter((s) => s.subjectId === subject.id).length} sessions`}
            control={
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {PALETTE.slice(0, 5).map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      aria-label={`Set ${subject.name} colour`}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          subjects: settings.subjects.map((s) =>
                            s.id === subject.id ? { ...s, color: swatch } : s,
                          ),
                        })
                      }
                      className="tap size-5 rounded-full ring-2 ring-offset-2 ring-offset-surface2"
                      style={{
                        background: swatch,
                        boxShadow: subject.color === swatch ? `0 0 0 2px ${swatch}` : undefined,
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${subject.name}`}
                  onClick={() => {
                    study.removeSubject(subject.id);
                    notify({ title: `${subject.name} removed`, tone: 'info' });
                  }}
                  className="tap grid size-9 place-items-center rounded-full text-ink3 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            }
          />
        ))}
        <div className="flex items-end gap-2 p-4">
          <TextField
            label="New subject"
            value={newSubject}
            placeholder="Chemistry"
            onChange={setNewSubject}
          />
          <div className="flex items-center gap-1 pb-1">
            {PALETTE.slice(0, 4).map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Use colour ${swatch}`}
                onClick={() => setColor(swatch)}
                className="tap size-6 rounded-full"
                style={{ background: swatch, outline: color === swatch ? '2px solid #fff' : 'none', outlineOffset: 2 }}
              />
            ))}
          </div>
          <CustomButton className="h-[46px]" onClick={addSubject} leadingIcon={<Plus className="size-4" />}>
            Add
          </CustomButton>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Data">
        <SettingsRow
          danger
          icon={<Trash2 className="size-[17px]" />}
          label="Erase all study history"
          description={`${study.sessions.length} sessions will be deleted`}
          onClick={() => setConfirm(true)}
        />
        <SettingsRow
          icon={<Target className="size-[17px]" />}
          label="Reset goals to defaults"
          description="Daily 120m · weekly 720m"
          onClick={() => {
            setSettings({ ...settings, dailyGoalMin: 120, weeklyGoalMin: 720, defaultSessionMin: 45 });
            notify({ title: 'Goals reset', tone: 'info' });
          }}
        />
      </SettingsGroup>

      <ConfirmDialog
        open={confirm}
        tone="danger"
        title="Erase all study history?"
        description="Sessions are permanently removed from this device."
        confirmLabel="Erase"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          void study.clearSessions();
          setConfirm(false);
          notify({ title: 'Study history cleared', tone: 'warning' });
          goBack();
        }}
      />

      <section className="pb-2 text-center text-[11.5px] text-ink3">
        Study Tracker · v2.0.1 · subjects & goals sync instantly
      </section>
    </ScreenShell>
  );
}
