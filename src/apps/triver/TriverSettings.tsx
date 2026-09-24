import { FileText, Info, Lock, Package } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { DangerZone } from '../../components/ui/DangerZone';
import { DOC_FILES, byteSize, formatBytes } from './docs';

export function TriverSettings() {
  const total = DOC_FILES.reduce((sum, d) => sum + byteSize(d.content), 0);

  return (
    <ScreenShell
      title="Triver settings"
      subtitle="Archive contents & access"
      icon={<Package className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="Archive">
        <SettingsRow
          icon={<FileText className="size-[17px]" />}
          label="Bundled documents"
          description={`${DOC_FILES.length} Markdown files · ${formatBytes(total)} uncompressed`}
        />
        <SettingsRow
          icon={<Package className="size-[17px]" />}
          label="Output format"
          description="DEFLATE-compressed .zip with a generated README index"
        />
      </SettingsGroup>

      <SettingsGroup title="Access control">
        <SettingsRow
          icon={<Lock className="size-[17px]" />}
          label="Name verification"
          description="Exports require an authorised name; the field opts out of browser autofill"
        />
        <SettingsRow
          icon={<Info className="size-[17px]" />}
          label="Download policy"
          description="Downloads are always user-initiated — nothing transfers automatically"
        />
      </SettingsGroup>

      <DangerZone
        appName="Triver"
        actions={[{
          label: 'Clear cached exports',
          description: 'Releases any object URLs held in memory',
          confirmTitle: 'Clear cached exports?',
          confirmDescription: 'Generated archives are discarded. Documentation itself is unaffected.',
        }]}
      />

      <section className="pb-2 text-center text-[11.5px] text-ink3">Triver · v1.0.0</section>
    </ScreenShell>
  );
}
