# ZIP Processor

## Overview
ZIP Processor reads a user-selected archive locally in the browser. It shows every file for manual selection, preselects text/source files, and leaves binary, system, and configuration items unchecked by default. The user confirms the selection with **Done** before choosing an output.

## Selection rules
- Known binary formats and files that are not valid UTF-8 text are unchecked by default. If manually selected, their contents are represented by a short binary-file placeholder rather than decoded as text.
- Hidden files and common system/build/configuration files are listed but unchecked. This includes files such as `.env`, `.gitignore`, lockfiles, and common configuration formats.
- **Select all**, **Deselect all**, per-file toggles, and **Restore defaults** let the user change the selection.

## Output options
A. **Markdown** — combines selected file content under headings containing each full relative path.
B. **JSON** — creates an object keyed by selected file paths.
C. **Names as paragraphs** — writes one selected file name per plain-text paragraph.
D. **Names as Markdown** — writes selected file names as a Markdown bullet list, one line per file.
E. **ZIP structure** — creates a tree of every file and folder in the archive, including entries skipped from conversion and explicit empty folders.
F. **Names with full paths** — lists each selected file name alongside its full relative path.

## Privacy
Files are processed in memory in the browser. The archive and its contents are not uploaded or persisted by this app.
