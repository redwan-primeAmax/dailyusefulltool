import { AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { CircularProgress } from '../../../components/CircularProgress';
import { ProgressBar } from '../../../components/ui/DataViz';
import { formatMoney, percent } from '../../../utils/format';
import type { BudgetSnapshot } from '../useExpenseTracker';
import type { ExpenseSettings } from '../../../types';

const STATUS_STYLE = {
  safe: { text: 'text-emerald-300', bg: 'bg-emerald-500/15', label: 'Within limit', Icon: ShieldCheck, tone: 'good' as const },
  warning: { text: 'text-amber-300', bg: 'bg-amber-500/15', label: 'Approaching limit', Icon: AlertTriangle, tone: 'warn' as const },
  critical: { text: 'text-orange-300', bg: 'bg-orange-500/15', label: 'Critical spending', Icon: AlertTriangle, tone: 'warn' as const },
  over: { text: 'text-red-300', bg: 'bg-red-500/15', label: 'Limit exceeded', Icon: AlertTriangle, tone: 'bad' as const },
};

export interface BudgetHeroProps {
  snapshot: BudgetSnapshot;
  settings: ExpenseSettings;
  entriesCount: number;
}

/** Challenge dashboard hero: ring, status pill, threshold bar. */
export function BudgetHero({ snapshot, settings, entriesCount }: BudgetHeroProps) {
  const style = STATUS_STYLE[snapshot.status];
  const { Icon } = style;
  const spentStr = formatMoney(snapshot.spent, settings.currency);
  const limitStr = formatMoney(settings.limit, settings.currency);
  // Shrink the amount font as the currency string gets longer so it never overflows the ring.
  const spentSize = spentStr.length > 11 ? 'text-[21px]' : spentStr.length > 8 ? 'text-[25px]' : 'text-[30px]';
  const limitSize = limitStr.length > 11 ? 'text-[10px]' : 'text-[12px]';

  return (
    <div className="flex flex-col items-center gap-5 px-4 pb-2 pt-6">
      <CircularProgress
        value={Math.min(1, snapshot.ratio)}
        size={214}
        thickness={18}
        from={snapshot.status === 'safe' ? '#34d399' : snapshot.status === 'warning' ? '#fbbf24' : '#fb7185'}
        to={snapshot.status === 'safe' ? '#22d3ee' : snapshot.status === 'warning' ? '#f97316' : '#ef4444'}
        gradientId="budget-ring"
        trackClassName="stroke-white/8"
      >
        <div className="flex w-[150px] flex-col items-center">
          <span className={`break-words text-center font-bold leading-none tracking-tight text-ink tabular-nums ${spentSize}`}>
            {spentStr}
          </span>
          <span className={`mt-1.5 break-words text-center font-semibold text-ink3 ${limitSize}`}>
            of {limitStr}
          </span>
          <span className={`mt-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${style.bg} ${style.text}`}>
            {snapshot.pct}% used
          </span>
        </div>
      </CircularProgress>

      <div className="flex w-full items-center gap-3 rounded-3xl border border-hairline bg-surface2/70 p-4">
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${style.bg} ${style.text}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`break-words text-[14px] font-bold ${style.text}`}>{style.label}</p>
          <p className="break-words text-[11.5px] leading-snug text-ink3">
            {snapshot.remaining >= 0
              ? `${formatMoney(snapshot.remaining, settings.currency)} left · ${formatMoney(
                  snapshot.dailyAllowance,
                  settings.currency,
                )}/day`
              : `${formatMoney(Math.abs(snapshot.remaining), settings.currency)} over the cap`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-ink3">Entries</p>
          <p className="text-[15px] font-bold tabular-nums text-ink">{entriesCount}</p>
        </div>
      </div>

      <div className="w-full space-y-2">
        <ProgressBar
          value={Math.min(100, snapshot.pct)}
          tone={style.tone}
          height={12}
          markers={[settings.warningThreshold, 100]}
        />
        <div className="flex justify-between text-[10.5px] font-semibold text-ink3">
          <span>0</span>
          <span className="text-amber-400">{settings.warningThreshold}% warning</span>
          <span>{formatMoney(settings.limit, settings.currency)}</span>
        </div>
        <p className="flex items-center justify-center gap-1.5 pt-1 text-[11.5px] text-ink3">
          <TrendingUp className="size-3.5" />
          {settings.period} challenge · {snapshot.daysLeft} day{snapshot.daysLeft === 1 ? '' : 's'} remaining ·{' '}
          {percent(snapshot.spent, settings.limit)}% consumed
        </p>
      </div>
    </div>
  );
}
