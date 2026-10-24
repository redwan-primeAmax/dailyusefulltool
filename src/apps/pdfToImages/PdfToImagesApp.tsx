import { useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileArchive,
  FileImage,
  FileText,
  X,
} from 'lucide-react';
import JSZip from 'jszip';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { CustomButton } from '../../components/CustomButton';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';
import { cn } from '../../utils/cn';
import {
  createZipFilename,
  getSafeRenderScale,
  pageImageFilename,
  sortPageImages,
  type PageImageBlob,
  type PdfImageFormat,
} from './pdfToImagesModel';

async function loadPdfJs() {
  const [pdfjsLib, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjsLib;
}

const FORMAT_CHOICES: { id: PdfImageFormat; label: string; note: string }[] = [
  { id: 'png', label: 'PNG', note: 'Lossless quality' },
  { id: 'jpeg', label: 'JPEG', note: 'Smaller images' },
];

const SCALE_CHOICES = [
  { scale: 1, label: 'Fast', note: '1×' },
  { scale: 1.5, label: 'Balanced', note: '1.5×' },
  { scale: 2, label: 'High detail', note: '2×' },
] as const;

type ProcessStage = 'idle' | 'loading' | 'rendering' | 'zipping' | 'complete';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canvasToBlob(canvas: HTMLCanvasElement, format: PdfImageFormat): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('The browser could not encode a page image.')),
      format === 'png' ? 'image/png' : 'image/jpeg',
      format === 'jpeg' ? 0.92 : undefined,
    );
  });
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/password|encrypted/i.test(message)) return 'This PDF is password-protected. Remove the password and try again.';
  if (/worker/i.test(message)) return 'The PDF rendering worker could not start. Reload the app and try again.';
  return 'Could not process this PDF. Make sure it is valid and try again.';
}

export function PdfToImagesApp() {
  const { notify } = useOS();
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<PdfImageFormat>('png');
  const [scale, setScale] = useState<number>(1);
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState<ProcessStage>('idle');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [zipFilename, setZipFilename] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const selectedFile = input.files?.[0] ?? null;
    input.value = '';
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !/\.pdf$/iu.test(selectedFile.name)) {
      setFile(null);
      setError('Choose a PDF file to continue.');
      setZipBlob(null);
      setZipFilename('');
      setPageCount(0);
      setProgress(0);
      setProgressLabel('');
      setStage('idle');
      return;
    }

    setFile(selectedFile);
    setError('');
    setZipBlob(null);
    setZipFilename('');
    setPageCount(0);
    setProgress(0);
    setProgressLabel('');
    setStage('idle');
  };

  const processPdf = async () => {
    if (!file || processing) return;
    setProcessing(true);
    setError('');
    setZipBlob(null);
    setPageCount(0);
    setProgress(0);
    setProgressLabel('Loading and inspecting the PDF…');
    setStage('loading');

    let pdfDocument: PDFDocumentProxy | null = null;
    const canvas = document.createElement('canvas');
    const pageImages: PageImageBlob[] = [];

    try {
      const [sourceBuffer, pdfjsLib] = await Promise.all([file.arrayBuffer(), loadPdfJs()]);
      const source = new Uint8Array(sourceBuffer);
      pdfDocument = await pdfjsLib.getDocument({ data: source, isEvalSupported: false }).promise;
      const totalPages = pdfDocument.numPages;
      if (totalPages < 1) throw new Error('The PDF has no pages.');
      setPageCount(totalPages);
      setStage('rendering');

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        setProgressLabel(`Rendering page ${pageNumber.toLocaleString('en-US')} of ${totalPages.toLocaleString('en-US')}`);
        const page = await pdfDocument.getPage(pageNumber);
        try {
          const baseViewport = page.getViewport({ scale: 1 });
          const safeScale = getSafeRenderScale(baseViewport.width, baseViewport.height, scale);
          const viewport = page.getViewport({ scale: safeScale });
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

          const context = canvas.getContext('2d', { alpha: false });
          if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvas, viewport, background: '#ffffff' }).promise;
          const blob = await canvasToBlob(canvas, format);
          pageImages.push({
            pageNumber,
            filename: pageImageFilename(pageNumber, totalPages, format),
            blob,
          });
        } finally {
          page.cleanup();
          canvas.width = 0;
          canvas.height = 0;
        }
        setProgress(Math.floor((pageNumber / totalPages) * 85));
      }

      await pdfDocument.destroy();
      pdfDocument = null;
      setStage('zipping');
      setProgressLabel('Packaging images in numeric page order…');
      const zip = new JSZip();
      for (const image of sortPageImages(pageImages)) {
        zip.file(image.filename, image.blob, { compression: 'STORE' });
      }

      const generatedZip = await zip.generateAsync(
        { type: 'blob', compression: 'STORE', streamFiles: true },
        (metadata) => {
          setProgress(85 + Math.floor((metadata.percent / 100) * 15));
          setProgressLabel('Creating the ZIP archive…');
        },
      );
      const outputName = createZipFilename(file.name);
      setZipBlob(generatedZip);
      setZipFilename(outputName);
      setProgress(100);
      setProgressLabel(`Complete · ${totalPages.toLocaleString('en-US')} pages converted`);
      setStage('complete');
      notify({
        title: 'PDF conversion complete',
        description: `${totalPages.toLocaleString('en-US')} ordered ${format.toUpperCase()} images are ready to download.`,
        tone: 'success',
      });
    } catch (conversionError) {
      const message = safeErrorMessage(conversionError);
      setError(message);
      setStage('idle');
      setProgressLabel('');
      notify({ title: 'PDF conversion failed', description: message, tone: 'danger' });
    } finally {
      canvas.width = 0;
      canvas.height = 0;
      if (pdfDocument) await pdfDocument.destroy().catch(() => undefined);
      setProcessing(false);
    }
  };

  const downloadZip = () => {
    if (!zipBlob || !zipFilename) return;
    const url = URL.createObjectURL(zipBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = zipFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify({ title: 'ZIP download started', description: zipFilename, tone: 'success' });
  };

  const clearSelection = () => {
    setFile(null);
    setZipBlob(null);
    setZipFilename('');
    setPageCount(0);
    setProgress(0);
    setProgressLabel('');
    setError('');
    setStage('idle');
  };

  const isBusy = processing || stage === 'loading' || stage === 'rendering' || stage === 'zipping';

  return (
    <ScreenShell
      title="PDF to Images Converter"
      subtitle="Convert every page into a sorted image ZIP"
      icon={<FileImage className="size-[19px]" />}
      contentClassName="!pb-24"
    >
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-[26px] border border-orange-300/15 bg-gradient-to-br from-orange-500/15 via-slate-900/95 to-slate-950 p-5">
          <div className="pointer-events-none absolute -right-12 -top-14 size-40 rounded-full bg-orange-400/10 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-orange-300/20 bg-orange-400/10 text-orange-200">
              <FileImage size={21} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-orange-200/70">PDF page renderer</p>
              <h2 className="mt-1 text-xl font-black text-white">One page, one image.</h2>
              <p className="mt-1 text-sm leading-5 text-slate-400">Convert pages locally, track progress, and download a ZIP with pages in numeric order.</p>
            </div>
          </div>
          <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.07] pt-3 text-xs text-slate-400">
            <span>PDF never leaves this browser</span>
            <span>Sequential rendering limits memory use</span>
          </div>
        </section>

        <section className="space-y-4 rounded-[24px] border border-white/[0.08] bg-slate-900/75 p-4 shadow-lg shadow-black/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">Step 1 · Choose a file</p>
              <h2 className="mt-1 text-sm font-bold text-white">Select one PDF document</h2>
            </div>
            {file && !isBusy && (
              <button
                type="button"
                onClick={clearSelection}
                aria-label="Clear selected PDF"
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-slate-400 transition hover:text-rose-200"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <label className={cn(
            'flex min-h-[92px] cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-3 transition',
            file ? 'border-emerald-300/20 bg-emerald-400/[0.05]' : 'border-white/[0.12] bg-slate-950/30 hover:border-orange-300/30',
            isBusy && 'pointer-events-none opacity-60',
          )}>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              disabled={isBusy}
              className="sr-only"
              aria-label="Choose PDF file"
            />
            <span className={cn(
              'grid size-11 shrink-0 place-items-center rounded-2xl',
              file ? 'bg-emerald-400/10 text-emerald-200' : 'bg-orange-400/10 text-orange-200',
            )}>
              {file ? <FileText size={20} /> : <FileArchive size={20} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white">{file ? file.name : 'Choose a PDF file'}</span>
              <span className="mt-1 block text-xs text-slate-500">{file ? `${formatFileSize(file.size)} · ${pageCount ? `${pageCount} pages` : 'Ready to process'}` : 'PDF files only · processed locally'}</span>
            </span>
            <span className="shrink-0 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[10px] font-bold text-slate-300">Browse</span>
          </label>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Image format</p>
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_CHOICES.map((choice) => {
                const active = format === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    aria-pressed={active}
                    disabled={isBusy}
                    onClick={() => setFormat(choice.id)}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300',
                      active ? 'border-orange-300/30 bg-orange-400/10' : 'border-white/[0.08] bg-slate-950/30 hover:border-white/15',
                      isBusy && 'opacity-50',
                    )}
                  >
                    <span className="block text-xs font-bold text-white">{choice.label}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">{choice.note}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Render quality</p>
              <p className="text-[10px] text-slate-500">Large pages are automatically capped for memory safety.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SCALE_CHOICES.map((choice) => {
                const active = scale === choice.scale;
                return (
                  <button
                    key={choice.scale}
                    type="button"
                    aria-pressed={active}
                    disabled={isBusy}
                    onClick={() => setScale(choice.scale)}
                    className={cn(
                      'rounded-xl border px-2 py-2.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300',
                      active ? 'border-orange-300/30 bg-orange-400/10' : 'border-white/[0.08] bg-slate-950/30 hover:border-white/15',
                      isBusy && 'opacity-50',
                    )}
                  >
                    <span className="block text-[11px] font-bold text-white">{choice.label}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">{choice.note}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <CustomButton
            fullWidth
            size="lg"
            disabled={!file || isBusy}
            onClick={() => void processPdf()}
            leadingIcon={isBusy ? <motion.span className="inline-block size-4 rounded-full border-2 border-white/35 border-t-white" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} /> : <FileImage className="size-4" />}
          >
            {isBusy ? 'Processing PDF…' : 'Process PDF'}
          </CustomButton>

          <p className="text-center text-[10px] leading-4 text-slate-500">Page images use sequential names. Number padding is added when needed so ZIP listings stay correctly sorted.</p>
        </section>

        {isBusy && (
          <section className="rounded-2xl border border-orange-300/15 bg-orange-400/[0.06] p-4" aria-live="polite">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="truncate text-xs font-semibold text-slate-200">{progressLabel}</p>
              <p className="shrink-0 text-sm font-black tabular-nums text-orange-200">{progress}%</p>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-slate-800"
              role="progressbar"
              aria-label="PDF conversion progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </section>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-400/[0.07] p-4" role="alert">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-300" />
            <p className="text-xs leading-5 text-rose-100">{error}</p>
          </div>
        )}

        {stage === 'complete' && zipBlob && (
          <section className="rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.07] p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-200"><CheckCircle2 size={19} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">Your image ZIP is ready</p>
                <p className="mt-1 break-all text-xs text-slate-400">{zipFilename}</p>
                <p className="mt-1 text-[10px] text-slate-500">{pageCount.toLocaleString('en-US')} pages · {formatFileSize(zipBlob.size)} · {format.toUpperCase()}</p>
              </div>
            </div>
            <div className="mt-4">
              <CustomButton fullWidth onClick={downloadZip} leadingIcon={<Download className="size-4" />}>
                Download ZIP
              </CustomButton>
            </div>
          </section>
        )}
      </div>
    </ScreenShell>
  );
}
