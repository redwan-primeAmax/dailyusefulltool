/**
 * Calculator engine — pure, dependency-free arithmetic.
 * Tokenises an infix expression, converts to RPN (shunting-yard) and
 * evaluates it. Kept free of React so it can be unit-tested in isolation.
 */

export type TokenType = 'number' | 'operator' | 'lparen' | 'rparen' | 'function' | 'constant';

export interface Token {
  type: TokenType;
  value: string;
}

export const OPERATORS: Record<string, { precedence: number; rightAssoc: boolean; apply: (a: number, b: number) => number }> = {
  '+': { precedence: 1, rightAssoc: false, apply: (a, b) => a + b },
  '-': { precedence: 1, rightAssoc: false, apply: (a, b) => a - b },
  '*': { precedence: 2, rightAssoc: false, apply: (a, b) => a * b },
  '/': { precedence: 2, rightAssoc: false, apply: (a, b) => (b === 0 ? NaN : a / b) },
  '%': { precedence: 2, rightAssoc: false, apply: (a, b) => (b === 0 ? NaN : a % b) },
  '^': { precedence: 3, rightAssoc: true, apply: (a, b) => a ** b },
};

export const FUNCTIONS: Record<string, (x: number) => number> = {
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  ln: (x) => (x > 0 ? Math.log(x) : NaN),
  log: (x) => (x > 0 ? Math.log10(x) : NaN),
  sqrt: (x) => (x >= 0 ? Math.sqrt(x) : NaN),
  abs: (x) => Math.abs(x),
  exp: (x) => Math.exp(x),
};

export const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

/** Splits a raw expression string into tokens. */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const src = input.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

  while (i < src.length) {
    const char = src[i];

    // Numbers (including decimals)
    if (/[0-9.]/.test(char)) {
      let num = '';
      while (i < src.length && /[0-9.]/.test(src[i])) num += src[i++];
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Identifiers → functions or constants
    if (/[a-z]/i.test(char)) {
      let word = '';
      while (i < src.length && /[a-z]/i.test(src[i])) word += src[i++].toLowerCase();
      if (word in FUNCTIONS) tokens.push({ type: 'function', value: word });
      else if (word in CONSTANTS) tokens.push({ type: 'constant', value: word });
      continue;
    }

    if (char === '(') { tokens.push({ type: 'lparen', value: char }); i++; continue; }
    if (char === ')') { tokens.push({ type: 'rparen', value: char }); i++; continue; }

    if (char in OPERATORS) {
      // Unary minus → treat as 0 - x
      const prev = tokens[tokens.length - 1];
      const isUnary = char === '-' && (!prev || prev.type === 'operator' || prev.type === 'lparen');
      if (isUnary) tokens.push({ type: 'number', value: '0' });
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }

    i++; // skip unknown characters
  }

  return tokens;
}

/** Shunting-yard: infix tokens → reverse Polish notation. */
export function toRPN(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'number':
      case 'constant':
        output.push(token);
        break;
      case 'function':
        stack.push(token);
        break;
      case 'operator': {
        const op = OPERATORS[token.value];
        while (stack.length) {
          const top = stack[stack.length - 1];
          if (top.type === 'function') { output.push(stack.pop() as Token); continue; }
          if (top.type !== 'operator') break;
          const topOp = OPERATORS[top.value];
          const shouldPop = op.rightAssoc
            ? topOp.precedence > op.precedence
            : topOp.precedence >= op.precedence;
          if (!shouldPop) break;
          output.push(stack.pop() as Token);
        }
        stack.push(token);
        break;
      }
      case 'lparen':
        stack.push(token);
        break;
      case 'rparen':
        while (stack.length && stack[stack.length - 1].type !== 'lparen') {
          output.push(stack.pop() as Token);
        }
        stack.pop(); // discard '('
        if (stack.length && stack[stack.length - 1].type === 'function') {
          output.push(stack.pop() as Token);
        }
        break;
    }
  }

  while (stack.length) {
    const token = stack.pop() as Token;
    if (token.type === 'lparen') continue;
    output.push(token);
  }

  return output;
}

/** Evaluates an RPN token stream. */
export function evaluateRPN(rpn: Token[]): number {
  const stack: number[] = [];

  for (const token of rpn) {
    if (token.type === 'number') {
      stack.push(Number.parseFloat(token.value));
    } else if (token.type === 'constant') {
      stack.push(CONSTANTS[token.value]);
    } else if (token.type === 'function') {
      const x = stack.pop();
      if (x === undefined) return NaN;
      stack.push(FUNCTIONS[token.value](x));
    } else if (token.type === 'operator') {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return NaN;
      stack.push(OPERATORS[token.value].apply(a, b));
    }
  }

  return stack.length === 1 ? stack[0] : NaN;
}

/** Full pipeline: expression string → numeric result. */
export function evaluate(expression: string): number {
  if (!expression.trim()) return 0;
  try {
    return evaluateRPN(toRPN(tokenize(expression)));
  } catch {
    return NaN;
  }
}

/** Formats a result for display, trimming float noise and using exponents when huge. */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e12 || abs < 1e-9) return value.toExponential(6).replace(/e([+-])(\d)$/, 'e$10$2');
  const rounded = Number.parseFloat(value.toPrecision(12));
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 10, useGrouping: false });
}

/** Adds thousands separators to the integer part of a display string. */
export function groupDigits(display: string): string {
  if (display === 'Error') return display;
  const [head, tail] = display.split('.');
  const sign = head.startsWith('-') ? '-' : '';
  const digits = sign ? head.slice(1) : head;
  if (!/^\d+$/.test(digits)) return display;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${grouped}${tail !== undefined ? `.${tail}` : ''}`;
}

/** True when the expression has balanced parentheses (used to enable "="). */
export function isBalanced(expression: string): boolean {
  let depth = 0;
  for (const char of expression) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  ts: number;
}
