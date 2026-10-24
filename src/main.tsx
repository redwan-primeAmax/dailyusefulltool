import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

/* Keep the installed service worker network-only: static files are never cached
   for offline use, and each request is fetched fresh from the network. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    const appBaseUrl = new URL(import.meta.env.BASE_URL, document.baseURI);
    const appScope = appBaseUrl.pathname.endsWith('/') ? appBaseUrl.pathname : `${appBaseUrl.pathname}/`;

    navigator.serviceWorker
      .register(new URL('sw.js', appBaseUrl), { scope: appScope, updateViaCache: 'none' })
      .then((registration) => {
        console.info('[assets] Network-only service worker active.');
        void registration.update().catch((error: unknown) => {
          console.warn('[assets] Could not check for a newer service worker:', error);
        });
      })
      .catch((error: unknown) => {
        console.warn('[assets] Service worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
