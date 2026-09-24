import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CloudDownload, CloudUpload, Database, FileJson, ShieldCheck, Trash2 } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { Card } from '../../components/ui/Card';
import { CustomButton } from '../../components/CustomButton';
import { ProgressBar } from '../../components/ui/DataViz';
import { ConfirmDialog } from '../../components/Modal';
import { useOS } from '../../context/OSContext';
import { backupService, type BackupBundle } from '../../db/trackerService';
import { estimateStorage } from '../../db/indexedDB';
import { useEffect } from 'react';
import { EmptyState } from '../../components/ui/DataViz';

type Phase = 'idle' | 'exporting' | 'importing' | 'done' | 'error';

/** Counts every user-data record across all stores in the backup bundle. */
function totalEntries(bundle: BackupBundle): number {
  return Object.values(bundle.stores).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0);
}

export interface BackupAppProps {
  onClose?: () => void;
}

export function BackupApp(_props: BackupAppProps = {}) {
  const { notify, goBack, refresh } = useOS();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [lastBundle, setLastBundle] = useState<BackupBundle | null>(null);
  const [confirm, setConfirm] = useState<null | 'import' | 'wipe'>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    void estimateStorage().then(setStorage);
  }, []);

  const animateProgress = (durationMs: number) =>
    new Promise<void>((resolve) => {
      const started = performance.now();
      const tick = () => {
        const pct = Math.min(100, ((performance.now() - started) / durationMs) * 100);
        setProgress(pct);
        if (pct >= 100) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

  const handleExport = async () => {
    setPhase('exporting');
    setProgress(0);
    try {
      await animateProgress(900);
      const bundle = await backupService.download(`webos-backup-${new Date().toISOString().slice(0, 10)}.json`);
      setLastBundle(bundle);
      setPhase('done');
      notify({
        title: 'Backup downloaded',
        description: `${bundle.installed.length} app(s) · ${totalEntries(bundle)} record(s) exported`,
        tone: 'success',
      });
    } catch (error) {
      setPhase('error');
      notify({ title: 'Export failed', description: String(error), tone: 'danger' });
    }
  };

  const handleFile = (file: File) => {
    setPendingFile(file);
    setConfirm('import');
  };

  const handleImport = async () => {
    if (!pendingFile) return;
    setConfirm(null);
    setPhase('importing');
    setProgress(0);
    try {
      const bundle = await backupService.readFile(pendingFile);
      await animateProgress(700);
      const { counts } = await backupService.restore(bundle);
      await refresh();
      setLastBundle(bundle);
      setPhase('done');
      notify({
        title: 'System data restored',
        description: `${counts.installed} app · ${counts.water} water · ${counts.study} study · ${counts.expense} expense`,
        tone: 'success',
      });
    } catch (error) {
      setPhase('error');
      notify({ title: 'Import failed', description: String(error), tone: 'danger' });
    } finally {
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleWipe = async () => {
    setConfirm(null);
    await backupService.wipe();
    await refresh();
    notify({ title: 'Device wiped', description: 'All app data has been removed', tone: 'warning' });
  };

  return (
    <ScreenShell
      title="Backup"
      subtitle="Export, import and restore every app's data"
      icon={<Database className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <Card title="System backup" subtitle="Compile every app's state into a JSON file">
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <ActionTile
              icon={<CloudDownload className="size-5" />}
              title="Export"
              description="Download a JSON snapshot"
              accent="from-slate-500 to-zinc-600"
              onClick={handleExport}
              busy={phase === 'exporting'}
            />
            <ActionTile
              icon={<CloudUpload className="size-5" />}
              title="Import"
              description="Restore from a JSON file"
              accent="from-sky-500 to-blue-600"
              onClick={() => fileRef.current?.click()}
              busy={phase === 'importing'}
            />
          </div>

          {(phase === 'exporting' || phase === 'importing') && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 rounded-2xl border border-hairline bg-surface3/50 p-3"
            >
              <p className="text-[11.5px] font-semibold text-ink2">
                {phase === 'exporting' ? 'Compiling system data…' : 'Restoring from backup…'}
              </p>
              <ProgressBar value={progress} />
            </motion.div>
          )}

          {lastBundle && phase === 'done' && (
            <div className="space-y-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[12.5px] text-emerald-200">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-4" /> Last backup summary
              </p>
              {(() => {
                const water = lastBundle.settings['settings:water'] as { dailyTargetMl?: number } | undefined;
                const expense = lastBundle.settings['settings:expense'] as { limit?: number; currency?: string } | undefined;
                const study = lastBundle.settings['settings:study'] as { dailyGoalMin?: number } | undefined;
                const profile = lastBundle.device;
                return (
                  <ul className="grid grid-cols-2 gap-1.5 text-[11.5px] text-emerald-200/80">
                    <li>Exported: {new Date(lastBundle.exportedAt).toLocaleString()}</li>
                    <li>Apps: {lastBundle.installed.length}</li>
                    <li>Total records: {totalEntries(lastBundle)}</li>
                    <li>Water logs: {lastBundle.stores.waterLogs?.length ?? 0}</li>
                    <li>Study sessions: {lastBundle.stores.studySessions?.length ?? 0}</li>
                    <li>Expense entries: {lastBundle.stores.expenses?.length ?? 0}</li>
                    <li>Notes: {lastBundle.stores.notes?.length ?? 0} · Habits: {lastBundle.stores.habits?.length ?? 0}</li>
                    <li>Tasks: {lastBundle.stores.todos?.length ?? 0} · Cards: {lastBundle.stores.flashcards?.length ?? 0}</li>
                    <li>Readings: {lastBundle.stores.readings?.length ?? 0} · Breathe: {lastBundle.stores.breatheSessions?.length ?? 0}</li>
                    <li>Profile: {profile.profileName} · {profile.profileAvatar ? 'avatar ✓' : 'no avatar'}</li>
                    <li>Goal (water): {water?.dailyTargetMl ?? '—'}ml</li>
                    <li>Budget: {expense?.limit ?? '—'} {expense?.currency ?? ''}</li>
                    <li>Study goal: {study?.dailyGoalMin ?? '—'}m / day</li>
                  </ul>
                );
              })()}
            </div>
          )}
        </div>
      </Card>

      <SettingsGroup title="Storage">
        <SettingsRow
          icon={<FileJson className="size-[17px]" />}
          label="Local IndexedDB usage"
          description={
            storage
              ? `${(storage.usage / 1_048_576).toFixed(2)} MB of ${(storage.quota / 1_048_576).toFixed(0)} MB quota`
              : 'Calculating…'
          }
          control={
            <span className="text-[12px] font-semibold text-ink2">
              {storage ? `${Math.round((storage.usage / Math.max(1, storage.quota)) * 100)}%` : '—'}
            </span>
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Danger zone" description="Wipes every store and resets to defaults">
        <SettingsRow
          danger
          icon={<Trash2 className="size-[17px]" />}
          label="Erase every app's data"
          description="Keep the app shells, lose every log and setting"
          onClick={() => setConfirm('wipe')}
        />
      </SettingsGroup>

      <EmptyState
        title="Need to roll back?"
        description="Pick a previously exported JSON file from your device to import it. Existing data will be replaced."
        action={
          <CustomButton variant="outline" onClick={goBack}>
            Back to device
          </CustomButton>
        }
      />

      <ConfirmDialog
        open={confirm === 'import'}
        tone="warning"
        title="Import this backup?"
        description={
          pendingFile
            ? `${pendingFile.name} will replace all current app data on this device.`
            : 'A file will replace all current app data on this device.'
        }
        confirmLabel="Replace data"
        onCancel={() => {
          setConfirm(null);
          setPendingFile(null);
          if (fileRef.current) fileRef.current.value = '';
        }}
        onConfirm={handleImport}
      />

      <ConfirmDialog
        open={confirm === 'wipe'}
        tone="danger"
        title="Erase every app's data?"
        description="Water logs, study sessions, expenses and device settings are permanently removed."
        confirmLabel="Erase everything"
        onCancel={() => setConfirm(null)}
        onConfirm={handleWipe}
      />
    </ScreenShell>
  );
}

function ActionTile({
  icon,
  title,
  description,
  accent,
  onClick,
  busy,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  onClick: () => void;
  busy?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={busy}
      className="tap flex flex-col items-start gap-2 rounded-2xl border border-hairline bg-surface2/60 p-3.5 text-left disabled:opacity-50"
    >
      <span
        className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg ${accent}`}
      >
        {icon}
      </span>
      <span className="text-[14px] font-semibold text-ink">{title}</span>
      <span className="text-[11.5px] text-ink3">{description}</span>
    </motion.button>
  );
}
