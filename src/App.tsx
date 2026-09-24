import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OSProvider, useOS } from './context/OSContext';
import { ReaderSessionProvider } from './context/ReaderSessionContext';
import { Launcher } from './components/Launcher';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NavBar } from './components/ui/NavBar';
import { StatusBar } from './components/ui/StatusBar';
import { QuickShade } from './components/ui/QuickShade';
import { ToastStack } from './components/ui/ToastStack';
import { getAppManifest } from './apps/registry';
import { useClock, useResponsive } from './hooks/useResponsive';
import { cn } from './utils/cn';
import type { OSRoute } from './types';

export default function App() {
  return (
    <OSProvider>
      <ReaderSessionProvider>
        <Device />
      </ReaderSessionProvider>
    </OSProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen router                                                      */
/* ------------------------------------------------------------------ */

function AppScreen({ route }: { route: OSRoute }) {
  const manifest = getAppManifest(route.appId);
  const screen = manifest?.screens.find((s) => s.id === route.screen) ?? manifest?.screens[0];
  if (!manifest || !screen) {
    return (
      <div className="flex h-full items-center justify-center bg-surface text-[13px] text-ink3">
        App not found or uninstalled.
      </div>
    );
  }
  const Component = screen.component;
  return (
    <ErrorBoundary name={manifest.name}>
      <Component />
    </ErrorBoundary>
  );
}

/* ------------------------------------------------------------------ */
/*  Device chassis                                                     */
/* ------------------------------------------------------------------ */

function Device() {
  const { ready, device, route, setShadeOpen } = useOS();
  const { frame } = useResponsive();
  const now = useClock(5000);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  const spring = device.animations
    ? { type: 'spring' as const, stiffness: 300, damping: 30 }
    : { duration: 0 };

  const isSettings = route?.screen === 'settings';

  const screen = (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden',
        `wp-${device.wallpaper}`,
        !device.darkMode && 'theme-light',
      )}
    >
      {/* Status bar — hidden to keep layout extremely clean and clutter-free */}
      <StatusBar
        now={now}
        clock24h={device.clock24h}
        onOpenShade={() => setShadeOpen(true)}
        hidden={true}
        label={isSettings ? 'Settings' : undefined}
      />

      {/* Content area */}
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {route ? (
            <motion.div
              key={route.key}
              initial={{ opacity: 0, x: isSettings ? 40 : 0, scale: isSettings ? 1 : 0.94, y: isSettings ? 0 : 10 }}
              animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, x: isSettings ? 40 : 0, scale: isSettings ? 1 : 0.96 }}
              transition={spring}
              className="absolute inset-0 overflow-hidden bg-surface"
            >
              <AppScreen route={route} />
            </motion.div>
          ) : (
            <motion.div
              key="launcher"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={spring}
              className="absolute inset-0"
            >
              <ErrorBoundary name="Launcher">
                <Launcher />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* System nav — always visible so the fullscreen toggle can be reached */}
      <NavBar overlay={!route} />

      {/* Global overlays */}
      <ToastStack />
      <QuickShade />

      {/* Boot splash */}
      <AnimatePresence>
        {booting && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-[#05070d]"
          >
            <div className="relative grid size-24 place-items-center">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-500/35" />
              <span className="grid size-20 place-items-center rounded-[28px] bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 shadow-2xl shadow-emerald-500/40">
                <span className="text-[22px] font-black tracking-tight text-white">WOS</span>
              </span>
            </div>
            <div className="w-44 overflow-hidden rounded-full bg-white/8">
              <motion.div
                className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
              />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/35">
              {ready ? 'Ready' : 'Loading…'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* Desktop: phone frame + sidebar */
  if (frame) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#04060c] p-6">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_55%_at_25%_20%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(55%_45%_at_80%_75%,rgba(236,72,153,0.14),transparent_60%)]" />

        {/* Sidebar info panel */}
        <aside className="mr-12 hidden max-w-[280px] lg:block">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <span className="text-[11px] font-black text-white">WOS</span>
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-white leading-tight">Web OS</h1>
              <p className="text-[11px] text-white/45">v2.0 · 16 apps available</p>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed text-white/55 mb-5">
            A fully offline Android-like operating system running in your browser — complete with a Play Store,
            16 mini-apps, and IndexedDB persistence.
          </p>

          <div className="space-y-2.5 mb-6">
            {[
              { emoji: '🏪', text: 'Play Store — install / uninstall apps' },
              { emoji: '💧', text: 'Water, Study & Expense trackers' },
              { emoji: '🧮', text: 'Calculator, Notes, To-Do, Habits' },
              { emoji: '🍅', text: 'Pomodoro, Flashcards, Breathe' },
              { emoji: '🌤️', text: 'Weather, BMI, Currency converter' },
              { emoji: '🤐', text: 'ZIP Processor & Data tools' },
              { emoji: '💾', text: 'Full data backup & restore' },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-start gap-2.5 text-[12.5px] text-white/60">
                <span className="shrink-0 text-[14px]">{emoji}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/4 p-3.5 text-[11px] text-white/35 leading-relaxed">
            <p className="font-semibold text-white/50 mb-1">Shortcuts</p>
            <p><kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Esc</kbd> — go back</p>
            <p className="mt-1">Swipe right from left edge to navigate back</p>
          </div>
        </aside>

        {/* Phone chassis */}
        <div className="relative h-[820px] max-h-[92dvh] w-[390px] shrink-0">
          {/* Outer glow */}
          <div className="absolute -inset-4 rounded-[62px] bg-gradient-to-b from-white/10 to-transparent blur-sm opacity-60" />
          {/* Shell */}
          <div className="relative h-full w-full overflow-hidden rounded-[48px] border-[8px] border-[#181c28] bg-black shadow-[0_60px_140px_-30px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)]">
            {/* Dynamic island notch */}
            <div className="pointer-events-none absolute left-1/2 top-2.5 z-[110] h-[26px] w-[114px] -translate-x-1/2 rounded-full bg-black" />
            {screen}
          </div>
          {/* Side buttons */}
          <div className="absolute -right-[10px] top-24 h-16 w-[5px] rounded-r-full bg-[#181c28]" />
          <div className="absolute -left-[10px] top-20 h-10 w-[5px] rounded-l-full bg-[#181c28]" />
          <div className="absolute -left-[10px] top-36 h-10 w-[5px] rounded-l-full bg-[#181c28]" />
          <div className="absolute -left-[10px] top-52 h-14 w-[5px] rounded-l-full bg-[#181c28]" />
        </div>
      </div>
    );
  }

  return <div className="h-dvh w-full overflow-hidden">{screen}</div>;
}
