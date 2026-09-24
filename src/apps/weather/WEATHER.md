# Weather

## Overview
Simulated forecasts for every Bangladesh district and major world cities, with
a division/district browser and a 7-day trend.

## Architecture
| File | Responsibility |
| --- | --- |
| `WeatherApp.tsx` | Hero, stats, forecast, location browser |
| `bdLocations.ts` | All 64 districts + towns, deterministic weather seeding |

## Buttons
| Button | Function |
| --- | --- |
| Location | Opens the division/district browser |
| Change location | Re-opens the picker |

## Routing
- `main` → `WeatherApp`
- `settings` → about + Danger Zone

## State
Deterministic, seeded simulation — no persistence needed.
