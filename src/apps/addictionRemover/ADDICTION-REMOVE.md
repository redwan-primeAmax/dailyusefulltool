# Addiction Challenge

## Overview
A personal habit-change challenge with 7-, 14-, or 22-day durations. Choose a challenge length, enter a habit or addiction name, and follow a live countdown, progress indicator, and a different supportive message each day.

## Features
- Choose an Easy 7-day, Medium 14-day, or Hard 22-day challenge.
- View the countdown in seconds, minutes, hours, or a days-hours-minutes-seconds format.
- See a daily message and progress indicator throughout the challenge.
- Starting a new challenge resets the current countdown and day count.

## Safety
Suddenly stopping drugs or medication can be dangerous. Talk with a qualified clinician or someone you trust. This app is not a substitute for medical care.

## Privacy and storage
The challenge name, duration, and display preference are stored in this browser's IndexedDB and are not sent to a server. A device backup may include the current challenge settings.

## Routing and data
- `main` → `AddictionRemoverApp`
- Settings key: `settings:addiction`
- The retired `addictionCheckIns` store was removed during the DB v7 upgrade and is not recreated.
- Legacy recovery-plan backups are not imported into this challenge app.
