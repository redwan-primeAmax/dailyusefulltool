import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpenCheck, Pause, Play, Sparkles, Square, Timer, X } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { CustomButton } from '../../components/CustomButton';
import { Toggle, Stepper } from '../../components/ui/controls';
import { useOS } from '../../context/OSContext';
import { useReaderSession } from '../../context/ReaderSessionContext';
import { useVoiceCommands } from './useVoiceCommands';
import { ReaderStage } from './components/ReaderStage';
import { estimateMinutes, toWords } from './chunking';
import { formatDuration } from '../../utils/format';
import { cn } from '../../utils/cn';

const SAMPLE = `Reading in small chunks trains your eyes to move in deliberate jumps instead of drifting across the line. Paste any passage here, choose your mode, and move forward three words at a time.`;

export function ReaderApp() {
  const { openScreen, notify } = useOS();
  const session = useReaderSession();
  const [text, setText] = useState('');
  const [usePomodoro, setUsePomodoro] = useState(false);
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const voice = useVoiceCommands({
    onCommand: (command) => {
      if (command === 'next') session.next();
      else if (command === 'previous') session.previous();
      else if (command === 'restart') session.restart();
      else if (command === 'pause' && session.mode === 'pomodoro') session.togglePomo();
    },
  });

  const toggleVoice = useCallback(() => {
    if (voiceEnabled) {
      voice.stop();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
      void voice.start();
    }
  }, [voiceEnabled, voice]);

  const wordCount = useMemo(() => toWords(text).length, [text]);

  const start = () => {
    if (wordCount === 0) {
      notify({ title: 'Paste some text first', tone: 'warning' });
      return;
    }
    session.startSession(text, usePomodoro ? 'pomodoro' : 'plain', { focusMin, breakMin });
    notify({
      title: usePomodoro ? 'Focus session started' : 'Reader started',
      description: `${wordCount} words · ${Math.ceil(wordCount / 3)} steps`,
      tone: 'success',
    });
  };

  /* ── Active session view ─────────────────────────── */
  if (session.active) {
    const isPomo = session.mode === 'pomodoro';
    const accent = isPomo
      ? (session.pomoPhase === 'focus' ? '#ef4444' : '#22c55e')
      : '#0ea5e9';

    return (
      <ScreenShell
        title={isPomo ? 'Reader · Pomodoro' : 'Reader'}
        subtitle={isPomo
          ? `${session.pomoPhase === 'focus' ? 'Focus' : 'Break'} · ${session.cyclesDone} cycle${session.cyclesDone === 1 ? '' : 's'}`
          : `${session.progress.percent}% complete`}
        icon={<BookOpenCheck className="size-[19px]" />}
        onOpenSettings={() => openScreen('reader', 'settings')}
        contentClassName="!space-y-5"
        headerActions={
          <button
            type="button"
            onClick={() => { voice.stop(); setVoiceEnabled(false); session.endSession(); }}
            aria-label="End session"
            className="tap grid size-9 place-items-center rounded-full bg-red-500/15 text-red-400"
          >
            <X className="size-4" />
          </button>
        }
      >
        {/* Pomodoro timer sits above the text stream */}
        {isPomo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[26px] border border-hairline p-5"
            style={{ background: `${accent}14` }}
          >
            <motion.div
              className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full blur-3xl"
              style={{ background: `${accent}33` }}
              animate={{ opacity: [0.4, 0.75, 0.4] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>
                  {session.pomoPhase === 'focus' ? 'Focus block' : 'Break'}
                </p>
                <p className="mt-0.5 text-[44px] font-light leading-none tabular-nums text-ink">
                  {formatDuration(session.pomoRemaining)}
                </p>
              </div>
              <button
                type="button"
                onClick={session.togglePomo}
                aria-label={session.pomoRunning ? 'Pause timer' : 'Resume timer'}
                className="grid size-14 place-items-center rounded-full text-white shadow-lg"
                style={{ background: accent }}
              >
                {session.pomoRunning ? <Pause className="size-6" /> : <Play className="size-6 ml-0.5" />}
              </button>
            </div>
          </motion.div>
        )}

        <ReaderStage
          chunk={session.currentChunk}
          index={session.index}
          total={session.progress.total}
          percent={session.progress.percent}
          wordsRead={session.progress.wordsRead}
          totalWords={session.progress.totalWords}
          finished={session.finished}
          onNext={session.next}
          onPrevious={session.previous}
          onRestart={session.restart}
          voiceEnabled={voiceEnabled}
          micStatus={voice.status}
          lastHeard={voice.lastHeard}
          onToggleVoice={toggleVoice}
          accent={accent}
        />

        <p className="text-center text-[11px] text-ink3">
          Session keeps running in the background — a badge appears in the nav bar.
        </p>
      </ScreenShell>
    );
  }

  /* ── Setup view ──────────────────────────────────── */
  return (
    <ScreenShell
      title="Reader"
      subtitle="Chunked reading with optional Pomodoro"
      icon={<BookOpenCheck className="size-[19px]" />}
      onOpenSettings={() => openScreen('reader', 'settings')}
      contentClassName="!space-y-4"
    >
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <p className="text-[13px] font-bold text-ink">Your text</p>
          <span className="text-[11px] font-semibold text-ink3">
            {wordCount} words · ~{estimateMinutes(wordCount)} min
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          name="reader-source-text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck
          placeholder="Paste or type the text you want to read…"
          className="h-44 w-full resize-none bg-transparent px-4 py-3 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink3"
        />
        <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5">
          <button
            type="button"
            onClick={() => setText(SAMPLE)}
            className="flex items-center gap-1.5 text-[11.5px] font-bold text-accent"
          >
            <Sparkles className="size-3.5" /> Use sample
          </button>
          {text && (
            <button type="button" onClick={() => setText('')} className="text-[11.5px] font-semibold text-ink3">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mode selection */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-2xl',
            usePomodoro ? 'bg-red-500/15 text-red-400' : 'bg-surface3 text-ink3')}>
            <Timer className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold text-ink">Pomodoro mode</p>
            <p className="text-[11.5px] text-ink3">Run the reader inside a focus timer</p>
          </div>
          <Toggle label="Pomodoro mode" checked={usePomodoro} onChange={setUsePomodoro} />
        </div>

        {usePomodoro && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden border-t border-hairline"
          >
            <div className="grid grid-cols-2 gap-3 p-4">
              <div className="rounded-2xl bg-surface3/40 p-3">
                <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-ink3">Focus</p>
                <Stepper value={focusMin} step={5} min={5} max={90} suffix="m" onChange={setFocusMin} />
              </div>
              <div className="rounded-2xl bg-surface3/40 p-3">
                <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-ink3">Break</p>
                <Stepper value={breakMin} step={1} min={1} max={30} suffix="m" onChange={setBreakMin} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <CustomButton
        fullWidth
        size="lg"
        onClick={start}
        disabled={wordCount === 0}
        leadingIcon={<Play className="size-[18px]" />}
      >
        Start reading
      </CustomButton>

      <p className="text-center text-[11px] leading-relaxed text-ink3">
        Reads 3 words at a time. Enable voice navigation during the session to say “Next” hands-free.
      </p>
    </ScreenShell>
  );
}

export { Square };
