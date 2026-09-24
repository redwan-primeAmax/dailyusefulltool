import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppId,
  DeviceSettings,
  InstalledAppRecord,
  OSRoute,
  ScreenId,
  ToastMessage,
} from '../types';
import { DEFAULT_DEVICE, SETTINGS_KEYS, appService, seedIfFirstRun, settingsService } from '../db/trackerService';
import { APP_CATALOG } from '../apps/registry';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { uid } from '../utils/format';

interface OSContextValue {
  ready: boolean;
  persistent: boolean;
  installed: AppId[];
  installedMap: Record<AppId, InstalledAppRecord>;
  installing: Partial<Record<AppId, number>>;
  route: OSRoute | null;
  stack: OSRoute[];
  device: DeviceSettings;
  toasts: ToastMessage[];
  shadeOpen: boolean;
  immersive: boolean;
  recent: AppId[];
  launchApp: (appId: AppId) => void;
  openScreen: (appId: AppId, screen: ScreenId) => void;
  goBack: () => void;
  goHome: () => void;
  install: (appId: AppId, version: string, durationMs?: number) => Promise<void>;
  uninstall: (appId: AppId) => Promise<void>;
  setDevice: (patch: Partial<DeviceSettings>) => void;
  notify: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  setShadeOpen: (open: boolean) => void;
  setImmersive: (next: boolean) => void;
  pushRecent: (appId: AppId) => void;
  clearRecents: () => void;
  /** Re-reads installed apps + device prefs from IndexedDB. */
  refresh: () => Promise<void>;
}

const OSContext = createContext<OSContextValue | null>(null);

/**
 * Core apps are derived from the registry so the catalog stays the single
 * source of truth (a hardcoded list can otherwise drift from the catalog).
 */
const CORE_APPS: AppId[] = APP_CATALOG.filter((app) => app.core).map((app) => app.id);

export function OSProvider({ children }: { children: ReactNode }) {
  const { ready, persistent } = useIndexedDB();
  const [installed, setInstalled] = useState<InstalledAppRecord[]>([]);
  const [installing, setInstalling] = useState<Partial<Record<AppId, number>>>({});
  const [stack, setStack] = useState<OSRoute[]>([]);
  const [device, setDeviceState] = useState<DeviceSettings>(DEFAULT_DEVICE);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [shadeOpen, setShadeOpen] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [recent, setRecent] = useState<AppId[]>([]);
  const timers = useRef<number[]>([]);

  /* ----------------------------- boot ----------------------------- */

  const refresh = useCallback(async () => {
    try {
      const [records, deviceSettings] = await Promise.all([
        appService.list(),
        settingsService.device(),
      ]);
      setInstalled(records);
      setDeviceState(deviceSettings);
    } catch (error) {
      console.warn('[os] refresh failed', error);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    (async () => {
      try {
        await seedIfFirstRun();
        const [records, deviceSettings] = await Promise.all([
          appService.list(),
          settingsService.device(),
        ]);
        if (!active) return;
        setInstalled(records);
        setDeviceState(deviceSettings);
      } catch (error) {
        console.warn('[os] boot failed', error);
      }
    })();
    return () => {
      active = false;
    };
  }, [ready]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /* --------------------------- navigation -------------------------- */

  const pushRecent = useCallback((appId: AppId) => {
    setRecent((prev) => {
      const next = [appId, ...prev.filter((id) => id !== appId)];
      return next.slice(0, 4);
    });
  }, []);

  const clearRecents = useCallback(() => setRecent([]), []);

  const launchApp = useCallback(
    (appId: AppId) => {
      setShadeOpen(false);
      pushRecent(appId);
      // Re-launching the app that is already in focus must not stack a second
      // instance, otherwise the back button appears to do nothing.
      setStack((prev) => {
        const top = prev[prev.length - 1];
        if (top && top.appId === appId) return prev;
        return [...prev, { appId, screen: 'main', key: `${appId}-main-${uid()}` }];
      });
    },
    [pushRecent],
  );

  const openScreen = useCallback(
    (appId: AppId, screen: ScreenId) => {
      setShadeOpen(false);
      setStack((prev) => {
        if (prev.length === 0) return [{ appId, screen, key: `${appId}-${screen}-${uid()}` }];
        const top = prev[prev.length - 1];
        if (top.appId === appId && top.screen === screen) return prev;
        return [...prev, { appId, screen, key: `${appId}-${screen}-${uid()}` }];
      });
    },
    [],
  );

  const goBack = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  const goHome = useCallback(() => {
    setShadeOpen(false);
    setStack([]);
  }, []);

  /* ----------------------------- toasts ---------------------------- */

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = uid();
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      // Release the handle so the array cannot grow without bound.
      timers.current = timers.current.filter((t) => t !== timer);
    }, 2800);
    timers.current.push(timer);
  }, []);

  /* ---------------------------- installs --------------------------- */

  const install = useCallback(
    async (appId: AppId, version: string, durationMs = 1400) => {
      setInstalling((prev) => ({ ...prev, [appId]: 0 }));
      let cancelled = false;

      /** Animated progress. Always settles, so the spinner can never stick. */
      await new Promise<void>((resolve) => {
        const started = performance.now();
        const tick = () => {
          if (cancelled) return resolve();
          const pct = Math.min(100, ((performance.now() - started) / durationMs) * 100);
          setInstalling((prev) => ({ ...prev, [appId]: pct }));
          if (pct >= 100) return resolve();
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

      try {
        const record = await appService.install({ id: appId, version });
        if (!cancelled) {
          setInstalled((prev) => [...prev.filter((r) => r.appId !== appId), record]);
        }
      } catch (error) {
        console.error('[os] install failed', appId, error);
        notify({ title: 'Install failed', description: 'Storage may be unavailable.', tone: 'danger' });
      } finally {
        cancelled = true;
        // Always clear the spinner, even on failure.
        setInstalling((prev) => {
          const next = { ...prev };
          delete next[appId];
          return next;
        });
      }
    },
    [notify],
  );

  const uninstall = useCallback(async (appId: AppId) => {
    await appService.uninstall(appId);
    setInstalled((prev) => prev.filter((r) => r.appId !== appId));
    // Navigation deliberately stays untouched. In particular, removing an
    // app from a Store detail/profile view must leave the user in that Store
    // section instead of ejecting them home. If an app happens to be running,
    // it remains usable until the user navigates away, matching native OSes.
    setRecent((prev) => prev.filter((id) => id !== appId));
  }, []);

  /* ---------------------------- device ----------------------------- */

  const setDevice = useCallback((patch: Partial<DeviceSettings>) => {
    setDeviceState((prev) => {
      const next = { ...prev, ...patch };
      void settingsService.set(SETTINGS_KEYS.device, next);
      return next;
    });
  }, []);

  /* --------------------------- shortcuts --------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (shadeOpen) setShadeOpen(false);
        else if (stack.length) goBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stack.length, goBack, shadeOpen]);

  // Android-style back gesture: swipe right-to-left on the nav bar area.
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const onStart = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
    };
    const onEnd = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = Math.abs(e.clientY - startY);
      if (startX < 32 && dx > 90 && dy < 70 && stack.length) goBack();
    };
    window.addEventListener('pointerdown', onStart);
    window.addEventListener('pointerup', onEnd);
    return () => {
      window.removeEventListener('pointerdown', onStart);
      window.removeEventListener('pointerup', onEnd);
    };
  }, [stack.length, goBack]);

  const installedIds = useMemo(
    () => [...CORE_APPS, ...installed.map((r) => r.appId)],
    [installed],
  );

  const installedMap = useMemo(
    () =>
      installed.reduce<Record<AppId, InstalledAppRecord>>((acc, record) => {
        acc[record.appId] = record;
        return acc;
      }, {} as Record<AppId, InstalledAppRecord>),
    [installed],
  );

  const value = useMemo<OSContextValue>(
    () => ({
      ready,
      persistent,
      installed: installedIds,
      installedMap,
      installing,
      route: stack[stack.length - 1] ?? null,
      stack,
      device,
      toasts,
      shadeOpen,
      immersive,
      recent,
      launchApp,
      openScreen,
      goBack,
      goHome,
      install,
      uninstall,
      setDevice,
      notify,
      dismissToast,
      setShadeOpen,
      setImmersive,
      pushRecent,
      clearRecents,
      refresh,
    }),
    [
      ready,
      persistent,
      installedIds,
      installedMap,
      installing,
      stack,
      device,
      toasts,
      shadeOpen,
      immersive,
      recent,
      launchApp,
      openScreen,
      goBack,
      goHome,
      install,
      uninstall,
      setDevice,
      notify,
      dismissToast,
      setImmersive,
      pushRecent,
      clearRecents,
      refresh,
    ],
  );

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

export function useOS(): OSContextValue {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used inside <OSProvider>');
  return ctx;
}
