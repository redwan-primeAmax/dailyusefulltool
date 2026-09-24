import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import type { ToastMessage } from '../../types';

const ICONS = {
  success: <CheckCircle2 className="size-[18px] text-emerald-400" />,
  info: <Info className="size-[18px] text-sky-400" />,
  warning: <TriangleAlert className="size-[18px] text-amber-400" />,
  danger: <XCircle className="size-[18px] text-red-400" />,
};

/** Android snackbar stack rendered just above the system nav bar. */
export function ToastStack() {
  const { toasts, dismissToast } = useOS();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[70px] z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence initial={false}>
        {toasts.map((toast: ToastMessage) => (
          <motion.button
            key={toast.id}
            type="button"
            layout
            onClick={() => dismissToast(toast.id)}
            initial={{ opacity: 0, y: 26, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="glass pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-hairline px-4 py-3 text-left shadow-2xl"
          >
            {ICONS[toast.tone]}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-ink">{toast.title}</span>
              {toast.description && (
                <span className="block truncate text-[11.5px] text-ink2">{toast.description}</span>
              )}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
