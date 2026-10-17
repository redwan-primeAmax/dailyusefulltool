import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpenCheck, CalendarDays, GraduationCap, House, Settings2, X } from 'lucide-react';
import type { ExamPage } from '../examModel';

interface Props {
  open: boolean;
  currentPage: ExamPage;
  onNavigate: (page: ExamPage) => void;
  onClose: () => void;
}

const ITEMS: Array<{ page: ExamPage; label: string; detail: string; icon: typeof House }> = [
  { page: 'home', label: 'Home', detail: 'Progress overview', icon: House },
  { page: 'today', label: "Today's Plan", detail: 'Scheduled subjects', icon: CalendarDays },
  { page: 'addSubject', label: 'Add Subject', detail: 'Build a subject plan', icon: BookOpenCheck },
  { page: 'settings', label: 'Settings', detail: 'Gemini API configuration', icon: Settings2 },
];

export function ExamNavigationDrawer({ open, currentPage, onNavigate, onClose }: Props) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end" role="presentation">
          <motion.button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            id="exam-tracker-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Exam Tracker navigation"
            className="relative flex h-full w-[min(88vw,370px)] flex-col border-l border-white/10 bg-[#081311] px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] shadow-2xl shadow-black/50"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 29, stiffness: 280 }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                  <GraduationCap size={23} />
                </div>
                <div>
                  <p className="text-sm font-black tracking-wide text-white">Exam Tracker</p>
                  <p className="mt-0.5 text-xs text-slate-500">Plan with purpose.</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <X size={19} />
              </button>
            </div>

            <nav className="mt-6 space-y-2" aria-label="Main navigation">
              {ITEMS.map(({ page, label, detail, icon: Icon }) => {
                const selected = currentPage === page;
                return (
                  <button
                    key={page}
                    type="button"
                    aria-current={selected ? 'page' : undefined}
                    onClick={() => onNavigate(page)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${selected
                      ? 'border-emerald-300/25 bg-emerald-400/10 text-white'
                      : 'border-transparent text-slate-300 hover:border-white/[0.07] hover:bg-white/[0.04]'
                      }`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${selected ? 'bg-emerald-300/15 text-emerald-200' : 'bg-white/[0.04] text-slate-400'}`}>
                      <Icon size={19} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{detail}</span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs font-bold text-slate-300">A steady plan beats a last-minute sprint.</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">Check off one focused section at a time and watch your readiness grow.</p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
