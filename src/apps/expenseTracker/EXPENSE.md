# Expense Limiter

## Overview
Budget-challenge tracker that enforces a hard spending cap, with strict-mode
blocking, category breakdown, daily burn chart, and custom currency.

## Architecture
| File | Responsibility |
| --- | --- |
| `useExpenseTracker.ts` | Settings, entries, budget maths, projection |
| `components/BudgetHero.tsx` | Status ring, threshold bar, daily allowance |
| `components/ExpenseForm.tsx` | Quick logger with over-limit guard |
| `components/ExpenseList.tsx` | Category split, burn chart, history |
| `ExpenseSettings.tsx` | Limit, custom currency, periods, categories |

## Buttons
| Button | Function |
| --- | --- |
| Log an expense | Opens the quick-logger sheet |
| Period segmented | Switches daily / weekly / monthly |
| Settings gear | Limit, currency, threshold, strict mode |

## Routing
- `main` → `ExpenseTracker`
- `settings` → `ExpenseSettings`

## State
Entries persist in `expenses`; settings in `settings:expense`.
