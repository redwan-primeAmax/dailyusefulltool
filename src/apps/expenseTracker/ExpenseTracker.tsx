import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';
import { useExpenseTracker } from './useExpenseTracker';
import { BudgetHero } from './components/BudgetHero';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { Segmented } from '../../components/ui/controls';
import { formatMoney } from '../../utils/format';
import type { BudgetPeriod } from '../../types';

/** Expense Limiter — budget challenge dashboard. */
export function ExpenseTracker() {
  const { openScreen, notify } = useOS();
  const expense = useExpenseTracker();

  return (
    <ScreenShell
      title="Expense Limiter"
      subtitle={`${formatMoney(expense.spent, expense.settings.currency)} of ${formatMoney(
        expense.settings.limit,
        expense.settings.currency,
      )} · ${expense.settings.period}`}
      icon={<Wallet className="size-[19px]" />}
      onOpenSettings={() => openScreen('expense', 'settings')}
      headerActions={
        <Segmented
          className="w-[168px]"
          size="sm"
          ariaLabel="budget-period"
          value={expense.settings.period}
          onChange={(period) => {
            expense.setPeriod(period as BudgetPeriod);
            notify({ title: `${period} challenge active`, tone: 'info' });
          }}
          options={[
            { value: 'daily' as BudgetPeriod, label: 'D' },
            { value: 'weekly' as BudgetPeriod, label: 'W' },
            { value: 'monthly' as BudgetPeriod, label: 'M' },
          ]}
        />
      }
      hero={
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        >
          <BudgetHero
            snapshot={expense.snapshot}
            settings={expense.settings}
            entriesCount={expense.periodEntries.length}
          />
        </motion.div>
      }
    >
      <ExpenseForm
        categories={expense.settings.categories}
        currency={expense.settings.currency}
        snapshot={expense.snapshot}
        strictMode={expense.settings.strictMode}
        onAdd={(payload) => {
          void expense.addExpense(payload);
          const over = expense.snapshot.spent + payload.amount > expense.settings.limit;
          notify({
            title: `${formatMoney(payload.amount, expense.settings.currency)} logged`,
            description: over ? 'You are above the challenge cap' : 'Expense saved',
            tone: over ? 'warning' : 'success',
          });
        }}
      />
      <ExpenseList
        entries={expense.entries}
        periodEntries={expense.periodEntries}
        byCategory={expense.byCategory}
        week={expense.week}
        settings={expense.settings}
        spent={expense.spent}
        category={expense.category}
        onDelete={(id) => void expense.removeEntry(id)}
      />
    </ScreenShell>
  );
}
