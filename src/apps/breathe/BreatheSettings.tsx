import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Pencil, Plus, Trash2, Wind } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { Stepper, TextField } from '../../components/ui/controls';
import { CustomButton } from '../../components/CustomButton';
import { Modal } from '../../components/Modal';
import { useSettings } from '../../hooks/useTracker';
import { useOS } from '../../context/OSContext';
import {
  DEFAULT_BREATHE, DEFAULT_BREATHE_PATTERNS, SETTINGS_KEYS,
  type BreathePattern, type BreatheSettings,
} from '../../db/trackerService';
import { uid } from '../../utils/format';

const EMOJI_CHOICES = ['😴', '', '🌿', '⚡', '🧘', '', '', ''];
const COLOR_CHOICES = ['#0ea5e9', '#06b6d4', '#22c55e', '#f59e0b', '#14b8a6', '#f97316'];

type Draft = Omit<BreathePattern, 'builtin'>;

function toDraft(p: BreathePattern): Draft {
  return { id: p.id, name: p.name, emoji: p.emoji, color: p.color, description: p.description, inhale: p.inhale, hold1: p.hold1, exhale: p.exhale, hold2: p.hold2 };
}

export function BreatheSettings() {
  const { notify } = useOS();
  const { settings, update } = useSettings<BreatheSettings>(SETTINGS_KEYS.breathe, DEFAULT_BREATHE);
  const patterns = settings.patterns.length > 0 ? settings.patterns : DEFAULT_BREATHE_PATTERNS;
  const [editing, setEditing] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);

  const startNew = () => {
    setEditing({ id: uid(), name: '', emoji: EMOJI_CHOICES[4] || '🧘', color: COLOR_CHOICES[0], description: '', inhale: 4, hold1: 0, exhale: 4, hold2: 0 });
    setIsNew(true);
  };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      notify({ title: 'Give the routine a name', tone: 'warning' });
      return;
    }
    if (editing.inhale < 1 || editing.exhale < 1) {
      notify({ title: 'Inhale & exhale need at least 1s', tone: 'warning' });
      return;
    }
    const original = patterns.find((p) => p.id === editing.id);
    const clean: BreathePattern = {
      ...editing,
      name: editing.name.trim(),
      description: editing.description.trim() || 'Custom routine',
      emoji: editing.emoji || '🌬️',
      builtin: original?.builtin ?? false,
    };
    const exists = original !== undefined;
    update({
      patterns: exists
        ? patterns.map((p) => (p.id === clean.id ? clean : p))
        : [...patterns, clean],
    });
    setEditing(null);
    setIsNew(false);
    notify({ title: isNew ? `Routine "${clean.name}" added` : `Routine "${clean.name}" updated`, tone: 'success' });
  };

  const remove = (p: BreathePattern) => {
    update({ patterns: patterns.filter((x) => x.id !== p.id) });
    notify({ title: `Routine "${p.name}" deleted`, tone: 'warning' });
  };

  const restoreBuiltins = () => {
    update({ patterns: [...DEFAULT_BREATHE_PATTERNS, ...patterns.filter((p) => !p.builtin)] });
    notify({ title: 'Built-in routines restored', tone: 'info' });
  };

  return (
    <ScreenShell
      title="Breathe settings"
      subtitle="Create & manage breathing routines"
      icon={<Wind className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="My routines" description="Tap a row to edit its timing, name and colour.">
        {patterns.map((p) => (
          <SettingsRow
            key={p.id}
            label={`${p.emoji} ${p.name}`}
            description={`${p.inhale}s in · ${p.hold1}s hold · ${p.exhale}s out${p.hold2 > 0 ? ` · ${p.hold2}s hold` : ''} · ${p.builtin ? 'built-in' : 'custom'}`}
            icon={<span className="size-3.5 rounded-full" style={{ background: p.color }} />}
            control={
              <div className="flex items-center gap-1">
                <button type="button" aria-label={`Edit ${p.name}`}
                  onClick={() => { setEditing(toDraft(p)); setIsNew(false); }}
                  className="tap grid size-9 place-items-center rounded-full text-ink3 hover:text-accent">
                  <Pencil className="size-4" />
                </button>
                <button type="button" aria-label={`Delete ${p.name}`}
                  onClick={() => remove(p)}
                  className="tap grid size-9 place-items-center rounded-full text-ink3 hover:text-red-400">
                  <Trash2 className="size-4" />
                </button>
              </div>
            }
          />
        ))}
      </SettingsGroup>

      <CustomButton fullWidth onClick={startNew} leadingIcon={<Plus className="size-4" />}>
        New breathing routine
      </CustomButton>

      <SettingsGroup title="Built-ins">
        <SettingsRow
          icon={<Wind className="size-[17px]" />}
          label="Restore built-in routines"
          description="Re-add any defaults you deleted (keeps your customs)"
          onClick={restoreBuiltins}
        />
      </SettingsGroup>

      {/* Editor */}
      <AnimatePresence>
        {editing && (
          <Modal open onClose={() => { setEditing(null); setIsNew(false); }}
            title={isNew ? 'New routine' : `Edit "${editing.name}"`}
            description="In → hold → out → hold, in seconds."
            sheet
            footer={
              <>
                <CustomButton variant="ghost" fullWidth onClick={() => { setEditing(null); setIsNew(false); }}>Cancel</CustomButton>
                <CustomButton fullWidth onClick={save}>Save routine</CustomButton>
              </>
            }>
            <div className="space-y-4">
              <TextField label="Name" value={editing.name} placeholder="My calm pattern"
                onChange={(name) => setEditing((d) => (d ? { ...d, name } : d))} />

              <div className="grid grid-cols-4 gap-2">
                {([
                  ['Inhale', 'inhale'],
                  ['Hold in', 'hold1'],
                  ['Exhale', 'exhale'],
                  ['Hold out', 'hold2'],
                ] as [string, 'inhale' | 'hold1' | 'exhale' | 'hold2'][]).map(([label, key]) => (
                  <div key={key} className="rounded-2xl border border-hairline bg-surface3/40 p-2.5">
                    <p className="text-center text-[10px] font-bold uppercase tracking-wider text-ink3">{label}</p>
                    <Stepper value={editing[key]} step={1} min={key === 'hold1' || key === 'hold2' ? 0 : 1} max={20}
                      onChange={(v) => setEditing((d) => (d ? { ...d, [key]: v } : d))} />
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink3">Icon</p>
                <div className="flex gap-2">
                  {EMOJI_CHOICES.filter((e) => e.length > 0).map((e) => (
                    <button key={e} type="button" onClick={() => setEditing((d) => (d ? { ...d, emoji: e } : d))}
                      className={`tap grid size-10 place-items-center rounded-xl text-xl ${editing.emoji === e ? 'bg-accent' : 'bg-surface3/60'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink3">Colour</p>
                <div className="flex gap-2">
                  {COLOR_CHOICES.map((c) => (
                    <button key={c} type="button" aria-label={`Colour ${c}`}
                      onClick={() => setEditing((d) => (d ? { ...d, color: c } : d))}
                      className="tap size-7 rounded-full"
                      style={{ background: c, outline: editing.color === c ? '2px solid #fff' : 'none', outlineOffset: 2 }} />
                  ))}
                </div>
              </div>

              <TextField label="Description (optional)" value={editing.description} placeholder="How does this feel?"
                onChange={(description) => setEditing((d) => (d ? { ...d, description } : d))} />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <section className="pb-2 text-center text-[11.5px] text-ink3">Breathe · v1.5.0 · {patterns.length} routine{patterns.length === 1 ? '' : 's'}</section>
    </ScreenShell>
  );
}
