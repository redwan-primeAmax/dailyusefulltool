# HTML App Previewer

## Overview
Upload a `.zip` containing a web app, choose an `.html` or `.htm` entry page, and press **Done · Preview app**. The ZIP is read and previewed locally; it is not uploaded or saved.

## Supported content
- HTML, inline and local CSS, classic JavaScript, and JavaScript modules with relative imports where possible.
- Local JavaScript libraries, stylesheets, images, icons, fonts, audio, and video stored inside the archive.
- Relative asset paths created at runtime by JavaScript, including `new Audio(...)`, media/image `src` assignments, `fetch()`, and `XMLHttpRequest`.
- Multiple HTML files, with `index.html` preferred automatically and a selector for other entry pages.
- Optional HTTPS access for CDN scripts/styles and online APIs. This is disabled by default.

Local file references are resolved relative to the selected HTML page or the stylesheet/module that uses them. ZIPs are limited to 30 MB compressed, 80 MB expanded, and 3,000 files.

## Security
The app executes uploaded JavaScript in an iframe sandbox with scripts and forms allowed, but without same-origin access, top navigation, or popups. The HTML stays inert until the archive's Blobs are handed into that frame, where local resource URLs are created; this avoids cross-origin Blob URL failures without granting the preview access to the parent origin. A Content Security Policy blocks network access unless the user opts into HTTPS access. The preview cannot access this app's storage or parent-page DOM. Only run ZIPs you trust.

Some apps that require cookies, same-origin storage, service workers, or unsupported module/package resolution may not work in this isolated client-side preview.

## State and routing
- `main` → `HtmlPreviewApp`
- ZIP contents and iframe-scoped object URLs live only in memory and are released when the preview is closed or the app is left.
- No settings screen or persistent user data is used.
