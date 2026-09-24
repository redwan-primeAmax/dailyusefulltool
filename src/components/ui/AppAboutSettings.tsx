import { useState } from 'react';
import { AlertTriangle, Info, RotateCcw, Trash2 } from 'lucide-react';
import { ScreenShell } from './ScreenShell';
import { SettingsGroup, SettingsRow } from './SettingsRow';
import { ConfirmDialog } from '../Modal';
import { useOS } from '../../context/OSContext';
import { clearStore } from '../../db/indexedDB';

export interface AppAboutSettingsProps {
  appId: string;
  name: string;
  version: string;
  icon: React.ReactNode;
  accent?: string;
  about: string;
  /** IndexedDB stores this app writes to — cleared by "Clear app data". */
  dataStores?: string[];
}

/** Generic per-app settings page: about, version, and data management. */
export function AppAboutSettings({ appId, name, version, icon, about, dataStores = [] }: AppAboutSettingsProps) {
  const { notify } = useOS();
  const [confirm, setConfirm] = useState(false);

  const clear = async () => {
    for (const store of dataStores) await clearStore(store);
    setConfirm(false);
    notify({ title: `${name} data cleared`, tone: 'warning' });
  };

  return (
    <ScreenShell
      title={`${name} settings`}
      subtitle={`v${version}`}
      icon={icon}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="About">
        <SettingsRow icon={<Info className="size-[17px]" />} label={name} description={about} />
        <SettingsRow icon={<Info className="size-[17px]" />} label="Version" description={`v${version} · installed on Web OS`} />
      </SettingsGroup>

      <SettingsGroup title="Danger zone" description="Irreversible actions for this app.">
        <div className="flex items-start gap-2.5 border-b border-hairline bg-red-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" />
          <p className="text-[11.5px] leading-relaxed text-red-300/80">
            Permanently deletes locally stored data for {name}. Export a backup first if unsure.
          </p>
        </div>
        {dataStores.length > 0 ? (
          <SettingsRow
            danger
            icon={<Trash2 className="size-[17px]" />}
            label={`Erase ${name} data`}
            description="Removes all locally stored records for this app"
            onClick={() => setConfirm(true)}
          />
        ) : (
          <SettingsRow
            icon={<RotateCcw className="size-[17px]" />}
            label="No stored data"
            description={`${name} keeps nothing on this device`}
          />
        )}
      </SettingsGroup>

      <ConfirmDialog
        open={confirm}
        tone="danger"
        title={`Erase all ${name} data?`}
        description="This cannot be undone. The app itself stays installed."
        confirmLabel="Erase data"
        onCancel={() => setConfirm(false)}
        onConfirm={() => void clear()}
      />

      <section className="pb-2 text-center text-[11.5px] text-ink3">{name} · v{version} · id: {appId}</section>
    </ScreenShell>
  );
}
