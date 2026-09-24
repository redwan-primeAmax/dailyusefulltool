import { CheckSquare, Database, Info } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { DangerZone } from '../../components/ui/DangerZone';
import { useOS } from '../../context/OSContext';

const PRIORITIES = [
  { label: 'Low', tone: '#1f2937', ink: '#94a3b8', note: 'Dark / near-black' },
  { label: 'Medium', tone: '#d9a441', ink: '#d9a441', note: 'Muted warm amber' },
  { label: 'High', tone: '#a3e635', ink: '#a3e635', note: 'Light green / lime' },
];

export function TodoSettings() {
  const { openScreen } = useOS();

  return (
    <ScreenShell
      title="To-Do settings"
      subtitle="Priorities, data & about"
      icon={<CheckSquare className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="Priority colours" description="Fixed scheme used across the task list.">
        {PRIORITIES.map((p) => (
          <SettingsRow
            key={p.label}
            icon={<span className="size-3.5 rounded-full" style={{ background: p.tone }} />}
            label={p.label}
            description={p.note}
            control={
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${p.tone}2e`, color: p.ink }}
              >
                {p.label}
              </span>
            }
          />
        ))}
      </SettingsGroup>

      <SettingsGroup title="About">
        <SettingsRow
          icon={<Info className="size-[17px]" />}
          label="To-Do List"
          description="Priorities, starred tasks, filters and a live completion bar."
        />
        <SettingsRow
          icon={<Database className="size-[17px]" />}
          label="Import, export & backup"
          description="Handled by the Backup app"
          onClick={() => openScreen('backup', 'main')}
        />
      </SettingsGroup>

      <DangerZone
        appName="To-Do"
        actions={[{
          label: 'Erase all tasks',
          description: 'Deletes every task and restores a clean default state',
          stores: ['todos'],
          confirmTitle: 'Erase all tasks?',
          confirmDescription: 'Every task — active, completed and starred — is permanently deleted.',
          }]}
      />

      <section className="pb-2 text-center text-[11.5px] text-ink3">To-Do · v4.3.0</section>
    </ScreenShell>
  );
}
