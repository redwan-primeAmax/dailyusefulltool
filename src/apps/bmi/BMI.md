# BMI Calculator

## Overview
Body-mass-index calculator with metric/imperial inputs, an animated result ring,
a healthy-weight range, and a category scale.

## Architecture
`BmiApp.tsx` — input sliders, normalised BMI maths, ideal-weight window.

## Buttons
| Button | Function |
| --- | --- |
| Unit segmented | Switches metric / imperial |
| Sliders | Adjust height, weight, age |

## Routing
- `main` → `BmiApp`
- `settings` → about + Danger Zone

## State
Pure calculation — no persistence.
