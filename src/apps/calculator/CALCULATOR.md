# Calculator

## Overview
Chrome-free calculator surface modelled on native mobile calculators.
Arithmetic is fully decoupled from rendering.

## Architecture
| File | Responsibility |
| --- | --- |
| `calculation.ts` | Tokenizer, shunting-yard parser, RPN evaluator, formatters |
| `useCalculator.ts` | State machine: expression, memory, history |
| `components/CalcDisplay.tsx` | Expression readout + live preview |
| `components/CalcKeypad.tsx` | Key grid, scientific rows, press physics |
| `CalculatorApp.tsx` | Shell, ambient animation, history drawer |

## UI Components
- **Display**: right-aligned, auto-shrinking font (56px → 26px), grouped digits, live `= preview`.
- **Memory chip**: an `M` badge appears top-left when the memory register is non-zero.
- **Keypad**: 4×5 primary grid; scientific mode adds 3 extra rows (memory, trig, powers).

## Buttons
| Button | Function |
| --- | --- |
| AC | Clears the whole expression |
| +/− | Flips the sign of the trailing number |
| % | Wraps trailing number as `(n/100)` |
| ÷ × − + | Binary operators (consecutive operators collapse) |
| ⌫ | Deletes the last character |
| = | Evaluates and pushes to history |
| sin/cos/tan/ln/log/√ | Wrap the current expression in a function |
| x² / xʸ | Append `^2` / `^` |
| π / e | Insert constants |
| MC / MR / M+ / M− | Memory clear, recall, add, subtract |

## Routing
- `main` → `CalculatorApp`
- `settings` → about + Danger Zone

## Animations
- Display swaps with a 140 ms y-axis fade keyed on the rendered value.
- Keys use a spring `whileTap` scale of 0.93.
- Two ambient blurred orbs breathe on 9 s and 11 s loops.
- History drawer springs open to 168 px.

## State
`useCalculator` owns `expression`, `history` (capped at 60), `memory`, and
`justEvaluated` so typing a digit after `=` starts fresh. Keyboard input is
bound at the shell level.
