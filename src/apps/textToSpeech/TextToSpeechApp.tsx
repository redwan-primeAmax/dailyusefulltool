import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Check, Pause, Play, RotateCcw, Square, Volume2 } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';
import { cn } from '../../utils/cn';
import {
  createOnlineSpeechUrl,
  splitTextForSpeech,
  type SpeechChunk,
  type SpeechLanguageMode,
} from './textToSpeechModel';

type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';

const LANGUAGE_CHOICES: { id: SpeechLanguageMode; label: string }[] = [
  { id: 'auto', label: 'Auto detect' },
  { id: 'bn', label: 'Bengali' },
  { id: 'en', label: 'English' },
];

function getStatusLabel(status: PlaybackStatus, current: number, total: number, browserFallback: boolean): string {
  if (status === 'loading') return 'Connecting to the online voice…';
  if (status === 'playing') return `${browserFallback ? 'Browser voice' : 'Online voice'} · Part ${current} of ${total}`;
  if (status === 'paused') return 'Paused';
  if (status === 'completed') return 'Finished reading';
  if (status === 'error') return 'Playback could not start';
  return 'Ready to read';
}

export function TextToSpeechApp() {
  const { notify } = useOS();
  const [text, setText] = useState('');
  const [languageMode, setLanguageMode] = useState<SpeechLanguageMode>('auto');
  const [screen, setScreen] = useState<'editor' | 'player'>('editor');
  const [playerText, setPlayerText] = useState('');
  const [segments, setSegments] = useState<SpeechChunk[]>([]);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [usingBrowserVoice, setUsingBrowserVoice] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const segmentsRef = useRef<SpeechChunk[]>([]);
  const currentSegmentRef = useRef(0);
  const browserFallbackRef = useRef(false);

  const characterCount = Array.from(text).length;
  const preview = useMemo(() => playerText.replace(/\s+/gu, ' ').trim(), [playerText]);
  const progressPercent = segments.length > 0
    ? status === 'completed' ? 100 : Math.round((currentSegment / segments.length) * 100)
    : 0;

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  const startBrowserFallback = useCallback((fromSegment: number) => {
    if (browserFallbackRef.current) return;
    const synthesis = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    if (!synthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      setStatus('error');
      setErrorMessage('The free online voice is unavailable, and this browser has no built-in speech voice. Check your connection and try again.');
      return;
    }

    browserFallbackRef.current = true;
    setUsingBrowserVoice(true);
    synthesis.cancel();
    if (audioRef.current) audioRef.current.pause();
    setErrorMessage('The online voice could not be reached. Trying a voice installed in this browser; Bengali voice availability varies by device.');
    notify({
      title: 'Switching to a browser voice',
      description: 'The free online voice did not respond. Your browser may use a voice installed on this device.',
      tone: 'warning',
    });

    const remaining = segmentsRef.current.slice(fromSegment);
    if (remaining.length === 0) {
      setStatus('completed');
      return;
    }

    remaining.forEach((segment, offset) => {
      const utterance = new SpeechSynthesisUtterance(segment.text);
      const languagePrefix = segment.language === 'bn' ? 'bn' : 'en';
      utterance.lang = segment.language === 'bn' ? 'bn-BD' : 'en-US';
      const matchingVoice = synthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix));
      if (matchingVoice) utterance.voice = matchingVoice;
      utterance.onstart = () => {
        currentSegmentRef.current = fromSegment + offset;
        setCurrentSegment(fromSegment + offset);
        setStatus('playing');
      };
      utterance.onend = () => {
        if (offset === remaining.length - 1) setStatus('completed');
        else setCurrentSegment(fromSegment + offset + 1);
      };
      utterance.onerror = () => {
        setStatus('error');
        setErrorMessage('The browser voice stopped unexpectedly. Try Play again or check the device speech settings.');
      };
      synthesis.speak(utterance);
    });
    setStatus('playing');
  }, [notify]);

  const playOnlineSegment = useCallback((index: number) => {
    const segment = segmentsRef.current[index];
    const audio = audioRef.current;
    if (!segment || !audio) return;

    browserFallbackRef.current = false;
    setUsingBrowserVoice(false);
    currentSegmentRef.current = index;
    setCurrentSegment(index);
    setStatus('loading');
    setErrorMessage('');
    audio.src = createOnlineSpeechUrl(segment);
    audio.load();
    void audio.play().then(() => {
      if (!browserFallbackRef.current) setStatus('playing');
    }).catch(() => startBrowserFallback(index));
  }, [startBrowserFallback]);

  const handleAudioEnded = () => {
    if (browserFallbackRef.current) return;
    const nextSegment = currentSegmentRef.current + 1;
    if (nextSegment >= segmentsRef.current.length) {
      setStatus('completed');
      return;
    }
    currentSegmentRef.current = nextSegment;
    playOnlineSegment(nextSegment);
  };

  const handleAudioError = () => {
    if (!browserFallbackRef.current && status !== 'idle' && status !== 'paused') {
      startBrowserFallback(currentSegmentRef.current);
    }
  };

  const startPlayback = () => {
    if (segmentsRef.current.length === 0) return;
    browserFallbackRef.current = false;
    window.speechSynthesis?.cancel();
    currentSegmentRef.current = 0;
    setCurrentSegment(0);
    playOnlineSegment(0);
  };

  const pausePlayback = () => {
    if (browserFallbackRef.current) window.speechSynthesis?.pause();
    else audioRef.current?.pause();
    setStatus('paused');
  };

  const resumePlayback = () => {
    if (browserFallbackRef.current) {
      window.speechSynthesis?.resume();
      setStatus('playing');
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    void audio.play().then(() => setStatus('playing')).catch(() => startBrowserFallback(currentSegmentRef.current));
  };

  const stopPlayback = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    window.speechSynthesis?.cancel();
    browserFallbackRef.current = false;
    currentSegmentRef.current = 0;
    setCurrentSegment(0);
    setUsingBrowserVoice(false);
    setStatus('idle');
    setErrorMessage('');
  };

  useEffect(() => () => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);

  const openPlayer = () => {
    const cleanText = text.trim();
    const nextSegments = splitTextForSpeech(cleanText, languageMode);
    if (!cleanText || nextSegments.length === 0) {
      notify({ title: 'Add some text first', description: 'Paste or type Bengali or English text, then press Done.', tone: 'warning' });
      return;
    }
    setPlayerText(cleanText);
    setSegments(nextSegments);
    segmentsRef.current = nextSegments;
    setCurrentSegment(0);
    currentSegmentRef.current = 0;
    setStatus('idle');
    setUsingBrowserVoice(false);
    setErrorMessage('');
    setScreen('player');
  };

  const editText = () => {
    stopPlayback();
    setText(playerText);
    setScreen('editor');
  };

  const isPlaying = status === 'playing' || status === 'loading';

  return (
    <ScreenShell
      title="Text to Speech"
      subtitle={screen === 'editor' ? 'Paste text and listen in the player' : 'Your personal read-aloud player'}
      icon={<Volume2 className="size-[19px]" />}
      contentClassName="!px-0 !pt-4 !pb-24"
    >
      <div className="space-y-4 px-4">
        {screen === 'editor' ? (
          <>
            <section className="relative overflow-hidden rounded-[26px] border border-violet-300/15 bg-gradient-to-br from-violet-500/15 via-slate-900/95 to-slate-950 p-5">
              <div className="pointer-events-none absolute -right-12 -top-14 size-40 rounded-full bg-violet-400/10 blur-3xl" />
              <div className="relative flex items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
                  <BookOpen size={21} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.17em] text-violet-200/70">Read aloud</p>
                  <h2 className="mt-1 text-xl font-black text-white">Listen to your text.</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-400">Paste Bengali or English text, press Done, then use the player controls.</p>
                </div>
              </div>
              <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.07] pt-3 text-xs text-slate-400">
                <span>Mixed Bengali and English detection</span>
                <span>No account or API key</span>
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-slate-900/75 shadow-lg shadow-black/10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-violet-300" />
                  <h2 className="text-sm font-bold text-white">Your text</h2>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] tabular-nums text-slate-400">{characterCount.toLocaleString('en-US')} characters</span>
                </div>
                {text.trim() && (
                  <button type="button" onClick={() => setText('')} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200">
                    Clear
                  </button>
                )}
              </div>
              <textarea
                name="text-to-speech-input"
                autoComplete="off"
                autoCorrect="off"
                spellCheck
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Paste or type Bengali or English text here…"
                aria-label="Text to read aloud"
                className="min-h-[230px] w-full resize-y bg-transparent px-4 py-4 text-[15px] leading-7 text-slate-100 outline-none placeholder:text-slate-600"
              />
              <div className="border-t border-white/[0.07] px-4 py-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Text language</p>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGE_CHOICES.map((choice) => {
                    const active = languageMode === choice.id;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setLanguageMode(choice.id)}
                        className={cn(
                          'rounded-xl border px-2 py-2 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300',
                          active ? 'border-violet-300/30 bg-violet-400/10 text-violet-100' : 'border-white/[0.08] bg-slate-950/30 text-slate-400 hover:border-white/15',
                        )}
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={openPlayer}
              disabled={!text.trim()}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 text-sm font-extrabold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check size={17} /> Done · Open player
            </button>

            <section className="rounded-2xl border border-amber-300/15 bg-amber-400/[0.05] p-3.5" aria-label="Online speech privacy note">
              <p className="text-[11px] leading-5 text-slate-400">
                The free online voice sends text chunks to Google Translate when you press Play. It uses a public, unofficial endpoint that may be limited or change. If it is unavailable, the app tries a voice installed in your browser.
              </p>
            </section>
          </>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-[26px] border border-violet-300/15 bg-gradient-to-br from-violet-500/15 via-slate-900/95 to-slate-950 p-5">
              <div className="pointer-events-none absolute -right-12 -top-14 size-40 rounded-full bg-violet-400/10 blur-3xl" />
              <div className="relative flex items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
                  <Volume2 size={21} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.17em] text-violet-200/70">Now reading</p>
                  <h2 className="mt-1 text-xl font-black text-white">Your audio player</h2>
                  <p className="mt-2 line-clamp-4 break-words text-sm leading-6 text-slate-400">{preview}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/[0.08] bg-slate-900/75 p-4 shadow-lg shadow-black/10">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-200" aria-live="polite">
                    {getStatusLabel(status, Math.min(currentSegment + 1, segments.length), segments.length, usingBrowserVoice)}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {segments.length.toLocaleString('en-US')} short audio parts · {characterCount.toLocaleString('en-US')} characters
                  </p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-violet-200">
                  <motion.span animate={isPlaying ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={{ duration: 0.9, repeat: isPlaying ? Infinity : 0 }}>
                    <Volume2 size={18} />
                  </motion.span>
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label="Speech playback progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-400" animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.2 }} />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                <span>{segments.length ? `${Math.min(currentSegment + 1, segments.length)} / ${segments.length}` : '0 / 0'}</span>
                <span>{progressPercent}%</span>
              </div>

              {errorMessage && (
                <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-400/[0.05] px-3 py-2 text-[11px] leading-5 text-amber-100/80" role="status">
                  {errorMessage}
                </p>
              )}

              <div className="mt-5 grid grid-cols-[1fr_auto_auto] gap-2">
                {status === 'playing' || status === 'loading' ? (
                  <button type="button" onClick={pausePlayback} disabled={status === 'loading'} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-extrabold text-white transition hover:bg-violet-400 disabled:opacity-50">
                    <Pause size={17} /> Pause
                  </button>
                ) : status === 'paused' ? (
                  <button type="button" onClick={resumePlayback} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-extrabold text-white transition hover:bg-violet-400">
                    <Play size={17} /> Resume
                  </button>
                ) : (
                  <button type="button" onClick={startPlayback} disabled={segments.length === 0} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-extrabold text-white transition hover:bg-violet-400 disabled:opacity-50">
                    {status === 'completed' ? <RotateCcw size={17} /> : <Play size={17} />}
                    {status === 'completed' ? 'Replay' : status === 'error' ? 'Try again' : 'Play'}
                  </button>
                )}
                <button type="button" onClick={stopPlayback} aria-label="Stop reading" className="grid size-12 place-items-center rounded-xl border border-white/[0.09] bg-slate-950/40 text-slate-300 transition hover:border-rose-300/25 hover:text-rose-200">
                  <Square size={16} />
                </button>
                <button type="button" onClick={editText} aria-label="Edit text" className="grid size-12 place-items-center rounded-xl border border-white/[0.09] bg-slate-950/40 text-slate-300 transition hover:border-violet-300/25 hover:text-violet-200">
                  <ArrowLeft size={17} />
                </button>
              </div>
            </section>

            <p className="text-center text-[10px] leading-5 text-slate-500">Free online audio requires an internet connection. If the online voice is unavailable, the browser voice is used when supported.</p>
            <audio ref={audioRef} preload="none" onEnded={handleAudioEnded} onError={handleAudioError} className="hidden" aria-hidden="true" />
          </>
        )}
      </div>
    </ScreenShell>
  );
}
