import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Archive, ArchiveRestore, CheckCircle2, Circle, Flame, Plus, Sparkles, Trash2 } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { writeRecord, readAll, deleteRecord } from '../../db/indexedDB';
import { uid } from '../../utils/format';
import { toDateKey, lastDateKeys, dayLabel } from '../../utils/date';
import { useOS } from '../../context/OSContext';
import { Modal } from '../../components/Modal';
import { CustomButton } from '../../components/CustomButton';
import { Stepper } from '../../components/ui/controls';
import { cn } from '../../utils/cn';
import {
  HABIT_STORE, DEFAULT_SCHEDULE, WEEKDAY_LABELS,
  computeStreak, describeSchedule, isScheduledOn, normaliseHabit, weeklyCount,
  type Habit, type HabitSchedule, type ScheduleKind,
} from './habitModel';

const EMOJIS = ['💪', '📚', '🏃', '🧘', '💧', '🥗', '🎯', '✍️', '🎨', '🎵', '💤', '🌿'];
const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#eab308', '#06b6d4', '#84cc16', '#ef4444', '#14b8a6'];
const TODAY = toDateKey(new Date());

type Sheet = null | 'chooser' | 'new' | 'archive';

export function HabitsApp() {
  const { notify, openScreen } = useOS();
  const [all, setAll] = useState<Habit[]>([]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [draft, setDraft] = useState({
    name: '', emoji: EMOJIS[0], color: COLORS[0],
    schedule: { ...DEFAULT_SCHEDULE } as HabitSchedule,
  });
  const weekKeys = lastDateKeys(7);

  useEffect(() => {
    readAll<Habit>(HABIT_STORE).then((rows) =>
      setAll(rows.map(normaliseHabit).sort((a, b) => a.ts - b.ts)),
    );
  }, []);

  const habits = useMemo(() => all.filter((h) => !h.archived), [all]);
  const archived = useMemo(
    () => all.filter((h) => h.archived).sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0)),
    [all],
  );

  const persist = useCallback(async (habit: Habit) => {
    await writeRecord(HABIT_STORE, habit as unknown as { id: string });
    setAll((prev) => prev.map((h) => (h.id === habit.id ? habit : h)));
  }, []);

  const toggle = useCallback(async (habit: Habit, dateKey: string) => {
    const done = habit.completions.includes(dateKey);
    await persist({
      ...habit,
      completions: done
        ? habit.completions.filter((d) => d !== dateKey)
        : [...habit.completions, dateKey],
    });
  }, [persist]);

  const addHabit = useCallback(async () => {
    if (!draft.name.trim()) {
      notify({ title: 'Name your habit first', tone: 'warning' });
      return;
    }
    const habit: Habit = {
      id: uid(), ts: Date.now(), dateKey: TODAY,
      name: draft.name.trim(), emoji: draft.emoji, color: draft.color,
      completions: [], schedule: draft.schedule, archived: false,
    };
    await writeRecord(HABIT_STORE, habit as unknown as { id: string });
    setAll((prev) => [...prev, habit]);
    setDraft({ name: '', emoji: EMOJIS[0], color: COLORS[0], schedule: { ...DEFAULT_SCHEDULE } });
    setSheet(null);
    notify({ title: `${habit.emoji} ${habit.name} added`, description: describeSchedule(habit.schedule), tone: 'success' });
  }, [draft, notify]);

  const archive = useCallback(async (habit: Habit) => {
    await persist({ ...habit, archived: true, archivedAt: Date.now() });
    notify({ title: `${habit.name} archived`, description: 'History kept — restore any time', tone: 'info' });
  }, [persist, notify]);

  const restore = useCallback(async (habit: Habit) => {
    await persist({ ...habit, archived: false, archivedAt: undefined });
    setSheet(null);
    notify({ title: `${habit.name} restored`, description: 'Back in active tracking', tone: 'success' });
  }, [persist, notify]);

  const remove = useCallback(async (habit: Habit) => {
    await deleteRecord(HABIT_STORE, habit.id);
    setAll((prev) => prev.filter((h) => h.id !== habit.id));
    notify({ title: 'Habit deleted permanently', tone: 'warning' });
  }, [notify]);

  const dueToday = habits.filter((h) => isScheduledOn(h.schedule, TODAY));
  const todayDone = dueToday.filter((h) => h.completions.includes(TODAY)).length;
  const pct = dueToday.length > 0 ? Math.round((todayDone / dueToday.length) * 100) : 0;

  return (
    <ScreenShell
      title="Habit Tracker"
      subtitle={`${todayDone}/${dueToday.length} due today`}
      icon={<Flame className="size-4" />}
      contentClassName="!space-y-5"
      onOpenSettings={() => openScreen('habits', 'settings')}
    >
      {/* Today summary */}
      <div className="card relative flex items-center gap-4 overflow-hidden p-4">
        <motion.div
          className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-orange-500/10 blur-2xl"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative size-16 shrink-0">
          <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6" className="stroke-surface3" />
            <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6" strokeLinecap="round"
              stroke="#f97316"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - todayDone / Math.max(1, dueToday.length))}`}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-[13px] font-bold text-ink">
            {dueToday.length > 0 ? `${pct}%` : '—'}
          </span>
        </div>
        <div className="relative min-w-0">
          <p className="text-[15px] font-bold text-ink">Today's progress</p>
          <p className="text-[12px] text-ink3">
            {todayDone} of {dueToday.length} scheduled habits
            {habits.length !== dueToday.length && ` · ${habits.length - dueToday.length} rest day`}
          </p>
          {dueToday.length > 0 && todayDone === dueToday.length && (
            <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
              🎉 All done!
            </span>
          )}
        </div>
      </div>

      {/* Week grid */}
      {habits.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 pb-2 pt-4">
            <p className="text-[12px] font-bold uppercase tracking-wider text-ink">7-day overview</p>
          </div>
          <div className="no-scrollbar overflow-x-auto">
            <table className="w-full min-w-[340px] text-center">
              <thead>
                <tr>
                  <th className="w-32 px-3 py-1.5 text-left text-[10px] font-semibold uppercase text-ink3">Habit</th>
                  {weekKeys.map((k) => (
                    <th key={k} className={cn('w-9 px-1 py-1.5 text-[10px] font-bold uppercase', k === TODAY ? 'text-accent' : 'text-ink3')}>
                      {dayLabel(k)}
                    </th>
                  ))}
                  <th className="px-2 text-[10px] font-bold uppercase text-ink3">🔥</th>
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => (
                  <tr key={h.id} className="border-t border-hairline">
                    <td className="px-3 py-2 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px]">{h.emoji}</span>
                        <div className="min-w-0">
                          <p className="max-w-[72px] truncate text-[12px] font-semibold text-ink">{h.name}</p>
                          <p className="max-w-[72px] truncate text-[9px] text-ink3">{describeSchedule(h.schedule)}</p>
                        </div>
                      </div>
                    </td>
                    {weekKeys.map((k) => {
                      const scheduled = isScheduledOn(h.schedule, k);
                      const done = h.completions.includes(k);
                      return (
                        <td key={k} className="px-1 py-2">
                          <button
                            type="button"
                            onClick={() => void toggle(h, k)}
                            aria-label={`${h.name} on ${k}`}
                            className="mx-auto flex size-7 items-center justify-center rounded-full transition-all"
                            style={{ background: done ? `${h.color}33` : undefined }}
                          >
                            {done
                              ? <CheckCircle2 className="size-5" style={{ color: h.color }} />
                              : <Circle className={cn('size-5', scheduled ? 'text-ink3/40' : 'text-ink3/15')} />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-2 py-2">
                      <span className="text-[12px] font-bold" style={{ color: computeStreak(h) > 0 ? h.color : '#64748b' }}>
                        {computeStreak(h)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <div className="py-16 text-center">
          <p className="mb-2 text-[40px]">🎯</p>
          <p className="text-[15px] font-semibold text-ink">No active habits</p>
          <p className="mt-1 text-[12px] text-ink3">
            Tap + to create one{archived.length > 0 ? ' or restore from the archive' : ''}
          </p>
        </div>
      )}

      {/* Manage list */}
      {habits.length > 0 && (
        <div className="card divide-y divide-hairline overflow-hidden">
          <p className="px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-ink">Manage habits</p>
          {habits.map((h) => (
            <div key={h.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-[20px]">{h.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink">{h.name}</p>
                <p className="text-[11px] text-ink3">
                  {describeSchedule(h.schedule)}
                  {h.schedule.kind === 'timesPerWeek' && ` · ${weeklyCount(h)}/${h.schedule.timesPerWeek} this week`}
                </p>
              </div>
              <span className="size-3 shrink-0 rounded-full" style={{ background: h.color }} />
              <button type="button" onClick={() => void archive(h)} aria-label={`Archive ${h.name}`}
                className="tap rounded-full p-2 text-ink3 hover:bg-white/5 hover:text-ink">
                <Archive className="size-4" />
              </button>
              <button type="button" onClick={() => void remove(h)} aria-label={`Delete ${h.name}`}
                className="tap rounded-full p-2 hover:bg-red-500/10">
                <Trash2 className="size-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Archive summary */}
      {archived.length > 0 && (
        <button
          type="button"
          onClick={() => setSheet('archive')}
          className="card flex w-full items-center gap-3 p-4 text-left"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-surface3 text-ink3">
            <Archive className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold text-ink">Archived habits</p>
            <p className="text-[11.5px] text-ink3">{archived.length} kept with full history</p>
          </div>
          <ArchiveRestore className="size-4 text-ink3" />
        </button>
      )}

      {/* FAB */}
      <motion.button
        type="button" whileTap={{ scale: 0.92 }} onClick={() => setSheet('chooser')}
        aria-label="Add habit"
        className="fixed bottom-24 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-2xl shadow-orange-500/40"
      >
        <Plus className="size-6" />
      </motion.button>

      {/* Chooser sheet */}
      <Modal open={sheet === 'chooser'} onClose={() => setSheet(null)} sheet
        title="Add a habit" description="Start fresh or bring back something you paused.">
        <div className="space-y-2.5">
          <button type="button" onClick={() => setSheet('new')}
            className="tap flex w-full items-center gap-3 rounded-2xl border border-hairline bg-surface3/40 p-4 text-left">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-orange-500/15 text-orange-400">
              <Sparkles className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-ink">New habit</span>
              <span className="block text-[11.5px] text-ink3">Pick an icon, colour and schedule</span>
            </span>
          </button>
          <button type="button" onClick={() => setSheet('archive')} disabled={archived.length === 0}
            className="tap flex w-full items-center gap-3 rounded-2xl border border-hairline bg-surface3/40 p-4 text-left disabled:opacity-40">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-500/15 text-sky-400">
              <ArchiveRestore className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-ink">Archived habit</span>
              <span className="block text-[11.5px] text-ink3">
                {archived.length > 0 ? `${archived.length} available to restore` : 'Nothing archived yet'}
              </span>
            </span>
          </button>
        </div>
      </Modal>

      {/* Archive picker */}
      <Modal open={sheet === 'archive'} onClose={() => setSheet(null)} sheet
        title="Archived habits" description="Restoring keeps every past completion.">
        <div className="max-h-72 space-y-2 overflow-y-auto no-scrollbar">
          <AnimatePresence initial={false}>
            {archived.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-ink3">Nothing archived yet.</p>
            ) : archived.map((h) => (
              <motion.div key={h.id} layout
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-2xl bg-surface3/40 p-3">
                <span className="text-[20px]">{h.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{h.name}</p>
                  <p className="text-[11px] text-ink3">
                    {describeSchedule(h.schedule)} · {h.completions.length} completions
                  </p>
                </div>
                <CustomButton size="sm" onClick={() => void restore(h)}>Restore</CustomButton>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Modal>

      {/* New habit sheet */}
      <Modal open={sheet === 'new'} onClose={() => setSheet(null)} sheet title="New habit"
        footer={<>
          <CustomButton variant="ghost" fullWidth onClick={() => setSheet(null)}>Cancel</CustomButton>
          <CustomButton fullWidth onClick={addHabit}>Add habit</CustomButton>
        </>}>
        <div className="space-y-4">
          <input
            type="text" name="habit-name" autoComplete="off" autoCorrect="off" spellCheck
            data-1p-ignore="true" data-lpignore="true" data-form-type="other"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Habit name (e.g. Meditate)"
            className="w-full rounded-2xl border border-hairline bg-surface3/60 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink3"
          />

          {/* Schedule */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase text-ink3">Schedule</p>
            <div className="mb-2 flex gap-1 rounded-2xl border border-hairline bg-surface3/50 p-1">
              {([['daily', 'Daily'], ['weekdays', 'Days'], ['timesPerWeek', 'Weekly']] as [ScheduleKind, string][]).map(([kind, label]) => (
                <button key={kind} type="button"
                  onClick={() => setDraft((d) => ({ ...d, schedule: { ...d.schedule, kind } }))}
                  className={cn('flex-1 rounded-xl py-2 text-[12px] font-bold transition-colors',
                    draft.schedule.kind === kind ? 'bg-orange-500 text-white' : 'text-ink3')}>
                  {label}
                </button>
              ))}
            </div>

            {draft.schedule.kind === 'weekdays' && (
              <div className="flex gap-1.5">
                {WEEKDAY_LABELS.map((label, day) => {
                  const on = draft.schedule.days.includes(day);
                  return (
                    <button key={day} type="button"
                      onClick={() => setDraft((d) => ({
                        ...d,
                        schedule: {
                          ...d.schedule,
                          days: on ? d.schedule.days.filter((x) => x !== day) : [...d.schedule.days, day],
                        },
                      }))}
                      className={cn('grid h-10 flex-1 place-items-center rounded-xl text-[12px] font-bold transition-colors',
                        on ? 'bg-orange-500 text-white' : 'bg-surface3/60 text-ink3')}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {draft.schedule.kind === 'timesPerWeek' && (
              <div className="flex items-center justify-between rounded-2xl bg-surface3/40 p-3">
                <span className="text-[13px] font-semibold text-ink2">Times per week</span>
                <Stepper value={draft.schedule.timesPerWeek} step={1} min={1} max={7}
                  onChange={(timesPerWeek) => setDraft((d) => ({ ...d, schedule: { ...d.schedule, timesPerWeek } }))} />
              </div>
            )}

            <p className="mt-2 text-[11px] text-ink3">{describeSchedule(draft.schedule)}</p>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase text-ink3">Icon</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => setDraft((d) => ({ ...d, emoji: e }))}
                  className={cn('size-10 rounded-xl text-[20px] transition-all',
                    draft.emoji === e ? 'scale-110 bg-orange-500' : 'bg-surface3/60')}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase text-ink3">Colour</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" aria-label={`Colour ${c}`}
                  onClick={() => setDraft((d) => ({ ...d, color: c }))}
                  className="size-8 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: draft.color === c ? '#fff' : 'transparent' }} />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </ScreenShell>
  );
}
