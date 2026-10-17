import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, RotateCcw, ShieldCheck, Wifi } from 'lucide-react';
import { ConfirmDialog } from '../../../components/Modal';
import type { ExamTrackerSettings } from '../../../types';
import { GEMINI_MODEL } from '../examModel';
import { testGeminiConnection } from '../geminiService';
import { ErrorReport } from '../components/ErrorReport';

interface Props {
  settings: ExamTrackerSettings;
  onUpdateApiKey: (key: string) => void;
  onReset: () => void;
}

export function ExamSettingsPage({ settings, onUpdateApiKey, onReset }: Props) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testError, setTestError] = useState<string[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);

  const runConnectionTest = async () => {
    if (!settings.geminiApiKey.trim()) {
      setTestError(['Enter a Gemini API key before testing the connection.']);
      setTestMessage('');
      return;
    }
    setIsTesting(true);
    setTestError([]);
    setTestMessage('');
    try {
      await testGeminiConnection(settings.geminiApiKey);
      setTestMessage('Connection successful. Gemini returned a valid JSON response.');
    } catch (error) {
      setTestError([error instanceof Error ? error.message : 'The Gemini connection test failed unexpectedly.']);
    } finally {
      setIsTesting(false);
    }
  };

  const resetTracker = () => {
    onReset();
    setConfirmReset(false);
    setTestError([]);
    setTestMessage('Exam Tracker subjects, progress, and API key were reset.');
  };

  return (
    <main className="space-y-5 px-4 pb-8">
      <section className="rounded-[26px] border border-amber-300/15 bg-gradient-to-br from-amber-500/10 via-slate-900/95 to-slate-950 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-amber-200"><KeyRound size={21} /></div>
          <div>
            <h2 className="text-lg font-black text-white">Gemini API configuration</h2>
            <p className="mt-1 text-sm leading-5 text-slate-400">Add your key to generate and validate subject plans from this browser.</p>
          </div>
        </div>
      </section>

      {testMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-300/15 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-100" role="status" aria-live="polite">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" /> <span>{testMessage}</span>
        </div>
      )}
      <ErrorReport title="Gemini connection problem" errors={testError} context="Gemini API connection" />

      <section className="space-y-4 rounded-[24px] border border-white/[0.08] bg-slate-900/75 p-4">
        <div>
          <label htmlFor="gemini-api-key" className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-slate-300">Gemini API key</label>
          <div className="relative">
            <input
              id="gemini-api-key"
              type={showApiKey ? 'text' : 'password'}
              name="geminiApiKey"
              value={settings.geminiApiKey}
              onChange={(event) => { onUpdateApiKey(event.target.value); setTestMessage(''); setTestError([]); }}
              maxLength={300}
              autoComplete="new-password"
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Paste your Gemini API key"
              className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 pr-12 font-mono text-sm text-white outline-none placeholder:font-sans placeholder:text-slate-600 focus:border-amber-300/45 focus:ring-2 focus:ring-amber-300/10"
            />
            <button
              type="button"
              onClick={() => setShowApiKey((visible) => !visible)}
              aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              {showApiKey ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Saved automatically on this device. It is excluded from Exam Tracker backups.</p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-slate-950/60 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Model</p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-200">{GEMINI_MODEL}</p>
            </div>
            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">Fixed</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">The model is set by Exam Tracker and cannot be changed here.</p>
        </div>

        <button
          type="button"
          disabled={isTesting || !settings.geminiApiKey.trim()}
          onClick={() => void runConnectionTest()}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/[0.09] px-4 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isTesting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-100/30 border-t-cyan-100" /> : <Wifi size={16} />}
          {isTesting ? 'Testing connection…' : 'Test Gemini connection'}
        </button>
      </section>

      <section className="rounded-2xl border border-cyan-300/10 bg-cyan-950/20 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={19} className="mt-0.5 shrink-0 text-cyan-200" />
          <div>
            <h3 className="text-sm font-bold text-cyan-50">How your key is used</h3>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-400">
              <li>Your browser sends the key directly to Google’s Gemini API when you generate a plan or test the connection.</li>
              <li>Exam Tracker does not send the key to an app server. The key is stored in this browser’s IndexedDB and is not encrypted by this app.</li>
              <li>Backup exports omit the key, and imports never restore it. Re-enter it after restoring your data.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-300/10 bg-rose-950/15 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">Reset Exam Tracker</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Permanently clear this app’s subjects, completion history, and saved API key.</p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-rose-300/15 bg-rose-400/[0.07] px-2.5 text-xs font-bold text-rose-200 transition hover:bg-rose-400/[0.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Reset Exam Tracker?"
        description="This removes all Exam Tracker subjects, category completion history, and the saved Gemini API key from this device. Other apps and their data are not affected."
        confirmLabel="Reset Exam Tracker"
        cancelLabel="Keep my data"
        tone="danger"
        onConfirm={resetTracker}
        onCancel={() => setConfirmReset(false)}
      />
    </main>
  );
}
