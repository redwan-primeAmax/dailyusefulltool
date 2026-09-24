import { useState } from 'react';
import { AlertTriangle, Plus, ShieldAlert, Target, Trash2, Wallet } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { Chip, Segmented, Slider, Stepper, TextField, Toggle } from '../../components/ui/controls';
import { CustomButton } from '../../components/CustomButton';
import { ConfirmDialog } from '../../components/Modal';
import { useOS } from '../../context/OSContext';
import { useExpenseTracker } from './useExpenseTracker';
import { formatMoney, percent } from '../../utils/format';
import type { BudgetPeriod } from '../../types';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'BRL', 'NGN'];
const EMOJIS = ['🍜', '🚕', '🛍️', '🧾', '🎬', '☕', '🏠', '💊', '📚', '🎁'];
const COLORS = ['#f97316', '#0ea5e9', '#14b8a6', '#ef4444', '#22c55e'];

/** Expense Limiter — settings screen. */
export function ExpenseSettings() {
  const { notify, goBack } = useOS();
  const expense = useExpenseTracker();
  const { settings, update, setSettings } = expense;
  const [draft, setDraft] = useState({ name: '', emoji: EMOJIS[5], color: COLORS[0] });
  const [confirm, setConfirm] = useState(false);

  const addCategory = () => {
    const name = draft.name.trim();
    if (!name) {
      notify({ title: 'Category needs a name', tone: 'warning' });
      return;
    }
    expense.addCategory(name, draft.emoji, draft.color);
    setDraft({ name: '', emoji: EMOJIS[5], color: COLORS[0] });
    notify({ title: `${name} category added`, tone: 'success' });
  };

  return (
    <ScreenShell
      title="Expense settings"
      subtitle="Challenge limit, periods & categories"
      icon={<Wallet className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="Spending challenge" description="Hard ceiling you commit not to cross.">
        <SettingsRow
          icon={<Target className="size-[17px]" />}
          label="Challenge limit"
          description={`${formatMoney(settings.limit, settings.currency)} · ${percent(
            expense.spent,
            settings.limit,
          )}% used`}
          control={
            <Stepper
              value={settings.limit}
              step={settings.limit > 500 ? 50 : 10}
              min={10}
              max={100000}
              suffix={settings.currency}
              onChange={(limit) => update({ limit })}
            />
          }
        />
        <SettingsRow
          icon={<Target className="size-[17px]" />}
          label="Fine tune"
          inline={
            <Slider
              ariaLabel="Budget limit"
              value={Math.min(5000, settings.limit)}
              min={50}
              max={5000}
              step={10}
              onChange={(limit) => update({ limit })}
              format={(v) => formatMoney(v, settings.currency)}
            />
          }
        />
        <SettingsRow
          icon={<AlertTriangle className="size-[17px]" />}
          label="Warning threshold"
          description={`Alert at ${settings.warningThreshold}% of the limit`}
          control={
            <Stepper
              value={settings.warningThreshold}
              step={5}
              min={20}
              max={100}
              suffix="%"
              onChange={(warningThreshold) => update({ warningThreshold })}
            />
          }
        />
        <SettingsRow
          icon={<ShieldAlert className="size-[17px]" />}
          label="Strict mode"
          description="Block expenses that would exceed the limit"
          control={
            <Toggle
              label="Strict mode"
              checked={settings.strictMode}
              onChange={(strictMode) => update({ strictMode })}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Period & currency">
        <SettingsRow
          icon={<Wallet className="size-[17px]" />}
          label="Budget period"
          description="When the challenge resets"
          control={
            <Segmented
              className="w-[200px]"
              size="sm"
              ariaLabel="period"
              value={settings.period}
              onChange={(period) => update({ period })}
              options={[
                { value: 'daily' as BudgetPeriod, label: 'Daily' },
                { value: 'weekly' as BudgetPeriod, label: 'Weekly' },
                { value: 'monthly' as BudgetPeriod, label: 'Monthly' },
              ]}
            />
          }
        />
        <SettingsRow
          icon={<Wallet className="size-[17px]" />}
          label="Custom currency"
          description={`Currently: ${settings.currency || '—'} · type any symbol or code (e.g. ৳, BDT, ₹, $)`}
          control={
            <input
              type="text"
              name="expense-currency"
              autoComplete="off"
              autoCorrect="off"
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
              maxLength={5}
              value={settings.currency}
              onChange={(e) => update({ currency: e.target.value.trim() || 'USD' })}
              className="w-20 rounded-xl border border-hairline bg-surface3/60 px-3 py-2 text-center text-[13px] font-bold text-ink outline-none focus:border-accent/60"
            />
          }
        />
        <SettingsRow
          label="Quick picks"
          description="Tap to set a common currency"
          inline={
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {CURRENCIES.map((code) => (
                <Chip key={code} active={settings.currency === code} onClick={() => update({ currency: code })}>
                  {code}
                </Chip>
              ))}
            </div>
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Categories">
        {settings.categories.map((category) => (
          <SettingsRow
            key={category.id}
            label={`${category.emoji}  ${category.name}`}
            description={`${expense.entries.filter((e) => e.categoryId === category.id).length} entries logged`}
            control={
              <div className="flex items-center gap-1.5">
                <div className="flex gap-1">
                  {COLORS.slice(0, 4).map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`${category.name} colour`}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          categories: settings.categories.map((c) =>
                            c.id === category.id ? { ...c, color } : c,
                          ),
                        })
                      }
                      className="tap size-5 rounded-full"
                      style={{
                        background: color,
                        outline: category.color === color ? '2px solid #fff' : 'none',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${category.name}`}
                  onClick={() => {
                    expense.removeCategory(category.id);
                    notify({ title: `${category.name} removed`, tone: 'info' });
                  }}
                  className="tap grid size-9 place-items-center rounded-full text-ink3 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            }
          />
        ))}
        <div className="space-y-3 p-4">
          <TextField
            label="New category"
            value={draft.name}
            placeholder="Groceries"
            onChange={(name) => setDraft((prev) => ({ ...prev, name }))}
          />
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {EMOJIS.map((emoji) => (
              <Chip key={emoji} active={draft.emoji === emoji} onClick={() => setDraft((p) => ({ ...p, emoji }))}>
                {emoji}
              </Chip>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Colour ${color}`}
                  onClick={() => setDraft((p) => ({ ...p, color }))}
                  className="tap size-6 rounded-full"
                  style={{ background: color, outline: draft.color === color ? '2px solid #fff' : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
            <CustomButton onClick={addCategory} leadingIcon={<Plus className="size-4" />}>
              Add category
            </CustomButton>
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Data">
        <SettingsRow
          danger
          icon={<Trash2 className="size-[17px]" />}
          label="Erase all expenses"
          description={`${expense.entries.length} entries will be deleted`}
          onClick={() => setConfirm(true)}
        />
        <SettingsRow
          icon={<Target className="size-[17px]" />}
          label="Reset challenge"
          description="Restore the 1200 weekly default"
          onClick={() => {
            setSettings({ ...settings, limit: 1200, period: 'weekly', warningThreshold: 80 });
            notify({ title: 'Challenge reset', tone: 'info' });
          }}
        />
      </SettingsGroup>

      <ConfirmDialog
        open={confirm}
        tone="danger"
        title="Erase all expenses?"
        description="Your challenge limit and categories stay, entries are deleted."
        confirmLabel="Erase"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          void expense.clearEntries();
          setConfirm(false);
          notify({ title: 'Expense history cleared', tone: 'warning' });
          goBack();
        }}
      />

      <section className="pb-2 text-center text-[11.5px] text-ink3">
        Expense Limiter · v3.2.0 · strict challenge enforcement
      </section>
    </ScreenShell>
  );
}
