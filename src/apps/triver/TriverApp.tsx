import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Download, FileText, Lock, Package, ShieldCheck } from 'lucide-react';
import JSZip from 'jszip';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { Card } from '../../components/ui/Card';
import { CustomButton } from '../../components/CustomButton';
import { Modal } from '../../components/Modal';
import { useOS } from '../../context/OSContext';
import { DOC_FILES, byteSize, formatBytes, validateAccess } from './docs';

type Phase = 'idle' | 'verifying' | 'packing' | 'done';

export function TriverApp() {
  const { notify, openScreen } = useOS();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');

  const totalBytes = useMemo(
    () => DOC_FILES.reduce((sum, doc) => sum + byteSize(doc.content), 0),
    [],
  );

  const openModal = () => {
    setName('');
    setError('');
    setModalOpen(true);
  };

  /** Builds the archive and triggers an explicit, user-initiated download. */
  const buildAndDownload = async () => {
    setPhase('packing');
    try {
      const zip = new JSZip();
      zip.file(
        'README.md',
        `# Web OS Documentation Bundle\n\nExported: ${new Date().toLocaleString()}\nFiles: ${DOC_FILES.length}\n\n${DOC_FILES.map((d) => `- ${d.path}`).join('\n')}\n`,
      );
      for (const doc of DOC_FILES) zip.file(doc.path, doc.content);

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `webos-docs-${new Date().toISOString().slice(0, 10)}.zip`;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      // Give the browser a tick to start the transfer before revoking.
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      setPhase('done');
      setModalOpen(false);
      notify({
        title: 'Documentation exported',
        description: `${DOC_FILES.length} files · ${formatBytes(totalBytes)}`,
        tone: 'success',
      });
    } catch (err) {
      setPhase('idle');
      notify({ title: 'Export failed', description: String(err), tone: 'danger' });
    }
  };

  const submit = () => {
    setPhase('verifying');
    if (!validateAccess(name)) {
      setError('Access denied. That name is not authorised.');
      setPhase('idle');
      return;
    }
    setError('');
    void buildAndDownload();
  };

  return (
    <ScreenShell
      title="Triver"
      subtitle="Export all suite documentation"
      icon={<Package className="size-[19px]" />}
      onOpenSettings={() => openScreen('triver', 'settings')}
      contentClassName="space-y-4"
    >
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[26px] border border-hairline bg-gradient-to-br from-slate-800/60 to-zinc-900/60 p-5">
        <motion.div
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-sky-500/15 blur-3xl"
          animate={{ opacity: [0.4, 0.75, 0.4], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative">
          <span className="grid size-12 place-items-center rounded-2xl bg-sky-500/20 text-sky-300">
            <Package className="size-6" />
          </span>
          <p className="mt-3 text-[17px] font-bold text-ink">Documentation archive</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink2">
            Bundles every app's Markdown specification — UI components, button
            behaviour, routing, animation triggers and state — into one .zip.
          </p>
          <div className="mt-3 flex items-center gap-3 text-[11.5px] font-semibold text-ink3">
            <span>{DOC_FILES.length} documents</span>
            <span>·</span>
            <span>{formatBytes(totalBytes)}</span>
          </div>
        </div>
      </div>

      <CustomButton
        fullWidth
        size="lg"
        onClick={openModal}
        loading={phase === 'packing'}
        leadingIcon={phase === 'packing' ? undefined : <Download className="size-[18px]" />}
      >
        {phase === 'packing' ? 'Packaging…' : 'Download documentation'}
      </CustomButton>

      <Card title="Included files" subtitle="Kept in sync with every code change">
        <ul className="divide-y divide-hairline">
          {DOC_FILES.map((doc, i) => (
            <motion.li
              key={doc.path}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface3/70 text-ink3">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink">{doc.title}</p>
                <p className="truncate text-[10.5px] text-ink3">{doc.path}</p>
              </div>
              <span className="shrink-0 text-[11px] font-semibold text-ink3">
                {formatBytes(byteSize(doc.content))}
              </span>
            </motion.li>
          ))}
        </ul>
      </Card>

      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/25 bg-amber-500/8 p-3.5">
        <Lock className="mt-0.5 size-4 shrink-0 text-amber-400" />
        <p className="text-[11.5px] leading-relaxed text-amber-200/80">
          Exports are access-controlled. You'll be asked for an authorised name
          before the archive is generated.
        </p>
      </div>

      {/* Access modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sheet
        title="Verify access"
        description="Enter your authorised name to unlock the export."
        footer={
          <>
            <CustomButton variant="ghost" fullWidth onClick={() => setModalOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton
              fullWidth
              onClick={submit}
              loading={phase === 'packing'}
              leadingIcon={phase === 'packing' ? undefined : <ShieldCheck className="size-4" />}
            >
              Verify & download
            </CustomButton>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink3">
              Authorised name
            </span>
            <input
              type="text"
              name="triver-access-name"
              id="triver-access-name"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Enter name"
              className="w-full rounded-2xl border border-hairline bg-surface3/60 px-4 py-3 text-[15px] font-semibold tracking-wide text-ink outline-none focus:border-accent/60"
            />
          </label>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-300"
              >
                <AlertCircle className="size-4 shrink-0" /> {error}
              </motion.p>
            )}
          </AnimatePresence>

          <p className="text-[11px] leading-relaxed text-ink3">
            The download starts only after successful verification and is
            triggered by your action — nothing downloads automatically.
          </p>
        </div>
      </Modal>
    </ScreenShell>
  );
}
