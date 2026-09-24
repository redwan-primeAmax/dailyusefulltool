import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { CustomButton } from '../../../components/CustomButton';
import { Modal } from '../../../components/Modal';
import { Chip, Segmented, TextField } from '../../../components/ui/controls';
import { formatVolume, mlToOz, ozToMl } from '../../../utils/format';
import type { VolumeUnit, WaterQuickAdd } from '../../../types';

export interface QuickAddBarProps {
  quickAdds: WaterQuickAdd[];
  unit: VolumeUnit;
  onAdd: (ml: number, container?: string) => void;
  onUndo: () => void;
  canUndo: boolean;
}

/** Quick-add chips + custom amount sheet. */
export function QuickAddBar({ quickAdds, unit, onAdd, onUndo, canUndo }: QuickAddBarProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('300');
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [presetMl, setPresetMl] = useState(250);

  const commit = () => {
    const ml = mode === 'custom' ? ozToMlOrMl(amount, unit) : presetMl;
    if (ml > 0) onAdd(ml, 'Custom');
    setOpen(false);
    setAmount('300');
  };

  return (
    <div className="space-y-3">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {quickAdds.map((preset, index) => (
          <motion.div
            key={preset.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <Chip active={false} onClick={() => onAdd(preset.ml, preset.label)} className="h-11 px-4">
              <Plus className="size-4 text-sky-300" />
              <span className="font-bold">{formatVolume(preset.ml, unit)}</span>
              <span className="text-ink3">{preset.label}</span>
            </Chip>
          </motion.div>
        ))}
        <Chip onClick={() => setOpen(true)} className="h-11 border-dashed px-4">
          <Sparkles className="size-4 text-accent" />
          Custom
        </Chip>
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-[12px] text-ink3">Tap a preset to log instantly</p>
        <AnimatePresence>
          {canUndo && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={onUndo}
              className="tap rounded-full bg-accentsoft px-3 py-1.5 text-[12px] font-bold text-accent"
            >
              Undo last
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Log custom amount"
        description="Add any volume — it counts toward today's total."
        sheet
        footer={
          <>
            <CustomButton variant="ghost" fullWidth onClick={() => setOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton fullWidth onClick={commit}>
              Add
            </CustomButton>
          </>
        }
      >
        <div className="space-y-4">
          <Segmented
            ariaLabel="custom-mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'preset', label: 'Presets' },
              { value: 'custom', label: 'Exact' },
            ]}
          />
          {mode === 'preset' ? (
            <div className="flex flex-wrap gap-2">
              {[150, 200, 250, 330, 500, 750, 1000].map((ml) => (
                <Chip key={ml} active={presetMl === ml} onClick={() => setPresetMl(ml)}>
                  {formatVolume(ml, unit)}
                </Chip>
              ))}
            </div>
          ) : (
            <TextField
              label={unit === 'ml' ? 'Millilitres' : 'Fluid ounces'}
              value={amount}
              onChange={setAmount}
              suffix={unit}
              type="decimal"
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

const ozToMlOrMl = (raw: string, unit: VolumeUnit) => {
  const parsed = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(unit === 'oz' ? ozToMl(parsed) : parsed);
};

export { mlToOz };
