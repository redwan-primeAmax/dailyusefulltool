import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, Circle, Plus, Star, Trash2 } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { CustomButton } from '../../components/CustomButton';
import { writeRecord, readAll, deleteRecord } from '../../db/indexedDB';
import { uid } from '../../utils/format';
import { relativeTime } from '../../utils/date';
import { useOS } from '../../context/OSContext';
import { cn } from '../../utils/cn';
import {
  TODO_STORE,
  PRIORITY_COLOR,
  PRIORITY_INK,
  PRIORITY_LABEL,
  autoExpire,
  buildTrend,
  completionRate,
  consistencyScore,
  daysUntil,
  defaultDraft,
  normalizeTodo,
  rangeLabel,
  todoStatus,
  type Priority,
  type Todo,
} from './todoModel';

type View = 'dashboard' | 'manage';

export function TodoApp() {
  const { notify, openScreen } = useOS();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [draft, setDraft] = useState(defaultDraft);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await readAll<Todo>(TODO_STORE);
        // Normalise legacy records and apply deadline expiry.
        const upgraded = rows.map(normalizeTodo).map((t) => autoExpire(t));

        // Persist only the records whose shape actually changed, rather than
        // rewriting the whole store on every launch.
        const changed = upgraded.filter((t, i) => {
          const original = rows[i];
          return !original
            || original.done !== t.done
            || original.expired !== t.expired
            || original.startDate !== t.startDate
            || original.endDate !== t.endDate;
        });
        if (changed.length > 0) {
          await Promise.all(changed.map((t) => writeRecord(TODO_STORE, t as unknown as { id: string })));
        }

        if (active) setTodos([...upgraded].sort(sortTodos));
      } catch (error) {
        console.error('[todo] failed to load tasks', error);
        if (active) setTodos([]);
      }
    })();
    return () => { active = false; };
  }, []);

  const toggle = useCallback(async (todo: Todo) => {
    const updated: Todo = {
      ...todo,
      done: !todo.done,
      expired: false,
      completedAt: !todo.done ? Date.now() : undefined,
    };
    await writeRecord(TODO_STORE, updated as unknown as { id: string });
    setTodos((prev) => prev.map((t) => t.id === todo.id ? updated : t).sort(sortTodos));
  }, []);

  const star = useCallback(async (todo: Todo) => {
    const updated = { ...todo, starred: !todo.starred };
    await writeRecord(TODO_STORE, updated as unknown as { id: string });
    setTodos((prev) => prev.map((t) => t.id === todo.id ? updated : t).sort(sortTodos));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteRecord(TODO_STORE, id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
    notify({ title: 'Task removed', tone: 'warning' });
  }, [notify]);

  const add = useCallback(async () => {
    const text = draft.text.trim();
    if (!text) {
      notify({ title: 'Task needs a title', tone: 'warning' });
      return;
    }
    const startDate = draft.startDate <= draft.endDate ? draft.startDate : draft.endDate;
    const endDate = draft.startDate <= draft.endDate ? draft.endDate : draft.startDate;
    const todo: Todo = {
      id: uid(), ts: Date.now(), dateKey: startDate,
      text, done: false, priority: draft.priority, starred: false,
      startDate, endDate, expired: false,
    };
    await writeRecord(TODO_STORE, todo as unknown as { id: string });
    setTodos((prev) => [todo, ...prev].sort(sortTodos));
    setDraft(defaultDraft());
    setView('dashboard');
    notify({ title: 'Task scheduled', description: rangeLabel(todo), tone: 'success' });
  }, [draft, notify]);

  if (view === 'manage') {
    return (
      <TaskManagementPage
        draft={draft}
        setDraft={setDraft}
        onSave={add}
        onBack={() => setView('dashboard')}
      />
    );
  }

  const doneCount = todos.filter((t) => t.done).length;
  const activeTasks = todos.filter((t) => todoStatus(t) === 'active');
  const expired = todos.filter((t) => todoStatus(t) === 'expired').length;
  const rate = completionRate(todos);
  const consistency = consistencyScore(todos);
  const trend = buildTrend(todos);

  return (
    <ScreenShell
      title="To-Do List"
      subtitle={`${doneCount}/${todos.length} completed · ${activeTasks.length} active`}
      icon={<CheckCircle2 className="size-4" />}
      contentClassName="!space-y-4"
      onOpenSettings={() => openScreen('todo', 'settings')}
    >
      <CompletionGraph trend={trend} />

      <div className="grid grid-cols-3 gap-3">
        <Metric label="Completion" value={`${rate}%`} tone={rate === 100 ? 'good' : 'default'} />
        <Metric label="Consistency" value={`${consistency}%`} tone={consistency === 100 ? 'good' : 'warn'} />
        <Metric label="Missed" value={`${expired}`} tone={expired > 0 ? 'bad' : 'good'} />
      </div>

      {consistency === 100 && todos.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-[12px] font-semibold text-emerald-300">
          Perfect consistency: 100% accuracy maintained.
        </div>
      )}

      <div className="card divide-y divide-hairline overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-[12px] font-bold uppercase tracking-wider text-ink">Active tasks</p>
          <span className="text-[11px] font-semibold text-ink3">{activeTasks.length} open</span>
        </div>
        <AnimatePresence mode="popLayout">
          {activeTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
              <p className="mb-2 text-[30px]">✅</p>
              <p className="text-[14px] font-semibold text-ink">Nothing active</p>
              <p className="mt-1 text-[12px] text-ink3">Schedule a task from the add button.</p>
            </motion.div>
          ) : (
            activeTasks.map((todo) => (
              <TaskRow key={todo.id} todo={todo} onToggle={toggle} onStar={star} onDelete={remove} />
            ))
          )}
        </AnimatePresence>
      </div>

      {todos.some((t) => todoStatus(t) !== 'active') && (
        <div className="card divide-y divide-hairline overflow-hidden">
          <p className="px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-ink">Completed / expired</p>
          {todos.filter((t) => todoStatus(t) !== 'active').slice(0, 8).map((todo) => (
            <TaskRow key={todo.id} todo={todo} onToggle={toggle} onStar={star} onDelete={remove} compact />
          ))}
        </div>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={() => setView('manage')}
        aria-label="Add new task"
        className="fixed bottom-24 right-5 z-50 grid size-14 place-items-center rounded-full bg-accent text-white shadow-2xl shadow-accent/35"
      >
        <Plus className="size-6" />
      </motion.button>
    </ScreenShell>
  );
}

function sortTodos(a: Todo, b: Todo) {
  return Number(b.starred) - Number(a.starred)
    || statusRank(a) - statusRank(b)
    || a.endDate.localeCompare(b.endDate)
    || b.ts - a.ts;
}

function statusRank(t: Todo) {
  const s = todoStatus(t);
  if (s === 'active') return 0;
  if (s === 'expired') return 1;
  return 2;
}

function CompletionGraph({ trend }: { trend: ReturnType<typeof buildTrend> }) {
  const max = Math.max(1, ...trend.map((d) => d.due));
  return (
    <div className="card overflow-hidden p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-bold text-ink">Completion trend</p>
          <p className="text-[11px] text-ink3">Due vs completed over the last 7 days</p>
        </div>
        <CalendarDays className="size-5 text-ink3" />
      </div>
      <div className="flex h-28 items-end gap-2">
        {trend.map((d, i) => {
          const dueHeight = Math.max(8, (d.due / max) * 100);
          const doneHeight = d.due === 0 ? 0 : (d.done / Math.max(1, d.due)) * dueHeight;
          return (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="relative flex h-24 w-full items-end justify-center rounded-xl bg-surface3/50">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${dueHeight}%` }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 80, damping: 18 }}
                  className="w-[70%] rounded-lg bg-white/10"
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${doneHeight}%` }}
                  transition={{ delay: 0.08 + i * 0.04, type: 'spring', stiffness: 80, damping: 18 }}
                  className="absolute bottom-0 w-[70%] rounded-lg bg-gradient-to-t from-lime-500 to-emerald-300"
                />
                {d.expired > 0 && <span className="absolute top-1 size-1.5 rounded-full bg-red-400" />}
              </div>
              <span className="text-[9.5px] font-bold uppercase text-ink3">{d.key.slice(8)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'good' | 'warn' | 'bad' | 'default' }) {
  const tones = { good: 'text-lime-300', warn: 'text-amber-300', bad: 'text-red-300', default: 'text-ink' };
  return (
    <div className="card overflow-hidden px-3 py-3 text-center">
      <p className={cn('text-[18px] font-black tabular-nums', tones[tone])}>{value}</p>
      <p className="text-[9.5px] font-bold uppercase tracking-wider text-ink3">{label}</p>
    </div>
  );
}

function TaskRow({ todo, onToggle, onStar, onDelete, compact }: {
  todo: Todo; compact?: boolean; onToggle: (t: Todo) => void; onStar: (t: Todo) => void; onDelete: (id: string) => void;
}) {
  const status = todoStatus(todo);
  const days = daysUntil(todo);
  return (
    <motion.div layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
      className={cn('flex items-center gap-3 px-4', compact ? 'py-2.5' : 'py-3.5')}>
      <button type="button" onClick={() => onToggle(todo)} className="shrink-0 tap">
        {todo.done ? <CheckCircle2 className="size-6 text-emerald-400" /> : <Circle className="size-6 text-ink3" />}
      </button>
      <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: PRIORITY_COLOR[todo.priority] }} />
      <div className="min-w-0 flex-1">
        <p className={cn('text-[14px] font-semibold leading-snug', todo.done ? 'line-through text-ink3' : status === 'expired' ? 'text-red-300' : 'text-ink')}>
          {todo.text}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: PRIORITY_COLOR[todo.priority] + '2e', color: PRIORITY_INK[todo.priority] }}>
            {PRIORITY_LABEL[todo.priority]}
          </span>
          <span className="text-[10px] text-ink3">{rangeLabel(todo)}</span>
          <span className={cn('text-[10px] font-semibold', status === 'expired' ? 'text-red-300' : 'text-ink3')}>
            {status === 'done' ? `done ${todo.completedAt ? relativeTime(todo.completedAt) : ''}` : status === 'expired' ? 'expired' : days <= 0 ? 'due today' : `${days}d left`}
          </span>
        </div>
      </div>
      <button type="button" onClick={() => onStar(todo)} className="tap p-1.5 rounded-full hover:bg-amber-500/10">
        <Star className={`size-4 ${todo.starred ? 'fill-amber-400 text-amber-400' : 'text-ink3'}`} />
      </button>
      <button type="button" onClick={() => onDelete(todo.id)} className="tap p-1.5 rounded-full hover:bg-red-500/10">
        <Trash2 className="size-4 text-red-400" />
      </button>
    </motion.div>
  );
}

function TaskManagementPage({ draft, setDraft, onSave, onBack }: {
  draft: ReturnType<typeof defaultDraft>;
  setDraft: React.Dispatch<React.SetStateAction<ReturnType<typeof defaultDraft>>>;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <ScreenShell title="Task Management" subtitle="Schedule a new task" icon={<Plus className="size-4" />}
      contentClassName="!space-y-5">
      <div className="card overflow-hidden">
        <div className="border-b border-hairline px-4 py-3">
          <p className="text-[13px] font-bold text-ink">Create task</p>
          <p className="text-[11px] text-ink3">Single-day or multi-day scheduling</p>
        </div>
        <div className="space-y-4 p-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink3">Task</span>
            <input
              type="text"
              name="todo-management-title"
              autoComplete="off"
              autoCorrect="off"
              spellCheck
              data-1p-ignore="true"
              data-lpignore="true"
              value={draft.text}
              onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
              placeholder="e.g. Submit project report"
              className="w-full rounded-2xl border border-hairline bg-surface3/60 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink3"
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as Priority[]).map((p) => (
              <button key={p} type="button" onClick={() => setDraft((d) => ({ ...d, priority: p }))}
                className="rounded-2xl border px-3 py-2 text-[11px] font-bold transition-all"
                style={{
                  borderColor: draft.priority === p ? PRIORITY_INK[p] : 'transparent',
                  background: draft.priority === p ? PRIORITY_COLOR[p] + '33' : 'rgba(255,255,255,0.04)',
                  color: draft.priority === p ? PRIORITY_INK[p] : '#64748b',
                }}>
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DateField label="Start date" name="todo-start-date" value={draft.startDate}
              onChange={(startDate) => setDraft((d) => ({ ...d, startDate }))} />
            <DateField label="Target / end" name="todo-end-date" value={draft.endDate}
              onChange={(endDate) => setDraft((d) => ({ ...d, endDate }))} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-3 text-[12px] leading-relaxed text-amber-200/80">
        Tasks that pass their target date without completion are automatically marked as expired.
      </div>

      <div className="flex gap-3">
        <CustomButton fullWidth variant="outline" onClick={onBack}>Cancel</CustomButton>
        <CustomButton fullWidth onClick={onSave}>Save task</CustomButton>
      </div>
    </ScreenShell>
  );
}

function DateField({ label, name, value, onChange }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink3">{label}</span>
      <input
        type="date"
        name={name}
        autoComplete="off"
        data-1p-ignore="true"
        data-lpignore="true"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-hairline bg-surface3/60 px-3 py-3 text-[13px] font-bold text-ink outline-none"
      />
    </label>
  );
}
