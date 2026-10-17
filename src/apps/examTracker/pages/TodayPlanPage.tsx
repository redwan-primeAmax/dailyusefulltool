import { useMemo } from 'react';
import { Check, CheckCircle2, Clock3, ListChecks, Sparkles } from 'lucide-react';
import type { ExamSubject } from '../../../types';
import { buildTodayPlan } from '../examModel';

interface Props {
  subjects: ExamSubject[];
  onComplete: (subjectId: string, categoryId: string) => void;
  onAddSubject: () => void;
}

export function TodayPlanPage({ subjects, onComplete, onAddSubject }: Props) {
  const plan = useMemo(() => buildTodayPlan(subjects), [subjects]);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const totalMinutes = plan.reduce((total, item) => total + item.category.recommendedMinutes, 0);

  return (
    <main className="space-y-5 px-4 pb-8">
      <header className="relative overflow-hidden rounded-[26px] border border-cyan-300/15 bg-gradient-to-br from-cyan-500/15 via-slate-900 to-slate-950 p-5">
        <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200"><ListChecks size={21} /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-cyan-200/70">Today’s focus</p>
            <h2 className="mt-1 text-xl font-black text-white">Your study plan</h2>
            <p className="mt-1 text-sm text-slate-400">{today}</p>
          </div>
        </div>
        <div className="relative mt-4 flex items-center gap-4 border-t border-white/[0.07] pt-4 text-xs text-slate-300">
          <span><strong className="text-white">{plan.length}</strong> scheduled {plan.length === 1 ? 'subject' : 'subjects'}</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> About {totalMinutes} min</span>
        </div>
      </header>

      {plan.length === 0 ? (
        <section className="flex min-h-60 flex-col items-center justify-center rounded-[26px] border border-dashed border-slate-700 bg-slate-900/55 px-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 size={26} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">{subjects.length ? 'You’re all caught up' : 'Your plan starts here'}</h3>
          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
            {subjects.length
              ? 'Every category is complete. Add a new subject or update your JSON plan to schedule more study.'
              : 'Add a subject and its categories. The next unfinished category in each subject will appear here.'}
          </p>
          <button
            type="button"
            onClick={onAddSubject}
            className="mt-5 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
          >
            Add a subject
          </button>
        </section>
      ) : (
        <section className="space-y-3" aria-label="Today’s scheduled subjects">
          {plan.map(({ subject, category }, index) => (
            <article key={`${subject.id}-${category.id}`} className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-slate-900/75 shadow-lg shadow-black/10">
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black text-slate-950" style={{ backgroundColor: subject.color }}>
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-white">{subject.name}</h3>
                    <p className="truncate text-xs text-slate-400">{category.name}</p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/[0.07] bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  <Clock3 size={12} /> {category.recommendedMinutes} min
                </span>
              </div>
              <div className="p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{category.instructions}</p>
                {category.topics.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Topics to cover</p>
                    <ul className="flex flex-wrap gap-2">
                      {category.topics.map((topic, topicIndex) => (
                        <li key={`${topic}-${topicIndex}`} className="rounded-lg border border-white/[0.07] bg-slate-950/50 px-2.5 py-1.5 text-xs text-slate-300">{topic}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onComplete(subject.id, category.id)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  <Check size={17} /> Mark section complete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <p className="flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500">
        <Sparkles size={13} className="shrink-0 text-emerald-400" /> One unfinished category per subject is scheduled at a time.
      </p>
    </main>
  );
}
