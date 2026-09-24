import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

/* ─────────────────────────────────────────────────────────────────────── */
/*  Register the Service Worker for full offline support                 */
/* ─────────────────────────────────────────────────────────────────────── */

if ('serviceWorker' in navigator) {
  const swUrl = '/sw.js';

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl, { scope: '/' })
      .then((reg) => {
        console.log('[PWA] Service Worker registered, scope:', reg.scope);

        // Listen for a newer version waiting to activate.
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // A new version is ready — prompt the user to reload.
              console.log('[PWA] New content available — reloading.');
              newWorker.postMessage('skip-waiting');
            }
          });
        });
      })
      .catch((err) => console.warn('[PWA] SW registration failed:', err));

    // When a new SW activates and takes control, reload the page for clean state.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
