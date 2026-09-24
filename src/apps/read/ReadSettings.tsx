import { useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2, Type } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { Segmented, Slider, Stepper, TextField } from '../../components/ui/controls';
import { ConfirmDialog } from '../../components/Modal';
import { CustomButton } from '../../components/CustomButton';
import { useOS } from '../../context/OSContext';
import { useSettings } from '../../hooks/useTracker';
import { readAll, writeRecord, deleteRecord } from '../../db/indexedDB';
import { uid } from '../../utils/format';
import {
  DEFAULT_READ, SETTINGS_KEYS, STORE_READINGS,
  type ReadSettings, type Reading,
} from '../../db/trackerService';

export function ReadSettings() {
  const { notify } = useOS();
  const { settings, update } = useSettings<ReadSettings>(SETTINGS_KEYS.read, DEFAULT_READ);
  const [custom, setCustom] = useState<Reading[]>([]);
  const [draft, setDraft] = useState({ title: '', author: '', body: '' });
  const [toDelete, setToDelete] = useState<Reading | null>(null);

  useEffect(() => {
    readAll<Reading>(STORE_READINGS).then((rows) => setCustom(rows.filter((r) => !r.builtin).sort((a, b) => b.ts - a.ts)));
  }, []);

  const addReading = async () => {
    if (!draft.title.trim() || !draft.body.trim()) {
      notify({ title: 'Add a title and text', tone: 'warning' });
      return;
    }
    const reading: Reading = {
      id: uid(), ts: Date.now(), dateKey: '',
      title: draft.title.trim(), author: draft.author.trim() || 'Anonymous',
      body: draft.body.trim(), builtin: false,
    };
    await writeRecord(STORE_READINGS, reading as { id: string });
    setCustom((prev) => [reading, ...prev]);
    setDraft({ title: '', author: '', body: '' });
    notify({ title: 'Reading added to library', tone: 'success' });
  };

  const remove = async (r: Reading) => {
    await deleteRecord(STORE_READINGS, r.id);
    setCustom((prev) => prev.filter((x) => x.id !== r.id));
    setToDelete(null);
    notify({ title: `"${r.title}" removed`, tone: 'warning' });
  };

  return (
    <ScreenShell
      title="Read settings"
      subtitle="Typography, theme & library"
      icon={<BookOpen className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="Typography">
        <SettingsRow
          icon={<Type className="size-[17px]" />}
          label="Font size"
          description={`${settings.fontSize}px`}
          inline={
            <Slider ariaLabel="Font size" value={settings.fontSize} min={13} max={26} step={1}
              onChange={(fontSize) => update({ fontSize })} format={(v) => `${v}px`} />
          }
        />
        <SettingsRow
          icon={<Type className="size-[17px]" />}
          label="Line height"
          description="Spacing between lines"
          control={
            <Stepper value={settings.lineHeight} step={0.1} min={1.3} max={2.4}
              format={(v) => v.toFixed(1)} onChange={(lineHeight) => update({ lineHeight })} />
          }
        />
        <SettingsRow
          icon={<BookOpen className="size-[17px]" />}
          label="Page theme"
          control={
            <Segmented className="w-[200px]" size="sm" ariaLabel="theme" value={settings.theme}
              onChange={(theme) => update({ theme })}
              options={[
                { value: 'dark' as const, label: 'Dark' },
                { value: 'sepia' as const, label: 'Sepia' },
                { value: 'paper' as const, label: 'Paper' },
              ]} />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="My library" description="Add your own readings — they persist with backups.">
        <div className="space-y-3 p-4">
          <TextField label="Title" value={draft.title} placeholder="The Owl and the Pussycat"
            onChange={(title) => setDraft((d) => ({ ...d, title }))} />
          <TextField label="Author (optional)" value={draft.author} placeholder="Edward Lear"
            onChange={(author) => setDraft((d) => ({ ...d, author }))} />
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink3">Text</span>
            <textarea value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              placeholder="Paste or write your reading…"
              className="h-28 w-full resize-none rounded-2xl border border-hairline bg-surface3/60 px-4 py-3 text-[14px] text-ink outline-none placeholder:text-ink3" />
          </label>
          <CustomButton fullWidth onClick={addReading} leadingIcon={<Plus className="size-4" />}>
            Add to library
          </CustomButton>
        </div>
        {custom.map((r) => (
          <SettingsRow key={r.id} label={r.title} description={`${r.author} · ${r.body.split(/\s+/).length} words`}
            control={
              <button type="button" aria-label={`Delete ${r.title}`} onClick={() => setToDelete(r)}
                className="tap grid size-9 place-items-center rounded-full text-ink3 hover:bg-red-500/10 hover:text-red-400">
                <Trash2 className="size-4" />
              </button>
            } />
        ))}
        {custom.length === 0 && (
          <p className="px-4 pb-4 text-[12px] text-ink3">No custom readings yet — the four classics are built in.</p>
        )}
      </SettingsGroup>

      <ConfirmDialog open={toDelete !== null} tone="danger"
        title={`Delete "${toDelete?.title}"?`}
        description="This reading will be removed from your library."
        confirmLabel="Delete" onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && void remove(toDelete)} />

      <section className="pb-2 text-center text-[11.5px] text-ink3">Read · v1.1.0 · calm, focused reading</section>
    </ScreenShell>
  );
}
