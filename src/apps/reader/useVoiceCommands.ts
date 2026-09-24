import { useCallback, useEffect, useRef, useState } from 'react';
import {
  detectCommand, getSpeechRecognition,
  type SpeechRecognitionEventLike, type SpeechRecognitionLike, type VoiceCommand,
} from './speech';

export type MicStatus = 'idle' | 'requesting' | 'listening' | 'denied' | 'unsupported' | 'error';

export interface UseVoiceCommandsOptions {
  onCommand: (command: VoiceCommand) => void;
  /** Minimum similarity required to fire a command. */
  threshold?: number;
}

/**
 * Continuous speech recognition tuned for short navigation commands.
 * Auto-restarts on `onend` (browsers stop the stream every few seconds)
 * and de-duplicates rapid repeats of the same command.
 */
export function useVoiceCommands({ onCommand, threshold = 0.62 }: UseVoiceCommandsOptions) {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [lastHeard, setLastHeard] = useState('');
  const [lastConfidence, setLastConfidence] = useState(0);

  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const shouldRun = useRef(false);
  const lastFired = useRef(0);
  const handler = useRef(onCommand);

  useEffect(() => { handler.current = onCommand; }, [onCommand]);

  const stop = useCallback(() => {
    shouldRun.current = false;
    try { recognition.current?.stop(); } catch { /* already stopped */ }
    recognition.current = null;
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) { setStatus('unsupported'); return; }

    setStatus('requesting');
    // Explicitly request mic permission so the prompt is predictable.
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      setStatus('denied');
      return;
    }

    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 4;

    rec.onstart = () => setStatus('listening');

    rec.onresult = (event: SpeechRecognitionEventLike) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        // Test every alternative — accents often land on a later one.
        for (let a = 0; a < result.length; a++) {
          const transcript = result[a].transcript;
          const match = detectCommand(transcript, threshold);
          if (a === 0) {
            setLastHeard(transcript.trim());
            setLastConfidence(match.confidence);
          }
          if (match.command) {
            const now = Date.now();
            if (now - lastFired.current < 550) return; // debounce echoes
            lastFired.current = now;
            handler.current(match.command);
            return;
          }
        }
      }
    };

    rec.onerror = (event) => {
      const code = (event as { error?: string }).error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        shouldRun.current = false;
        setStatus('denied');
      } else if (code === 'no-speech' || code === 'aborted') {
        /* transient — onend will restart */
      } else {
        setStatus('error');
      }
    };

    rec.onend = () => {
      if (!shouldRun.current) { setStatus('idle'); return; }
      // Chrome ends the stream every ~10s; restart to stay continuous.
      try { rec.start(); } catch { setStatus('idle'); }
    };

    recognition.current = rec;
    shouldRun.current = true;
    try {
      rec.start();
    } catch {
      setStatus('error');
    }
  }, [threshold]);

  useEffect(() => () => {
    shouldRun.current = false;
    try { recognition.current?.abort(); } catch { /* noop */ }
  }, []);

  return { status, start, stop, lastHeard, lastConfidence, listening: status === 'listening' };
}
