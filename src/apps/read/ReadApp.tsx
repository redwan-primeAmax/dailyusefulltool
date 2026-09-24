import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronLeft, Clock } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';
import { useSettings } from '../../hooks/useTracker';
import { readAll } from '../../db/indexedDB';
import {
  DEFAULT_READ, DEFAULT_READINGS, SETTINGS_KEYS, STORE_READINGS,
  type ReadSettings, type Reading,
} from '../../db/trackerService';

const THEMES = {
  dark: { bg: 'bg-surface', ink: 'text-ink', sub: 'text-ink3' },
  sepia: { bg: 'bg-[#f3e9d2]', ink: 'text-[#3f2f1c]', sub: 'text-[#8a6f4d]' },
  paper: { bg: 'bg-[#fbfaf6]', ink: 'text-[#26251f]', sub: 'text-[#7a786c]' },
};

export function ReadApp() {
  const { openScreen } = useOS();
  const { settings } = useSettings<ReadSettings>(SETTINGS_KEYS.read, DEFAULT_READ);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await readAll<Reading>(STORE_READINGS);
      const custom = stored.filter((r) => !r.builtin);
      const builtins: Reading[] = DEFAULT_READINGS.map((d, i) => ({ ...d, id: `b${i}`, ts: i, dateKey: '' }));
      setReadings([...custom.sort((a, b) => b.ts - a.ts), ...builtins]);
    })();
  }, []);

  const open = readings.find((r) => r.id === openId) ?? null;
  const words = useMemo(() => (open ? open.body.split(/\s+/).length : 0), [open]);
  const theme = THEMES[settings.theme];

  if (open) {
    return (
      <div className={`flex h-full min-h-0 flex-col ${theme.bg}`}>
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 backdrop-blur">
          <button type="button" onClick={() => setOpenId(null)}
            className="tap grid size-10 place-items-center rounded-full bg-black/5 text-current">
            <ChevronLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-[15px] font-bold ${theme.ink}`}>{open.title}</p>
            <p className={`truncate text-[11px] ${theme.sub}`}>{open.author}</p>
          </div>
          <span className={`flex items-center gap-1 text-[11px] font-semibold ${theme.sub}`}>
            <Clock className="size-3.5" /> {Math.max(1, Math.round(words / 200))} min
          </span>
        </header>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-16 pt-2">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`whitespace-pre-line font-serif ${theme.ink}`}
            style={{ fontSize: settings.fontSize, lineHeight: settings.lineHeight }}>
            {open.body}
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <ScreenShell
      title="Read"
      subtitle={`${readings.length} readings · library`}
      icon={<BookOpen className="size-[19px]" />}
      onOpenSettings={() => openScreen('read', 'settings')}
      contentClassName="space-y-3"
    >
      {readings.map((r, i) => (
        <motion.button key={r.id} type="button"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.3) }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpenId(r.id)}
          className="card block w-full p-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-ink">{r.title}</p>
              <p className="mt-0.5 text-[11.5px] text-ink3">{r.author}</p>
            </div>
            {!r.builtin && (
              <span className="shrink-0 rounded-full bg-accentsoft px-2 py-0.5 text-[10px] font-bold text-accent">Mine</span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink2">{r.body}</p>
          <p className="mt-2 text-[10.5px] font-semibold text-ink3">
            {r.body.split(/\s+/).length} words · ~{Math.max(1, Math.round(r.body.split(/\s+/).length / 200))} min read
          </p>
        </motion.button>
      ))}
      <AnimatePresence>{readings.length === 0 && (
        <p className="py-10 text-center text-[13px] text-ink3">Your library is empty.</p>
      )}</AnimatePresence>
    </ScreenShell>
  );
}
