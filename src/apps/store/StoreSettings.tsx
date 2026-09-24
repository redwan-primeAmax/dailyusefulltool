import { useEffect, useState } from 'react';
import { CheckCircle2, Database, HardDriveDownload, Store, Trash2 } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { Segmented, Toggle } from '../../components/ui/controls';
import { ConfirmDialog } from '../../components/Modal';
import { AppIcon } from '../../components/ui/AppIcon';
import { useOS } from '../../context/OSContext';
import { STORED_APPS } from '../registry';
import { appService } from '../../db/trackerService';
import { estimateStorage } from '../../db/indexedDB';
import type { AppManifest } from '../../types';

type Order = 'recent' | 'name';

/** Sentinel used to represent the "reset OS" confirmation target. */
const SENTINEL = { id: '__reset__' } as unknown as AppManifest;

/** Play Store — library & preference management. */
export function StoreSettings() {
  const { installed, installedMap, uninstall, notify, goBack, device, setDevice, launchApp } = useOS();
  const [order, setOrder] = useState<Order>('recent');
  const [confirm, setConfirm] = useState<AppManifest | null>(null);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    void estimateStorage().then(setStorage);
  }, []);

  const installedApps = STORED_APPS.filter((app) => installed.includes(app.id)).sort((a, b) => {
    if (order === 'name') return a.name.localeCompare(b.name);
    return (installedMap[b.id]?.installedAt ?? 0) - (installedMap[a.id]?.installedAt ?? 0);
  });

  const usageMb = storage ? (storage.usage / 1_048_576).toFixed(2) : '—';

  return (
    <ScreenShell
      title="Store settings"
      subtitle="Library, network & storage"
      icon={<Store className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="My apps" description={`${installedApps.length} app(s) on this device`}>
        <SettingsRow
          label="Sort by"
          control={
            <Segmented
              className="w-[150px]"
              size="sm"
              ariaLabel="sort"
              value={order}
              onChange={setOrder}
              options={[
                { value: 'recent' as Order, label: 'Recent' },
                { value: 'name' as Order, label: 'A–Z' },
              ]}
            />
          }
        />
        {installedApps.map((app) => (
          <SettingsRow
            key={app.id}
            icon={<AppIcon icon={app.icon} gradient={app.gradient} size="sm" />}
            label={app.name}
            description={`v${app.version} · ${app.sizeMb} MB`}
            onClick={() => launchApp(app.id)}
            control={
              <div className="flex items-center gap-1">
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Installed
                </span>
                {!app.core && (
                  <button
                    type="button"
                    aria-label={`Uninstall ${app.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirm(app);
                    }}
                    className="tap grid size-9 place-items-center rounded-full text-ink3 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            }
          />
        ))}
      </SettingsGroup>

      <SettingsGroup title="Downloads">
        <SettingsRow
          icon={<HardDriveDownload className="size-[17px]" />}
          label="Auto-update apps"
          description="Install new mini-app versions silently"
          control={
            <Toggle
              label="Auto update"
              checked={device.animations}
              onChange={(animations) => setDevice({ animations })}
            />
          }
        />
        <SettingsRow
          icon={<Database className="size-[17px]" />}
          label="Storage used"
          description={`${usageMb} MB of offline tracker data`}
          control={
            <span className="text-[12px] font-semibold text-ink2">
              {storage ? `${Math.round((storage.usage / Math.max(1, storage.quota)) * 100)}%` : '—'}
            </span>
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Danger zone">
        <SettingsRow
          danger
          icon={<Trash2 className="size-[17px]" />}
          label="Reset entire OS"
          description="Uninstalls all apps and wipes tracker history"
          onClick={() => setConfirm(SENTINEL)}
        />
      </SettingsGroup>

      <ConfirmDialog
        open={confirm !== null}
        tone="danger"
        title={confirm === SENTINEL ? 'Reset OS?' : confirm ? `Uninstall ${confirm.name}?` : ''}
        description={
          confirm === SENTINEL
            ? 'Everything returns to a fresh install state.'
            : 'App data for this mini-app will be removed from storage.'
        }
        confirmLabel={confirm === SENTINEL ? 'Reset OS' : 'Uninstall'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === SENTINEL) {
            STORED_APPS.filter((a) => !a.core).forEach((a) => void appService.uninstall(a.id));
            notify({ title: 'OS reset complete', tone: 'warning' });
          } else if (confirm) {
            void uninstall(confirm.id);
          }
          setConfirm(null);
          goBack();
        }}
      />

      <section className="pb-2 text-center text-[11.5px] text-ink3">
        Play Store · v14.2.6 · all data offline via IndexedDB
      </section>
    </ScreenShell>
  );
}
