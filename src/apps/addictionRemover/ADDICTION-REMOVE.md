# Addiction Remove

## Purpose
A private, offline-first self-help companion for people who want support changing a substance-related or behavioural habit. It helps users create a personal recovery plan, notice triggers, choose coping actions, check in without judgment, and contact someone they trust.

The app is not a diagnosis, treatment, counselor, withdrawal plan, or guarantee of recovery. It encourages qualified professional and peer support where appropriate. It does not claim that recovery follows a fixed number of days.

## Plan
- Choose a listed target or name any other substance, habit, or pattern.
- Choose a goal: stop, reduce, or explore change, then add an optional practical next goal.
- Record personal reasons, triggers, coping actions, and an optional trusted contact.
- Change the plan later in Settings; no streak reset is required after a difficult day.

## Support tools
- Daily mood and urge-intensity check-in, with optional reflection.
- Short grounding pause with the user's selected coping actions and optional call-to-support link.
- Non-judgmental progress view based on plan days and check-ins; a lapse does not erase progress.
- Safety information for withdrawal and urgent situations. Alcohol and benzodiazepine/sedative withdrawal may be dangerous; users are advised to involve a clinician before stopping or changing use. Opioid users are encouraged to seek medical and overdose-prevention support.

## Privacy and persistence
Plan details and check-ins are stored in the browser's IndexedDB and are not sent to a server. Browser-local data is not encrypted. Device backups include recovery settings and check-ins, so backup files should be handled carefully. Settings include a destructive action to erase the plan and all check-ins.

## Routing
- `main` → `AddictionRemoverApp`
- `settings` → `AddictionSettings`

## Data
- Settings key: `settings:addiction`
- Check-in store: `addictionCheckIns`
- Both are included in device backups and can be erased from the app's Settings.
