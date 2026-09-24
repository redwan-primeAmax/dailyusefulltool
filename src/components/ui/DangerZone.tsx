import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { SettingsGroup, SettingsRow } from './SettingsRow';
import { ConfirmDialog } from '../Modal';
import { useOS } from '../../context/OSContext';
import { clearStore } from '../../db/indexedDB';
import { settingsService } from '../../db/trackerService';

export interface DangerZoneAction {
  /** Row label, e.g. "Erase all tasks". */
  label: string;
  description: string;
  /** IndexedDB object stores wiped by this action. */
  stores?: string[];
  /** Settings keys reset back to their defaults. */
  settingsKeys?: { key: string; defaults: unknown }[];
  confirmTitle: string;
  confirmDescription: string;
}

export interface DangerZoneProps {
  /** Human-readable app name used in toasts. */
  appName: string;
  actions: DangerZoneAction[];
  /** Called after a successful erase so the screen can refresh local state. */
  onCleared?: () => void;
}

/**
 * Standard "Danger Zone" block rendered at the bottom of every app's
 * Settings screen. Groups destructive, irreversible data operations
 * behind an explicit confirmation dialog.
 */
export function DangerZone({ appName, actions, onCleared }: DangerZoneProps) {
  const { notify } = useOS();
  const [pending, setPending] = useState<DangerZoneAction | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: DangerZoneAction) => {
    setBusy(true);
    try {
      for (const store of action.stores ?? []) {
        await clearStore(store);
      }
      for (const entry of action.settingsKeys ?? []) {
        await settingsService.set(entry.key, entry.defaults);
      }
      notify({ title: `${appName} data cleared`, description: action.label, tone: 'warning' });
      onCleared?.();
    } catch (error) {
      notify({ title: 'Could not clear data', description: String(error), tone: 'danger' });
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <>
      <SettingsGroup
        title="Danger zone"
        description="Irreversible actions. Export a backup first if you might need this data."
      >
        <div className="flex items-start gap-2.5 border-b border-hairline bg-red-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" />
          <p className="text-[11.5px] leading-relaxed text-red-300/80">
            These actions permanently delete locally stored data for {appName}. They cannot be undone.
          </p>
        </div>
        {actions.map((action) => (
          <SettingsRow
            key={action.label}
            danger
            icon={<Trash2 className="size-[17px]" />}
            label={action.label}
            description={action.description}
            onClick={() => setPending(action)}
          />
        ))}
      </SettingsGroup>

      <ConfirmDialog
        open={pending !== null}
        tone="danger"
        busy={busy}
        title={pending?.confirmTitle ?? ''}
        description={pending?.confirmDescription}
        confirmLabel="Erase data"
        onCancel={() => setPending(null)}
        onConfirm={() => pending && void run(pending)}
      />
    </>
  );
}
