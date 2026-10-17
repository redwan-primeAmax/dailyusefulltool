import { ArrowRight, BookOpen, Plus, Sparkles, Target } from 'lucide-react';
import type { ExamSubject } from '../../../types';
import { getProgressSummary, getSubjectRemainingPercent } from '../examModel';
import { LiquidProgressBar } from '../components/LiquidProgressBar';

interface Props {
  subjects: ExamSubject[];
  onStartStudy: () => void;
  onAddSubject: () => void;
}

export function ExamHomePage({ subjects, onStartStudy, onAddSubject }: Props) {
  const progress = getProgressSummary(subjects);
  const totalSubjects = subjects.length;
  const hasPlan = progress.totalCategories > 0;

  return (
    <main className="space-y-5 px-4 pb-8">
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-300/15 bg-gradient-to-br from-emerald-500/15 via-slate-900/95 to-slate-950 p-5 shadow-[0_24px_70px_rgba(5,150,105,0.12)]">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/75">
              <Target size={14} /> Exam readiness
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Your progress, in motion.</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
              Build a clear plan for every subject and turn each finished section into momentum.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right backdrop-blur">
            <div className="text-2xl font-black tabular-nums text-emerald-300">{Math.round(progress.completionPercent)}%</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">complete</div>
          </div>
        </div>
        <div className="relative mt-5">
          <LiquidProgressBar value={progress.completionPercent} />
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-400">
            <span>{progress.completedCategories} of {progress.totalCategories} sections complete</span>
            <span>{totalSubjects} {totalSubjects === 1 ? 'subject' : 'subjects'}</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="subject-progress-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="subject-progress-title" className="text-lg font-bold text-white">Subject progress</h2>
            <p className="mt-0.5 text-xs text-slate-400">Remaining sections in each subject</p>
          </div>
          <button
            type="button"
            onClick={onAddSubject}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <Plus size={15} /> Add subject
          </button>
        </div>

        {subjects.length === 0 ? (
          <button
            type="button"
            onClick={onAddSubject}
            className="group flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/55 px-5 text-center transition hover:border-emerald-400/40 hover:bg-emerald-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300 transition group-hover:scale-105"><BookOpen size={21} /></span>
            <span className="mt-3 text-sm font-semibold text-white">Add your first subject</span>
            <span className="mt-1 text-xs text-slate-400">Start with Bengali, Mathematics, or any exam subject.</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {subjects.map((subject) => {
              const remaining = getSubjectRemainingPercent(subject);
              const completed = subject.categories.filter((category) => category.completed).length;
              return (
                <article
                  key={subject.id}
                  className="relative min-h-36 overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/80 p-4 shadow-lg shadow-black/10"
                >
                  <div className="absolute -right-5 -top-6 h-20 w-20 rounded-full opacity-[0.10] blur-2xl" style={{ backgroundColor: subject.color }} />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-2 h-1 w-8 rounded-full" style={{ backgroundColor: subject.color }} />
                      <h3 className="truncate text-sm font-bold text-white">{subject.name}</h3>
                    </div>
                    <BookOpen size={16} className="shrink-0 text-slate-500" />
                  </div>
                  <div className="relative mt-4 flex items-end justify-between gap-1">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Remaining</div>
                      <div className="mt-0.5 text-xl font-black tabular-nums text-white">
                        {remaining === null ? '—' : `${remaining.toFixed(1)}%`}
                      </div>
                    </div>
                    <div className="pb-1 text-right text-[10px] tabular-nums text-slate-400">
                      {completed}/{subject.categories.length} done
                    </div>
                  </div>
                  <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${remaining === null ? 0 : 100 - remaining}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/75 p-4">
        <div className="absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              <Sparkles size={14} className="text-cyan-300" /> Overall remaining rating
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight text-white">{hasPlan ? `${progress.remainingPercent?.toFixed(1)}%` : '—'}</span>
              <span className="text-xs font-black tracking-[0.2em] text-cyan-300">OVR</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {hasPlan ? 'Share of all planned sections still to complete.' : 'Add subject categories to calculate exam readiness.'}
            </p>
          </div>
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
            <Target size={25} />
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={onStartStudy}
        disabled={subjects.length === 0}
        className="exam-start-study-button group relative flex min-h-[76px] w-full items-center justify-between overflow-hidden rounded-[24px] border border-emerald-200/30 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-5 text-left shadow-[0_14px_38px_rgba(16,185,129,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(16,185,129,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
      >
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.16)_42%,transparent_59%)] bg-[length:220%_100%] transition-[background-position] duration-700 group-hover:bg-right" />
        <span className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white shadow-inner shadow-white/10">
            <BookOpen size={21} />
          </span>
          <span>
            <span className="block text-base font-black tracking-wide text-white">Start Study</span>
            <span className="mt-0.5 block text-xs text-emerald-50/85">Open today’s scheduled subjects</span>
          </span>
        </span>
        <ArrowRight size={21} className="relative text-white transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    </main>
  );
}
