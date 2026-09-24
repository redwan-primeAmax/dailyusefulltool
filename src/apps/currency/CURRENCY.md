# Currency

## Overview
Instant conversion across 50+ world currencies against USD, with quick-amount
chips and an animated swap.

## Architecture
`CurrencyApp.tsx` — converter card, quick chips, dual picker lists. Rates are
indicated relative to USD.

## Buttons
| Button | Function |
| --- | --- |
| Swap | Exchanges the from/to pair |
| Quick chip | Sets the principal amount |
| Picker row | Switches the from/to currency |

## Routing
- `main` → `CurrencyApp`
- `settings` → about + Danger Zone

## State
Pure calculation from a static rate table.
