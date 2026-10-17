import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Copy, FileText, Sparkles, Trash2 } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';
import { analyzeText, createStatsReport, formatDuration } from './wordCounterModel';

const SAMPLE_TEXT = `বাংলা ও English text—দুটোই এখানে পরীক্ষা করা যাবে। Paste your writing, or type something new, and watch every statistic update instantly. একটি বাক্য। Another sentence!`;

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  tone?: 'emerald' | 'cyan' | 'violet' | 'amber' | 'blue';
  prominent?: boolean;
}

const TONE_STYLES: Record<NonNullable<StatCardProps['tone']>, string> = {
  emerald: 'border-emerald-300/15 bg-emerald-400/[0.07] text-emerald-200',
  cyan: 'border-cyan-300/15 bg-cyan-400/[0.07] text-cyan-200',
  violet: 'border-violet-300/15 bg-violet-400/[0.07] text-violet-200',
  amber: 'border-amber-300/15 bg-amber-400/[0.07] text-amber-200',
  blue: 'border-sky-300/15 bg-sky-400/[0.07] text-sky-200',
};

function StatCard({ label, value, description, tone = 'emerald', prominent = false }: StatCardProps) {
  return (
    <motion.article
      layout
      className={`min-w-0 rounded-2xl border p-3.5 ${TONE_STYLES[tone]} ${prominent ? 'min-h-[112px]' : 'min-h-[92px]'}`}
    >
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</p>
      <p className={`${prominent ? 'mt-2 text-3xl' : 'mt-2 text-2xl'} truncate font-black tabular-nums tracking-tight text-white`} title={String(value)}>
        {value}
      </p>
      {description && <p className="mt-1 truncate text-[10px] text-slate-500">{description}</p>}
    </motion.article>
  );
}

function formatPages(pages: number): string {
  return pages === 0 ? '0' : `~${pages.toFixed(1)}`;
}

export function WordCounterApp() {
  const { notify } = useOS();
  const [text, setText] = useState('');
  const [isPasting, setIsPasting] = useState(false);
  const stats = useMemo(() => analyzeText(text), [text]);
  const hasText = text.trim().length > 0;

  const pasteFromClipboard = async () => {
    if (!navigator.clipboard?.readText) {
      notify({
        title: 'Clipboard permission needed',
        description: 'Use your keyboard’s paste command inside the text box.',
        tone: 'warning',
      });
      return;
    }
    setIsPasting(true);
    try {
      const pastedText = await navigator.clipboard.readText();
      if (!pastedText) {
        notify({ title: 'Clipboard is empty', description: 'Copy some text first, then paste it here.', tone: 'info' });
      } else {
        setText(pastedText);
        notify({ title: 'Text pasted', description: 'Live statistics are ready below.', tone: 'success' });
      }
    } catch {
      notify({
        title: 'Clipboard access was blocked',
        description: 'Click the text box and paste using your keyboard instead.',
        tone: 'warning',
      });
    } finally {
      setIsPasting(false);
    }
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(createStatsReport(stats));
      notify({ title: 'Statistics copied', description: 'The text analysis report is on your clipboard.', tone: 'success' });
    } catch {
      notify({ title: 'Could not copy report', description: 'Check clipboard permission and try again.', tone: 'warning' });
    }
  };

  const detailStats: StatCardProps[] = [
    { label: 'Paragraphs', value: stats.paragraphs, description: 'Separated by blank lines', tone: 'violet' },
    { label: 'Lines', value: stats.lines, description: 'Including blank lines', tone: 'blue' },
    { label: 'Unique words', value: stats.uniqueWords, description: `of ${stats.words} total words`, tone: 'cyan' },
    { label: 'Vocabulary diversity', value: `${stats.vocabularyDiversity}%`, description: 'Unique words ÷ total words', tone: 'emerald' },
    { label: 'Avg. word length', value: stats.averageWordLength, description: 'Characters per word', tone: 'amber' },
    { label: 'Avg. sentence length', value: stats.averageSentenceLength, description: 'Words per sentence', tone: 'blue' },
    { label: 'Reading time', value: formatDuration(stats.readingSeconds), description: 'Estimated at 200 words/min', tone: 'cyan' },
    { label: 'Speaking time', value: formatDuration(stats.speakingSeconds), description: 'Estimated at 130 words/min', tone: 'violet' },
    { label: 'Estimated pages', value: formatPages(stats.estimatedPages), description: 'About 500 words per page', tone: 'amber' },
    { label: 'Punctuation marks', value: stats.punctuationMarks, description: 'All Unicode punctuation', tone: 'blue' },
    { label: 'Number tokens', value: stats.numbers, description: 'Standalone numbers', tone: 'cyan' },
    { label: 'Letters', value: stats.letters, description: 'Unicode letters', tone: 'emerald' },
    { label: 'Uppercase letters', value: stats.uppercaseLetters, description: 'Where the script has case', tone: 'violet' },
    { label: 'Lowercase letters', value: stats.lowercaseLetters, description: 'Where the script has case', tone: 'amber' },
    { label: 'Whitespace', value: stats.whitespaceCharacters, description: 'Spaces, tabs, and line breaks', tone: 'blue' },
    { label: 'URLs', value: stats.urls, description: 'Web links found in text', tone: 'cyan' },
  ];

  return (
    <ScreenShell
      title="Word Counter"
      subtitle="Instant statistics for Bengali and English text"
      icon={<FileText className="size-[19px]" />}
      contentClassName="!space-y-0 !px-0 !pt-4"
    >
      <main className="space-y-5 px-4 pb-8">
        <section className="relative overflow-hidden rounded-[26px] border border-emerald-300/15 bg-gradient-to-br from-emerald-500/15 via-slate-900/95 to-slate-950 p-5">
          <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
              <BookOpen size={21} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-emerald-200/70">Text analysis</p>
              <h2 className="mt-1 text-xl font-black text-white">Every detail, at a glance.</h2>
              <p className="mt-1 text-sm leading-5 text-slate-400">বাংলা, English, numbers, paragraphs—paste or type and see live results.</p>
            </div>
          </div>
          <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.07] pt-3 text-xs text-slate-400">
            <span><strong className="text-white">{stats.words.toLocaleString('en-US')}</strong> words</span>
            <span><strong className="text-white">{stats.characters.toLocaleString('en-US')}</strong> characters</span>
            <span>Updates as you type</span>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-slate-900/75 shadow-lg shadow-black/10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-emerald-300" />
              <h2 className="text-sm font-bold text-white">Your text</h2>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] tabular-nums text-slate-400">
                {stats.characters.toLocaleString('en-US')} characters typed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void pasteFromClipboard()}
                disabled={isPasting}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-300/20 bg-emerald-400/[0.08] px-3 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-50"
              >
                <span className={isPasting ? 'animate-pulse' : ''}>{isPasting ? 'Pasting…' : 'Paste'}</span>
              </button>
              {hasText && (
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                  <Trash2 size={14} /> Clear
                </button>
              )}
            </div>
          </div>
          <textarea
            name="word-counter-text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste or type your writing here…\n\nYour text stays in this browser. The analysis updates instantly."
            aria-label="Text to analyze"
            className="min-h-[230px] w-full resize-y bg-transparent px-4 py-4 text-[14px] leading-7 text-slate-100 outline-none placeholder:text-slate-600"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] px-4 py-2.5">
            <p className="text-[11px] text-slate-500">Unicode-aware counts support Bengali and other scripts.</p>
            {!hasText && (
              <button
                type="button"
                onClick={() => setText(SAMPLE_TEXT)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 transition hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <Sparkles size={13} /> Try sample text
              </button>
            )}
          </div>
        </section>

        <section aria-labelledby="summary-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="summary-title" className="text-lg font-bold text-white">Text statistics</h2>
              <p className="mt-0.5 text-xs text-slate-400">A detailed breakdown of your writing</p>
            </div>
            <button
              type="button"
              disabled={!hasText}
              onClick={() => void copyReport()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-bold text-slate-300 transition hover:border-emerald-300/20 hover:text-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Copy size={13} /> Copy report
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <StatCard label="Total words" value={stats.words.toLocaleString('en-US')} description="Unicode-aware word count" tone="emerald" prominent />
            <StatCard label="Characters" value={stats.characters.toLocaleString('en-US')} description="Including spaces" tone="cyan" prominent />
            <StatCard label="Characters (no spaces)" value={stats.charactersWithoutSpaces.toLocaleString('en-US')} description="All whitespace excluded" tone="violet" prominent />
            <StatCard label="Sentences" value={stats.sentences.toLocaleString('en-US')} description="Common script punctuation" tone="amber" prominent />
          </div>
        </section>

        <section aria-label="Additional text details">
          <h2 className="mb-3 text-base font-bold text-white">More details</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {detailStats.map((item) => <StatCard key={item.label} {...item} />)}
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-amber-200" />
            <h2 className="text-sm font-bold text-white">Word extremes</h2>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Longest</p>
              <p className="mt-1 truncate text-sm font-semibold text-emerald-200" title={stats.longestWord || undefined}>{stats.longestWord || '—'}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Shortest</p>
              <p className="mt-1 truncate text-sm font-semibold text-cyan-200" title={stats.shortestWord || undefined}>{stats.shortestWord || '—'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/10 text-emerald-200"><BookOpen size={14} /></span>
            <h2 className="text-sm font-bold text-white">Most repeated words</h2>
          </div>
          {stats.topWords.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Repeated words will appear here after you add more text.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {stats.topWords.map((item) => (
                <li key={item.word} className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-slate-950/55 px-3 py-1.5 text-xs text-slate-200">
                  <span className="max-w-40 truncate">{item.word}</span>
                  <span className="rounded-full bg-emerald-400/10 px-1.5 py-0.5 font-bold tabular-nums text-emerald-200">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="pb-2 text-center text-[11px] leading-5 text-slate-500">
          Analysis is calculated locally in your browser; your writing is not uploaded or saved by Word Counter.
        </p>
      </main>
    </ScreenShell>
  );
}
