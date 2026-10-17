# Exam Tracker

## Overview
Exam Tracker organises exam preparation by subject and category. The Home page
shows completed work and remaining readiness; Today's Plan schedules the first
unfinished category from each subject. A full-screen liquid transition opens
the daily plan from the animated Start Study button.

## Navigation
- **Home** — animated overall progress, a two-column subject grid, OVR remaining
  rating, and Start Study.
- **Today's Plan** — one next unfinished category for each subject, with study
  instructions, topics, suggested minutes, and completion tracking.
- **Add Subject** — category presets, a copyable JSON template, pasted JSON
  validation, optional Gemini generation, and subject management.
- **Settings** — Gemini API key, connection test, fixed model name, and a
  tracker-only reset.

All interface labels, messages, prompts, and navigation are in English.

## Subject JSON Format
```json
{
  "subject": "Bengali",
  "categories": [
    {
      "name": "Essays",
      "topics": ["Structure", "Thesis statements"],
      "instructions": "Review the structure, draft a thesis, and practise one timed response.",
      "recommendedMinutes": 45
    }
  ]
}
```

The validator checks JSON syntax, the subject name, required category fields,
duplicate categories, topic types and limits, and recommended study time. It
reports specific issues and offers a dedicated copy-error-report action. Valid
JSON adds or updates the matching subject; updated categories keep their
completion history.

## Gemini API
The model is hardcoded as `gemini-3.5-flash-lite`. Requests are made directly
from the browser to Google's Gemini API. The API key is stored in the app's
IndexedDB settings document; this app does not encrypt the key. Backup exports
and imports always strip the key, so it must be entered again after a restore.

## Architecture
| File | Responsibility |
| --- | --- |
| `ExamTrackerApp.tsx` | App shell, page routing, navigation, completion actions |
| `examModel.ts` | JSON validation, progress calculations, subject normalization |
| `geminiService.ts` | Browser-side Gemini requests and error handling |
| `useExamTracker.ts` | IndexedDB settings and subject/progress updates |
| `components/` | Navigation drawer, liquid transition/progress, error report |
| `pages/` | Home, Today's Plan, Add Subject, and Settings screens |

## Persistence
Subject JSON, category progress, and the Gemini API key are stored under
`settings:exam` in IndexedDB. Resetting Exam Tracker clears that document only;
other apps and their data remain untouched.
