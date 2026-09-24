# Play Store

## Overview
The app hub. Browse installable apps, install/uninstall them, and manage your
profile (name + avatar). Every item is displayed as a rich, equal card.

## UI
- Sticky search header with profile avatar button.
- Primary tabs: **For you**, **Games**, **Apps**.
- Each app appears in exactly one shelf (Recommended / New / category), using a
  single unified card layout.
- Retired apps are removed through the startup migration and never appear in
  Store shelves, the launcher, or core-app lists.

## Buttons
| Button | Function |
| --- | --- |
| Profile avatar | Opens the profile modal (name, emoji/URL avatar, Manage Apps) |
| Install | Starts an animated install |
| Open | Launches the installed app |
| Uninstall (Manage) | Removes the app — user stays inside the Store section |

## Routing
- `main` → `StoreApp`
- `settings` → `StoreSettings`

## State
Installed-app records persist in `installedApps`; profile in `device:settings`.
Profile exports include both emoji avatars and external avatar URLs.
