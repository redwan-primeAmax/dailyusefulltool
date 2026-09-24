import { useCallback, useMemo, useState } from 'react';
import { evaluate, formatResult, groupDigits, isBalanced, type HistoryEntry } from './calculation';
import { uid } from '../../utils/format';

/**
 * Calculator state machine. Owns the live expression, memory register,
 * history log and derived preview — no rendering concerns.
 */
export function useCalculator() {
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [memory, setMemory] = useState(0);
  const [justEvaluated, setJustEvaluated] = useState(false);

  /** Live result preview shown under the expression. */
  const preview = useMemo(() => {
    if (!expression || !isBalanced(expression)) return '';
    const value = evaluate(expression);
    if (!Number.isFinite(value)) return '';
    const formatted = formatResult(value);
    return formatted === expression ? '' : formatted;
  }, [expression]);

  const display = useMemo(() => {
    if (!expression) return '0';
    return expression;
  }, [expression]);

  const append = useCallback((token: string) => {
    setExpression((prev) => {
      // Typing a digit right after "=" starts a fresh calculation.
      if (justEvaluated && /[0-9.]/.test(token)) {
        setJustEvaluated(false);
        return token;
      }
      setJustEvaluated(false);
      const last = prev.at(-1) ?? '';
      // Collapse consecutive operators.
      if ('+-×÷^%'.includes(token) && '+-×÷^%'.includes(last)) {
        return prev.slice(0, -1) + token;
      }
      return prev + token;
    });
  }, [justEvaluated]);

  const clear = useCallback(() => {
    setExpression('');
    setJustEvaluated(false);
  }, []);

  const backspace = useCallback(() => {
    setExpression((prev) => prev.slice(0, -1));
    setJustEvaluated(false);
  }, []);

  const toggleSign = useCallback(() => {
    setExpression((prev) => {
      if (!prev) return '-';
      const match = prev.match(/(-?\d*\.?\d+)$/);
      if (!match) return prev;
      const number = match[1];
      const head = prev.slice(0, prev.length - number.length);
      const flipped = number.startsWith('-') ? number.slice(1) : `-${number}`;
      return head + flipped;
    });
  }, []);

  const percent = useCallback(() => {
    setExpression((prev) => {
      const match = prev.match(/(\d*\.?\d+)$/);
      if (!match) return prev;
      const number = match[1];
      const head = prev.slice(0, prev.length - number.length);
      return `${head}(${number}/100)`;
    });
  }, []);

  const equals = useCallback(() => {
    if (!expression || !isBalanced(expression)) return;
    const value = evaluate(expression);
    const result = formatResult(value);
    setHistory((prev) => [
      { id: uid(), expression, result, ts: Date.now() },
      ...prev,
    ].slice(0, 60));
    setExpression(result === 'Error' ? '' : result);
    setJustEvaluated(true);
  }, [expression]);

  const wrapFunction = useCallback((fn: string) => {
    setExpression((prev) => `${fn}(${prev})`);
    setJustEvaluated(false);
  }, []);

  const memoryAdd = useCallback(() => {
    const value = evaluate(expression);
    if (Number.isFinite(value)) setMemory((m) => m + value);
  }, [expression]);

  const memorySubtract = useCallback(() => {
    const value = evaluate(expression);
    if (Number.isFinite(value)) setMemory((m) => m - value);
  }, [expression]);

  const memoryRecall = useCallback(() => {
    setExpression((prev) => prev + formatResult(memory));
  }, [memory]);

  const memoryClear = useCallback(() => setMemory(0), []);

  const clearHistory = useCallback(() => setHistory([]), []);

  const recallHistory = useCallback((entry: HistoryEntry) => {
    setExpression(entry.result);
    setJustEvaluated(true);
  }, []);

  return {
    expression,
    display,
    grouped: groupDigits(display),
    preview,
    history,
    memory,
    append,
    clear,
    backspace,
    toggleSign,
    percent,
    equals,
    wrapFunction,
    memoryAdd,
    memorySubtract,
    memoryRecall,
    memoryClear,
    clearHistory,
    recallHistory,
  };
}

export type CalculatorState = ReturnType<typeof useCalculator>;
