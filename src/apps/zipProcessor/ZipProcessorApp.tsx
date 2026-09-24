import { useState, useCallback, useMemo } from 'react';
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
  AlertCircle,
  ChevronUp
} from 'lucide-react';
import JSZip from 'jszip';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { CustomButton } from '../../components/CustomButton';
import { Card } from '../../components/ui/Card';
import { useOS } from '../../context/OSContext';
import { cn } from '../../utils/cn';

interface ExtractedFile {
  name: string;
  content: string;
  selected: boolean;
  size: number;
}

type ExportFormat = 'markdown' | 'json';

export function ZipProcessorApp() {
  const { notify } = useOS();
  const [files, setFiles] = useState<ExtractedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ─────────────────────────────────────────────────────────────── */
  /*  Core Logic: extraction                                         */
  /* ─────────────────────────────────────────────────────────────── */

  const processZip = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      notify({ title: 'Invalid file', description: 'Please upload a .zip archive', tone: 'danger' });
      return;
    }

    setLoading(true);
    const start = performance.now();

    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const extracted: ExtractedFile[] = [];

      const promises = Object.keys(content.files).map(async (filename) => {
        const fileObj = content.files[filename];
        if (fileObj.dir) return;

        // Skip binary files for text processing to keep performance high
        const isLikelyText = !filename.match(/\.(jpg|jpeg|png|gif|zip|exe|pdf|bin|node|dylib|so|dll)$/i);
        
        const text = isLikelyText ? await fileObj.async('string') : '[Binary content not viewable]';
        const stats = (fileObj as any)._data?.uncompressedSize || 0;

        extracted.push({
          name: filename,
          content: text,
          selected: true,
          size: stats
        });
      });

      await Promise.all(promises);
      setFiles(extracted.sort((a, b) => a.name.localeCompare(b.name)));
      
      const end = performance.now();
      notify({ 
        title: 'Extraction Complete', 
        description: `Processed ${extracted.length} files in ${Math.round(end - start)}ms`,
        tone: 'success' 
      });
    } catch (err) {
      notify({ title: 'Extraction Failed', description: 'Malformed or encrypted ZIP archive', tone: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processZip(file);
  };

  /* ─────────────────────────────────────────────────────────────── */
  /*  Output Generation                                              */
  /* ─────────────────────────────────────────────────────────────── */

  const selectedFiles = useMemo(() => files.filter(f => f.selected), [files]);

  const output = useMemo(() => {
    if (selectedFiles.length === 0) return '';

    if (format === 'markdown') {
      return selectedFiles.map(f => {
        return `## File: ${f.name}\n\n\`\`\`\n${f.content}\n\`\`\`\n`;
      }).join('\n---\n\n');
    } else {
      const jsonObj: Record<string, string> = {};
      selectedFiles.forEach(f => {
        jsonObj[f.name] = f.content;
      });
      return JSON.stringify(jsonObj, null, 2);
    }
  }, [selectedFiles, format]);

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-data.${format === 'markdown' ? 'md' : 'json'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify({ title: 'File Ready', description: `Downloaded as ${format.toUpperCase()}`, tone: 'success' });
  };

  const toggleFile = (name: string) => {
    setFiles(prev => prev.map(f => f.name === name ? { ...f, selected: !f.selected } : f));
  };

  const toggleAll = (select: boolean) => {
    setFiles(prev => prev.map(f => ({ ...f, selected: select })));
  };

  /* ─────────────────────────────────────────────────────────────── */
  /*  Render                                                         */
  /* ─────────────────────────────────────────────────────────────── */

  return (
    <ScreenShell
      title="ZIP Processor"
      subtitle="Extract & convert to MD/JSON"
      icon={<FileArchive className="size-[19px]" />}
      contentClassName="!pb-24"
    >
      <div className="space-y-4">
        {/* Upload Hero */}
        {!files.length ? (
          <div className="relative group">
            <input 
              type="file" 
              accept=".zip" 
              onChange={handleFileUpload}
              className="absolute inset-0 z-10 w-full opacity-0 cursor-pointer"
            />
            <div className={cn(
              "card flex flex-col items-center justify-center gap-5 p-12 text-center transition-all border-dashed",
              loading ? "opacity-50" : "hover:border-accent group-active:scale-[0.98]"
            )}>
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl animate-pulse" />
                <div className="relative size-20 rounded-[28px] bg-gradient-to-br from-accent to-blue-600 grid place-items-center shadow-xl">
                  {loading ? (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <FileArchive className="size-10 text-white" />
                    </motion.div>
                  ) : (
                    <FileArchive className="size-10 text-white" />
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-ink">Drop ZIP archive here</h3>
                <p className="text-[13px] text-ink3 mt-1">Maximum performance, instant extraction</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex p-1 rounded-2xl bg-surface3 border border-hairline w-full max-w-[240px]">
                <button
                  onClick={() => setFormat('markdown')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 text-[12px] font-bold rounded-xl transition-all",
                    format === 'markdown' ? "bg-accent text-white shadow-md" : "text-ink3 hover:text-ink"
                  )}
                >
                  <FileText className="size-3.5" /> Markdown
                </button>
                <button
                  onClick={() => setFormat('json')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 text-[12px] font-bold rounded-xl transition-all",
                    format === 'json' ? "bg-accent text-white shadow-md" : "text-ink3 hover:text-ink"
                  )}
                >
                  <FileJson className="size-3.5" /> JSON
                </button>
              </div>
              <CustomButton 
                onClick={downloadOutput}
                leadingIcon={<Download className="size-4" />}
                className="shrink-0"
              >
                Export
              </CustomButton>
            </div>

            {/* Stats Summary */}
            <div className="flex gap-2">
              <div className="flex-1 card p-3 flex items-center gap-3">
                <div className="size-8 rounded-lg bg-emerald-500/15 grid place-items-center text-emerald-500">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-ink">{selectedFiles.length}</p>
                  <p className="text-[10px] text-ink3 font-medium uppercase tracking-wider">Files Selected</p>
                </div>
              </div>
              <button 
                onClick={() => setDrawerOpen(true)}
                className="flex-1 card p-3 flex items-center gap-3 text-left hover:bg-surface2 transition-colors"
              >
                <div className="size-8 rounded-lg bg-accent/15 grid place-items-center text-accent">
                  <Settings2 className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-ink">Manage</p>
                  <p className="text-[10px] text-ink3 font-medium uppercase tracking-wider">Selection</p>
                </div>
              </button>
            </div>

            {/* Preview Area */}
            <div className="relative card overflow-hidden min-h-[300px]">
              <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2 bg-surface2/80 backdrop-blur border-b border-hairline flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink3">Preview</span>
                <span className="text-[11px] font-mono text-accent">{format.toUpperCase()}</span>
              </div>
              <div className="p-4 pt-12 max-h-[60vh] overflow-y-auto no-scrollbar font-mono text-[12px] leading-relaxed whitespace-pre bg-[#0a0d14] text-emerald-400/90">
                {output || 'No files selected to display.'}
              </div>
              
              {/* Reset Button */}
              <button 
                onClick={() => setFiles([])}
                className="absolute bottom-4 right-4 tap size-10 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 grid place-items-center"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Toggle for Drawer (only if files loaded) */}
      {files.length > 0 && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-accent px-5 py-3.5 text-white shadow-2xl shadow-accent/40 font-bold text-[14px] tap"
        >
          <ChevronUp className="size-4" /> File Selection
        </motion.button>
      )}

      {/* Bottom Panel (File Selection) */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[70] max-h-[85vh] bg-surface rounded-t-[32px] border-t border-hairline shadow-2xl flex flex-col"
            >
              <div className="shrink-0 px-6 py-5 border-b border-hairline flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-black text-ink">Manage Files</h2>
                  <p className="text-[12px] text-ink3">{files.length} total files detected</p>
                </div>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  className="size-10 rounded-full bg-surface2 grid place-items-center text-ink"
                >
                  <Check className="size-5" />
                </button>
              </div>

              <div className="shrink-0 px-6 py-3 bg-surface2 flex gap-3">
                <button onClick={() => toggleAll(true)} className="text-[12px] font-bold text-accent">Select All</button>
                <button onClick={() => toggleAll(false)} className="text-[12px] font-bold text-ink3">Deselect All</button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-4 space-y-1">
                {files.map(file => (
                  <button
                    key={file.name}
                    onClick={() => toggleFile(file.name)}
                    className={cn(
                      "w-full flex items-center justify-between gap-4 p-4 rounded-[20px] transition-all",
                      file.selected ? "bg-accent/10 border border-accent/20" : "hover:bg-surface2 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "size-10 rounded-xl grid place-items-center",
                        file.selected ? "bg-accent text-white" : "bg-surface3 text-ink3"
                      )}>
                        <FileCode className="size-5" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className={cn("text-[14px] font-bold truncate", file.selected ? "text-ink" : "text-ink2")}>
                          {file.name}
                        </p>
                        <p className="text-[11px] text-ink3">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <div className={cn(
                      "size-6 rounded-full border-2 grid place-items-center transition-all",
                      file.selected ? "bg-accent border-accent text-white" : "border-hairline"
                    )}>
                      {file.selected && <Check className="size-3.5" strokeWidth={4} />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="shrink-0 p-6 pt-2 pb-8">
                <CustomButton 
                  fullWidth 
                  size="lg" 
                  onClick={() => setDrawerOpen(false)}
                >
                  Done
                </CustomButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ScreenShell>
  );
}
