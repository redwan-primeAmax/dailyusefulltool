import { useEffect, useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { CustomButton } from '../../../components/CustomButton';
import { Modal } from '../../../components/Modal';
import { Chip, TextField } from '../../../components/ui/controls';
import { formatMoney } from '../../../utils/format';
import type { BudgetSnapshot } from '../useExpenseTracker';
import type { ExpenseCategory } from '../../../types';

export interface ExpenseFormProps {
  categories: ExpenseCategory[];
  currency: string;
  snapshot: BudgetSnapshot;
  strictMode: boolean;
  onAdd: (payload: { amount: number; categoryId: string; note?: string }) => void;
}

/** Quick expense logger with an over-limit guard. */
export function ExpenseForm({ categories, currency, snapshot, strictMode, onAdd }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 'c1');
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setCategoryId(categories[0]?.id ?? 'c1');
  }, [categories]);

  const parsed = Number.parseFloat(amount.replace(',', '.'));
  const valid = Number.isFinite(parsed) && parsed > 0;
  const wouldExceed = valid && snapshot.spent + parsed > snapshot.limit;
  const inWarning = valid && snapshot.pct >= 100;

  const submit = () => {
    if (!valid) return;
    if (wouldExceed && strictMode) {
      setBlocked(true);
      return;
    }
    onAdd({ amount: parsed, categoryId, note: note.trim() || undefined });
    setAmount('');
    setNote('');
    setOpen(false);
  };

  return (
    <>
      <CustomButton
        fullWidth
        size="lg"
        onClick={() => setOpen(true)}
        leadingIcon={<Plus className="size-[18px]" />}
        className="shadow-xl"
      >
        Log an expense
      </CustomButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New expense"
        description={`Spent ${formatMoney(snapshot.spent, currency)} of ${formatMoney(snapshot.limit, currency)}`}
        sheet
        footer={
          <>
            <CustomButton variant="ghost" fullWidth onClick={() => setOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton
              fullWidth
              disabled={!valid}
              onClick={submit}
              variant={wouldExceed ? 'danger' : 'primary'}
            >
              {wouldExceed ? 'Check limit' : 'Add expense'}
            </CustomButton>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            label="Amount"
            value={amount}
            onChange={setAmount}
            suffix={currency}
            type="decimal"
            placeholder="0.00"
          />
          <div>
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-ink3">
              Category
            </span>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <Chip key={category.id} active={categoryId === category.id} onClick={() => setCategoryId(category.id)}>
                  <span>{category.emoji}</span>
                  {category.name}
                </Chip>
              ))}
            </div>
          </div>
          <TextField label="Note (optional)" value={note} onChange={setNote} placeholder="Coffee with team" />
          {valid && (
            <div
              className={`rounded-2xl border p-3 text-[12px] leading-relaxed ${
                wouldExceed || inWarning
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              {wouldExceed || inWarning
                ? `Heads up: this puts you at ${formatMoney(
                    snapshot.spent + parsed,
                    currency,
                  )} — above your ${formatMoney(snapshot.limit, currency)} challenge cap.`
                : `You'll have ${formatMoney(snapshot.limit - snapshot.spent - parsed, currency)} remaining.`}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={blocked}
        onClose={() => setBlocked(false)}
        title="Limit reached"
        description="This expense would break your spending challenge."
        tone="danger"
        footer={
          <>
            <CustomButton variant="ghost" fullWidth onClick={() => setBlocked(false)}>
              Don't add
            </CustomButton>
            <CustomButton
              variant="danger"
              fullWidth
              onClick={() => {
                setBlocked(false);
                setOpen(false);
                onAdd({ amount: parsed, categoryId, note: note.trim() || undefined });
                setAmount('');
                setNote('');
              }}
            >
              Add anyway
            </CustomButton>
          </>
        }
      >
        <p className="flex items-center gap-2">
          <Receipt className="size-4 text-ink3" />
          Strict mode is on, so the limiter blocked the entry. Disable strict mode in settings to allow
          over-budget logging.
        </p>
      </Modal>
    </>
  );
}
