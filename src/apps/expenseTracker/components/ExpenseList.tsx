import { AnimatePresence } from 'framer-motion';
import { PieChart, Receipt } from 'lucide-react';
import { BarChart, EmptyState, StatTile, TimelineRow } from '../../../components/ui/DataViz';
import { Card } from '../../../components/ui/Card';
import { dayLabel, relativeTime } from '../../../utils/date';
import { formatMoney, percent } from '../../../utils/format';
import type { ExpenseCategory, ExpenseEntry, ExpenseSettings } from '../../../types';

export interface ExpenseListProps {
  entries: ExpenseEntry[];
  periodEntries: ExpenseEntry[];
  byCategory: { category?: ExpenseCategory; amount: number; count: number }[];
  week: { key: string; amount: number }[];
  settings: ExpenseSettings;
  spent: number;
  category: (id: string) => ExpenseCategory;
  onDelete: (id: string) => void;
}

/** Category breakdown, weekly burn and period history. */
export function ExpenseList({
  entries,
  periodEntries,
  byCategory,
  week,
  settings,
  spent,
  category,
  onDelete,
}: ExpenseListProps) {
  const chart = week.map((d) => ({
    key: d.key,
    label: dayLabel(d.key),
    value: d.amount,
    highlight: d.amount >= settings.limit / 7,
    emphasis: d.key === week[week.length - 1]?.key,
  }));

  const top = byCategory[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label="Left"
          value={formatMoney(Math.max(0, settings.limit - spent), settings.currency)}
          tone={settings.limit - spent <= 0 ? 'bad' : 'good'}
        />
        <StatTile label="Entries" value={`${periodEntries.length}`} hint="this period" />
        <StatTile
          label="Top spend"
          value={top ? `${top.category?.emoji ?? '💸'} ${formatMoney(top.amount, settings.currency)}` : '–'}
          hint={top?.category?.name}
        />
      </div>

      {byCategory.length > 0 && (
        <Card title="Where it went" subtitle="Split across the current period">
          <ul className="divide-y divide-hairline">
            {byCategory.map((row) => {
              const pct = percent(row.amount, spent);
              return (
                <li key={row.category?.id ?? row.amount} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-2xl text-[16px]"
                    style={{ background: `${row.category?.color ?? '#64748b'}22` }}
                  >
                    {row.category?.emoji ?? '💸'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[14px] font-semibold text-ink">{row.category?.name ?? 'Other'}</p>
                      <p className="text-[13px] font-bold tabular-nums text-ink">
                        {formatMoney(row.amount, settings.currency)}
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface3">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, pct)}%`, background: row.category?.color ?? '#64748b' }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-ink3">
                      {pct}% · {row.count} entr{row.count === 1 ? 'y' : 'ies'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card title="Daily burn" subtitle="Spend per day this week">
        <BarChart data={chart} format={(v) => formatMoney(Math.round(v), settings.currency).replace(/\.00$/, '')} />
      </Card>

      <Card title="History" subtitle={`${entries.length} logged overall`}>
        <AnimatePresence initial={false}>
          {entries.length === 0 ? (
            <EmptyState
              icon={<PieChart className="size-6" />}
              title="No expenses logged"
              description="Track every purchase to keep the challenge alive."
            />
          ) : (
            entries.slice(0, 25).map((row) => {
              const cat = category(row.categoryId);
              return (
                <TimelineRow
                  key={row.id}
                  leading={cat.emoji}
                  title={row.note ?? cat.name}
                  meta={`${cat.name} · ${relativeTime(row.ts)}`}
                  onDelete={() => onDelete(row.id)}
                  trailing={
                    <span className="text-[13.5px] font-bold tabular-nums text-red-300">
                      −{formatMoney(row.amount, settings.currency)}
                    </span>
                  }
                />
              );
            })
          )}
        </AnimatePresence>
      </Card>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11.5px] text-ink3">
        <Receipt className="size-3.5" /> Entries are stored offline and survive refreshes
      </p>
    </div>
  );
}
