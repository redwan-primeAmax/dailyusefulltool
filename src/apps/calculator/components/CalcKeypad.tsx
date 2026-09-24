import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { CalculatorState } from '../useCalculator';

type KeyKind = 'fn' | 'op' | 'num' | 'eq' | 'del' | 'sci';

interface KeyDef {
  label: string;
  kind: KeyKind;
  action: () => void;
  wide?: boolean;
  aria?: string;
}

const STYLES: Record<KeyKind, string> = {
  fn: 'bg-white/[0.09] text-teal-300 font-semibold hover:bg-white/[0.14]',
  op: 'bg-white/[0.13] text-white font-bold hover:bg-white/20',
  num: 'bg-white/[0.06] text-white font-semibold hover:bg-white/[0.11]',
  eq: 'bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950 font-black shadow-lg shadow-teal-500/25',
  del: 'bg-white/[0.09] text-amber-300 font-semibold hover:bg-white/[0.14]',
  sci: 'bg-white/[0.04] text-white/70 font-medium text-[13px] hover:bg-white/[0.09]',
};

export function CalcKeypad({ calc, scientific }: { calc: CalculatorState; scientific: boolean }) {
  const sciRow: KeyDef[] = [
    { label: 'sin', kind: 'sci', action: () => calc.wrapFunction('sin') },
    { label: 'cos', kind: 'sci', action: () => calc.wrapFunction('cos') },
    { label: 'tan', kind: 'sci', action: () => calc.wrapFunction('tan') },
    { label: 'ln', kind: 'sci', action: () => calc.wrapFunction('ln') },
    { label: 'log', kind: 'sci', action: () => calc.wrapFunction('log') },
  ];

  const sciRow2: KeyDef[] = [
    { label: '√', kind: 'sci', action: () => calc.wrapFunction('sqrt'), aria: 'Square root' },
    { label: 'x²', kind: 'sci', action: () => calc.append('^2'), aria: 'Squared' },
    { label: 'xʸ', kind: 'sci', action: () => calc.append('^'), aria: 'Power' },
    { label: 'π', kind: 'sci', action: () => calc.append('pi'), aria: 'Pi' },
    { label: 'e', kind: 'sci', action: () => calc.append('e'), aria: "Euler's number" },
  ];

  const memRow: KeyDef[] = [
    { label: 'MC', kind: 'sci', action: calc.memoryClear, aria: 'Memory clear' },
    { label: 'MR', kind: 'sci', action: calc.memoryRecall, aria: 'Memory recall' },
    { label: 'M+', kind: 'sci', action: calc.memoryAdd, aria: 'Memory add' },
    { label: 'M−', kind: 'sci', action: calc.memorySubtract, aria: 'Memory subtract' },
    { label: '( )', kind: 'sci', action: () => calc.append('('), aria: 'Parenthesis' },
  ];

  const grid: KeyDef[] = [
    { label: 'AC', kind: 'fn', action: calc.clear },
    { label: '+/−', kind: 'fn', action: calc.toggleSign, aria: 'Toggle sign' },
    { label: '%', kind: 'fn', action: calc.percent },
    { label: '÷', kind: 'op', action: () => calc.append('÷') },

    { label: '7', kind: 'num', action: () => calc.append('7') },
    { label: '8', kind: 'num', action: () => calc.append('8') },
    { label: '9', kind: 'num', action: () => calc.append('9') },
    { label: '×', kind: 'op', action: () => calc.append('×') },

    { label: '4', kind: 'num', action: () => calc.append('4') },
    { label: '5', kind: 'num', action: () => calc.append('5') },
    { label: '6', kind: 'num', action: () => calc.append('6') },
    { label: '−', kind: 'op', action: () => calc.append('-') },

    { label: '1', kind: 'num', action: () => calc.append('1') },
    { label: '2', kind: 'num', action: () => calc.append('2') },
    { label: '3', kind: 'num', action: () => calc.append('3') },
    { label: '+', kind: 'op', action: () => calc.append('+') },

    { label: '⌫', kind: 'del', action: calc.backspace, aria: 'Delete' },
    { label: '0', kind: 'num', action: () => calc.append('0') },
    { label: '.', kind: 'num', action: () => calc.append('.') },
    { label: '=', kind: 'eq', action: calc.equals },
  ];

  return (
    <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
      {scientific && (
        <div className="space-y-2">
          {[memRow, sciRow, sciRow2].map((row, ri) => (
            <div key={ri} className="grid grid-cols-5 gap-2">
              {row.map((key) => (
                <KeyButton key={key.label} def={key} compact />
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="grid flex-1 grid-cols-4 gap-2">
        {grid.map((key) => (
          <KeyButton key={key.label} def={key} />
        ))}
      </div>
    </div>
  );
}

function KeyButton({ def, compact }: { def: KeyDef; compact?: boolean }) {
  return (
    <motion.button
      type="button"
      aria-label={def.aria ?? def.label}
      onClick={def.action}
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={cn(
        'grid place-items-center rounded-2xl transition-colors',
        compact ? 'h-10 text-[13px]' : 'h-full min-h-[58px] text-[21px]',
        STYLES[def.kind],
      )}
    >
      {def.label === '⌫' ? <Delete className="size-5" /> : def.label}
    </motion.button>
  );
}
