import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { CustomButton, IconButton } from './CustomButton';

type ModalTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  tone?: ModalTone;
  children?: ReactNode;
  footer?: ReactNode;
  /** Bottom-sheet presentation (mobile native) instead of centered dialog. */
  sheet?: boolean;
  dismissible?: boolean;
  className?: string;
}

const TONE_ICON: Record<ModalTone, ReactNode> = {
  default: null,
  success: <CheckCircle2 className="size-6 text-emerald-400" />,
  warning: <AlertTriangle className="size-6 text-amber-400" />,
  danger: <XCircle className="size-6 text-red-400" />,
  info: <Info className="size-6 text-sky-400" />,
};

/**
 * Modal overlay rendered in a document-level portal so app transforms and the
 * system nav bar can never trap it underneath. The z-index intentionally sits
 * far above the nav bar (`z-40`) and app sheets.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  tone = 'default',
  children,
  footer,
  sheet = false,
  dismissible = true,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Dismiss dialog"
            onClick={() => dismissible && onClose()}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={sheet ? { y: '100%' } : { opacity: 0, scale: 0.94, y: 24 }}
            animate={sheet ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={sheet ? { y: '100%' } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            drag={sheet ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 && dismissible) onClose();
            }}
            className={cn(
              'relative z-10 w-full max-w-md overflow-hidden card',
              sheet ? 'rounded-t-[28px] pb-6' : 'rounded-[28px]',
              className,
            )}
          >
            {sheet && <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-white/20" />}
            <div className="flex items-start gap-3 px-6 pt-5">
              <div className="min-w-0 flex-1">
                {title && <h2 className="text-[19px] font-semibold tracking-tight text-ink">{title}</h2>}
                {description && <p className="mt-1 text-[13px] leading-relaxed text-ink2">{description}</p>}
              </div>
              {TONE_ICON[tone]}
              {dismissible && (
                <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
                  <X className="size-5" />
                </IconButton>
              )}
            </div>
            {children && <div className="px-6 py-5 text-sm text-ink2">{children}</div>}
            {footer && <div className="flex gap-3 px-6 pt-1">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return overlay;
  return createPortal(overlay, document.body);
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Extract<ModalTone, 'default' | 'danger' | 'warning'>;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} description={description} tone={tone}>
      <div className="flex justify-end gap-3">
        <CustomButton variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </CustomButton>
        <CustomButton
          variant={tone === 'danger' ? 'danger' : 'primary'}
          loading={busy}
          onClick={onConfirm}
        >
          {confirmLabel}
        </CustomButton>
      </div>
    </Modal>
  );
}
