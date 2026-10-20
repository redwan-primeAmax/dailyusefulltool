import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileArchive,
  Download,
  FileJson,
  FileText,
  Check,
  Settings2,
  X,
  FileCode,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import JSZip from 'jszip';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { CustomButton } from '../../components/CustomButton';
import { useOS } from '../../context/OSContext';
import { cn } from '../../utils/cn';
import {
  buildZipOutput,
  isBinaryZipPath,
  isExcludedByDefault,
  outputExtension,
  shouldSelectByDefault,
  type ExportFormat,
} from './zipProcessorModel';

interface ExtractedFile {
  name: string;
  content: string;
  selected: boolean;
  size: number;
  isBinary: boolean;
  excludedByDefault: boolean;
}

interface OutputOption {
  format: ExportFormat;
  letter: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const OUTPUT_OPTIONS: OutputOption[] = [
  {
    format: 'markdown',
    letter: 'A',
    title: 'Convert into Markdown',
    description: 'Combine the selected files and their full relative paths into one Markdown document.',
    icon: FileText,
  },
  {
    format: 'json',
    letter: 'B',
    title: 'Convert into JSON',
    description: 'Create a JSON object keyed by each selected file’s relative path.',
    icon: FileJson,
  },
  {
    format: 'nameParagraphs',
    letter: 'C',
    title: 'File names as paragraphs',
    description: 'Write each selected file name as its own plain-text paragraph.',
    icon: FileText,
  },
  {
    format: 'markdownNameList',
    letter: 'D',
    title: 'File names line by line in Markdown',
    description: 'Create a Markdown bullet list with one selected file name per line.',
    icon: FileCode,
  },
  {
    format: 'structure',
    letter: 'E',
    title: 'Complete ZIP structure / architecture',
    description: 'Show every file and folder in the archive, including items skipped from conversion.',
    icon: FileArchive,
  },
  {
    format: 'fullPaths',
    letter: 'F',
    title: 'File names with full relative paths',
    description: 'List each selected file’s name alongside its complete path inside the ZIP.',
    icon: FileCode,
  },
];

function looksLikeBinary(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 8192));
  for (const byte of sample) {
    if (byte === 0 || byte < 7 || (byte > 13 && byte < 32)) return true;
  }
  return false;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uncompressedSize(file: JSZip.JSZipObject): number | undefined {
  return (file as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
}

export function ZipProcessorApp() {
  const { notify } = useOS();
  const [files, setFiles] = useState<ExtractedFile[]>([]);
  const [archivePaths, setArchivePaths] = useState<string[]>([]);
  const [archiveName, setArchiveName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectionConfirmed, setSelectionConfirmed] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasArchive = archiveName.length > 0;
  const selectedFiles = useMemo(() => files.filter((file) => file.selected), [files]);
  const output = useMemo(
    () => selectedFormat ? buildZipOutput(files, selectedFormat, archivePaths, archiveName) : '',
    [files, selectedFormat, archivePaths, archiveName],
  );

  const processZip = async (file: File) => {
    if (!/\.zip$/iu.test(file.name)) {
      notify({ title: 'Invalid file', description: 'Please choose a .zip archive.', tone: 'danger' });
      return;
    }

    setLoading(true);
    const start = performance.now();
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      const entries = Object.entries(loadedZip.files);
      const structure = entries.map(([path, entry]) => entry.dir && !path.endsWith('/') ? `${path}/` : path);
      const extracted = await Promise.all(entries.map(async ([path, entry]) => {
        if (entry.dir) return null;

        let size = uncompressedSize(entry) ?? 0;
        let isBinary = isBinaryZipPath(path);
        let content = '';
        if (isBinary) {
          content = `[Binary file omitted from text conversion · ${formatSize(size)}]`;
        } else {
          const bytes = await entry.async('uint8array');
          size = bytes.byteLength;
          try {
            if (looksLikeBinary(bytes)) throw new Error('Binary data');
            content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
          } catch {
            isBinary = true;
            content = `[Binary or non-UTF-8 file omitted from text conversion · ${formatSize(size)}]`;
          }
        }
        const excludedByDefault = isExcludedByDefault(path, isBinary);
        return {
          name: path,
          content,
          size,
          isBinary,
          excludedByDefault,
          selected: shouldSelectByDefault(path, isBinary),
        } satisfies ExtractedFile;
      }));
      const fileEntries = extracted
        .filter((entry): entry is ExtractedFile => entry !== null)
        .sort((a, b) => a.name.localeCompare(b.name));

      setFiles(fileEntries);
      setArchivePaths(structure);
      setArchiveName(file.name);
      setSelectionConfirmed(false);
      setSelectedFormat(null);
      setDrawerOpen(true);

      const skippedByDefault = fileEntries.filter((entry) => entry.excludedByDefault).length;
      const elapsed = Math.round(performance.now() - start);
      notify({
        title: 'ZIP ready for selection',
        description: `${fileEntries.length} files listed; ${skippedByDefault} binary/config/system items skipped by default · ${elapsed} ms`,
        tone: 'success',
      });
    } catch {
      setFiles([]);
      setArchivePaths([]);
      setArchiveName('');
      setDrawerOpen(false);
      notify({ title: 'Extraction failed', description: 'The ZIP may be malformed, encrypted, or unsupported.', tone: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    const file = target.files?.[0];
    target.value = '';
    if (file) void processZip(file);
  };

  const toggleFile = (name: string) => {
    setFiles((current) => current.map((file) => file.name === name ? { ...file, selected: !file.selected } : file));
  };

  const toggleAll = (select: boolean) => {
    setFiles((current) => current.map((file) => ({ ...file, selected: select })));
  };

  const restoreDefaultSelection = () => {
    setFiles((current) => current.map((file) => ({ ...file, selected: !file.excludedByDefault })));
  };

  const confirmSelection = () => {
    setSelectionConfirmed(true);
    setSelectedFormat(null);
    setDrawerOpen(false);
  };

  const startNewArchive = () => {
    setFiles([]);
    setArchivePaths([]);
    setArchiveName('');
    setSelectionConfirmed(false);
    setSelectedFormat(null);
    setDrawerOpen(false);
  };

  const downloadOutput = () => {
    if (!selectedFormat || !output) return;
    const extension = outputExtension(selectedFormat);
    const baseName = archiveName
      .replace(/\.zip$/iu, '')
      .replace(/[<>:"/\\|?*\u0000-\u001f]+/gu, '-')
      .trim() || 'zip-export';
    const blob = new Blob([output], {
      type: selectedFormat === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${baseName}-${selectedFormat}.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify({ title: 'Export downloaded', description: `${anchor.download} is ready.`, tone: 'success' });
  };

  return (
    <ScreenShell
      title="ZIP Processor"
      subtitle="Select, analyze, and export ZIP contents"
      icon={<FileArchive className="size-[19px]" />}
      contentClassName="!pb-24"
    >
      <div className="space-y-4">
        {!hasArchive ? (
          <div className="relative group">
            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handleFileUpload}
              disabled={loading}
              aria-label="Choose a ZIP archive"
              className="absolute inset-0 z-10 w-full cursor-pointer opacity-0 disabled:cursor-wait"
            />
            <div className={cn(
              'card flex min-h-[290px] flex-col items-center justify-center gap-5 border-dashed p-10 text-center transition-all',
              loading ? 'opacity-50' : 'hover:border-accent group-active:scale-[0.98]',
            )}>
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-accent/20 blur-xl" />
                <div className="relative grid size-20 place-items-center rounded-[28px] bg-gradient-to-br from-accent to-blue-600 shadow-xl">
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <FileArchive className="size-10 text-white" />
                    </motion.div>
                  ) : (
                    <FileArchive className="size-10 text-white" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">Step 1 · Upload</p>
                <h2 className="mt-2 text-[18px] font-bold text-ink">{loading ? 'Reading ZIP archive…' : 'Choose a ZIP archive'}</h2>
                <p className="mt-1 text-[13px] text-ink3">Your archive stays in this browser; nothing is uploaded.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="card space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent"><FileArchive className="size-5" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">Archive loaded</p>
                    <h2 className="mt-1 break-all text-[15px] font-bold text-ink">{archiveName}</h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startNewArchive}
                  aria-label="Choose another ZIP archive"
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface2 text-ink3 transition hover:text-red-400"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-surface2 p-3">
                  <p className="text-xl font-black tabular-nums text-ink">{selectedFiles.length}<span className="text-sm font-semibold text-ink3"> / {files.length}</span></p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-ink3">Files selected</p>
                </div>
                <div className="rounded-xl bg-surface2 p-3">
                  <p className="text-xl font-black tabular-nums text-ink">{archivePaths.length}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-ink3">Files & folders in ZIP</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-4 text-sm font-bold text-accent transition hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Settings2 className="size-4" /> {selectionConfirmed ? 'Manage file selection' : 'Review file selection'}
              </button>
            </section>

            {!selectionConfirmed ? (
              <section className="card border border-accent/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-accent">Step 2 · Select files</p>
                <h2 className="mt-1 text-base font-bold text-ink">Choose what to include</h2>
                <p className="mt-1 text-[13px] leading-5 text-ink3">Text files start selected. Binary, configuration, and system files remain listed but are skipped by default. Press Done in the file list to see the export options.</p>
                <button type="button" onClick={() => setDrawerOpen(true)} className="mt-3 text-xs font-bold text-accent">Open file list</button>
              </section>
            ) : selectedFormat ? (
              <section className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-surface2/70 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-emerald-500">Output preview</p>
                    <h2 className="mt-0.5 truncate text-sm font-bold text-ink">
                      {OUTPUT_OPTIONS.find((option) => option.format === selectedFormat)?.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat(null)}
                    className="rounded-lg px-2.5 py-2 text-xs font-bold text-accent transition hover:bg-accent/10"
                  >
                    Change format
                  </button>
                </div>
                <pre className="max-h-[55vh] min-h-40 overflow-auto whitespace-pre-wrap break-words bg-[#0a0d14] p-4 font-mono text-[11px] leading-relaxed text-emerald-300/90">
                  {output || 'No selected files to display.'}
                </pre>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline p-4">
                  <p className="text-[11px] text-ink3">{selectedFormat === 'structure' ? 'Includes the complete archive, regardless of selection.' : `${selectedFiles.length} selected file${selectedFiles.length === 1 ? '' : 's'}`}</p>
                  <CustomButton onClick={downloadOutput} disabled={!output} leadingIcon={<Download className="size-4" />}>
                    Download export
                  </CustomButton>
                </div>
              </section>
            ) : (
              <section className="space-y-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-accent">Step 3 · Choose an output</p>
                  <h2 className="mt-1 text-base font-bold text-ink">What would you like to generate?</h2>
                  <p className="mt-1 text-xs text-ink3">These options appear after you confirm file selection.</p>
                </div>
                {selectedFiles.length === 0 && (
                  <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-5 text-ink2">
                    No files are selected. Choose files to convert, or use the complete ZIP structure option.
                  </div>
                )}
                <div className="grid gap-2.5">
                  {OUTPUT_OPTIONS.map((option) => {
                    const OptionIcon = option.icon;
                    const disabled = option.format !== 'structure' && selectedFiles.length === 0;
                    return (
                      <button
                        key={option.format}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedFormat(option.format)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl border border-hairline bg-surface p-3.5 text-left transition',
                          disabled ? 'cursor-not-allowed opacity-45' : 'hover:border-accent/35 hover:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        )}
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><OptionIcon className="size-[18px]" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-bold text-ink"><span className="mr-1.5 text-accent">{option.letter}.</span>{option.title}</span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-ink3">{option.description}</span>
                        </span>
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-ink3">{outputExtension(option.format).toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {drawerOpen && hasArchive && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.section
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              aria-label="Select ZIP files"
              className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[88vh] flex-col rounded-t-[32px] border-t border-hairline bg-surface shadow-2xl"
            >
              <div className="shrink-0 border-b border-hairline px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Step 2 · Select files</p>
                    <h2 className="mt-1 text-[18px] font-black text-ink">Choose ZIP contents</h2>
                    <p className="mt-0.5 text-[12px] text-ink3">{selectedFiles.length} of {files.length} files selected · {archivePaths.length} total entries</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close file selection"
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-surface2 text-ink transition hover:text-accent"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline bg-surface2 px-5 py-3">
                <button type="button" onClick={() => toggleAll(true)} className="text-[12px] font-bold text-accent">Select all</button>
                <button type="button" onClick={() => toggleAll(false)} className="text-[12px] font-bold text-ink3">Deselect all</button>
                <button type="button" onClick={restoreDefaultSelection} className="text-[12px] font-bold text-ink3">Restore defaults</button>
                <span className="ml-auto text-[10px] text-ink3">Files remain in the ZIP; this only changes the export selection.</span>
              </div>

              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-3">
                {files.length === 0 ? (
                  <p className="p-5 text-center text-sm text-ink3">No files were found. You can still generate the archive structure.</p>
                ) : files.map((file) => (
                  <button
                    key={file.name}
                    type="button"
                    aria-pressed={file.selected}
                    onClick={() => toggleFile(file.name)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-[18px] border p-3 text-left transition',
                      file.selected ? 'border-accent/20 bg-accent/10' : 'border-transparent hover:bg-surface2',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className={cn(
                        'grid size-9 shrink-0 place-items-center rounded-xl',
                        file.selected ? 'bg-accent text-white' : file.isBinary ? 'bg-amber-500/10 text-amber-500' : 'bg-surface3 text-ink3',
                      )}>
                        <FileCode className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className={cn('block break-all text-[13px] font-bold', file.selected ? 'text-ink' : 'text-ink2')} title={file.name}>{file.name}</span>
                        <span className="mt-0.5 block text-[10px] text-ink3">
                          {formatSize(file.size)} · {file.isBinary ? 'Binary — conversion uses a placeholder' : file.excludedByDefault ? 'System, config, or asset file — skipped by default' : 'Text file'}
                        </span>
                      </span>
                    </span>
                    <span className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full border-2 transition',
                      file.selected ? 'border-accent bg-accent text-white' : 'border-hairline text-transparent',
                    )}>
                      {file.selected && <Check className="size-3.5" strokeWidth={4} />}
                    </span>
                  </button>
                ))}
              </div>

              <div className="shrink-0 border-t border-hairline p-5 pb-8">
                <CustomButton fullWidth size="lg" onClick={confirmSelection} leadingIcon={<CheckCircle2 className="size-4" />}>
                  Done · {selectedFiles.length} selected
                </CustomButton>
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </ScreenShell>
  );
}
