import { useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { copyTextToClipboard } from '../clipboard';

interface Props {
  title?: string;
  errors: string[];
  context?: string;
}

export function ErrorReport({ title = 'Please fix these issues', errors, context = 'Subject JSON validation' }: Props) {
  const [copyStatus, setCopyStatus] = useState('');
  if (errors.length === 0) return null;

  const copyReport = async () => {
    const report = [
      `Exam Tracker error report — ${context}`,
      `Created: ${new Date().toISOString()}`,
      '',
      ...errors.map((error, index) => `${index + 1}. ${error}`),
    ].join('\n');
    try {
      await copyTextToClipboard(report);
      setCopyStatus('Error report copied.');
    } catch {
      setCopyStatus('Could not copy the error report. Check clipboard permissions and try again.');
    }
  };

  return (
    <section className="rounded-2xl border border-rose-300/20 bg-rose-950/25 p-4" role="alert" aria-live="polite">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-300" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-rose-100">{title}</h3>
          <ul className="mt-2 space-y-1.5 text-xs leading-5 text-rose-100/80">
            {errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}
          </ul>
          <button
            type="button"
            onClick={() => void copyReport()}
            className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-rose-200/20 bg-rose-200/10 px-3 py-1.5 text-xs font-bold text-rose-100 transition hover:bg-rose-200/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
          >
            {copyStatus.startsWith('Error report copied') ? <Check size={14} /> : <Copy size={14} />}
            Copy error report
          </button>
          {copyStatus && <p className="mt-2 text-xs text-rose-200/80" aria-live="polite">{copyStatus}</p>}
        </div>
      </div>
    </section>
  );
}
