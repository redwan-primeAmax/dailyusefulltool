import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { AppIcon } from './ui/AppIcon';
import { useOS } from '../context/OSContext';
import { APP_CATALOG } from '../apps/registry';
import { useClock } from '../hooks/useResponsive';
import { formatClock } from '../utils/date';

export function Launcher() {
  const { installed, launchApp, device } = useOS();
  const now = useClock(10_000);
  const [query, setQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  const installedApps = useMemo(
    () => APP_CATALOG.filter((a) => installed.includes(a.id)),
    [installed],
  );

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return installedApps;
    return installedApps.filter(
      (a) => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.shortName.toLowerCase().includes(q),
    );
  }, [installedApps, query]);

  const closeSearch = () => { setSearchActive(false); setQuery(''); };

  const hour = now.getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isEvening = hour >= 18 || hour < 5;
  const heroGradient = isEvening
    ? 'from-slate-900/70 via-teal-950/50 to-slate-900/50'
    : isMorning
      ? 'from-amber-400/30 via-sky-600/20 to-amber-300/20'
      : 'from-sky-400/20 via-cyan-500/30 to-teal-400/20';

  return (
    <div className="relative flex h-full min-h-0 flex-col select-none">
      {/* Hero header with dynamic gradient */}
      <section className={`relative overflow-hidden px-6 pt-8 pb-6 bg-gradient-to-br ${heroGradient}`}>
        {/* Decorative background orbs */}
        <div className="absolute top-[-40px] right-[-30px] size-36 rounded-full bg-gradient-to-br from-teal-400/30 to-cyan-400/20 blur-2xl" />
        <div className="absolute bottom-[-20px] left-[-20px] size-28 rounded-full bg-gradient-to-tr from-amber-300/20 to-emerald-300/10 blur-xl" />

        <div className="relative z-10">
          <h1 className="text-[32px] font-extralight leading-[0.95] tracking-tight text-white drop-shadow-xl pt-4">
            {formatClock(now, device.clock24h)}
            <span className="block text-[13px] font-medium text-white/50 mt-2 tracking-normal">
              {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </h1>
        </div>
      </section>

      {/* Search */}
      <div className="px-5 -mt-3 mb-2 relative z-10">
        <div className="flex items-center gap-3 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/15 px-4.5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.15)]">
          <Search className="size-[18px] text-white/70" />
          <input
            type="search"
            name="launcher-search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchActive(true)}
            placeholder="Search apps, settings & more…"
            className="flex-1 bg-transparent text-[14px] font-medium text-white outline-none placeholder:text-white/40"
          />
          <AnimatePresence>
            {(searchActive || query) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                type="button"
                onClick={closeSearch}
                className="tap rounded-full bg-white/15 p-1.5 hover:bg-white/25"
              >
                <X className="size-4 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main content */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
        <AnimatePresence mode="wait">
          {searchActive || query ? (
            <motion.div key="search-results" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-5 pt-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[22px] font-semibold text-white">
                  {filteredApps.length} result{filteredApps.length !== 1 ? 's' : ''}
                </h2>
                <button type="button" onClick={closeSearch} className="text-[12px] font-semibold text-white/60 hover:text-white">Clear</button>
              </div>

              {filteredApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <p className="text-[32px]">🕵️</p>
                  <p className="text-[15px] font-semibold text-white/80">No matches</p>
                  <p className="text-[12px] text-white/40">Try a different search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 justify-items-center gap-x-3 gap-y-6">
                  {filteredApps.map((app, i) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(i * 0.025, 0.25), type: 'spring', stiffness: 300, damping: 22 }}
                    >
                      <AppIcon
                        icon={app.icon}
                        gradient={app.gradient}
                        label={app.shortName}
                        size="lg"
                        onClick={() => { closeSearch(); launchApp(app.id); }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="home-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 pt-2">
              {/* Grid */}
              <div className="grid grid-cols-4 justify-items-center gap-x-3 gap-y-7 pt-4">
                {installedApps.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, scale: 0.85, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: Math.min(i * 0.025, 0.35),
                      type: 'spring',
                      stiffness: 340,
                      damping: 22,
                    }}
                  >
                    <AppIcon
                      icon={app.icon}
                      gradient={app.gradient}
                      label={app.shortName}
                      size="lg"
                      onClick={() => launchApp(app.id)}
                    />
                  </motion.div>
                ))}
              </div>

              {installedApps.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-18 text-center">
                  <p className="text-[30px]">📱</p>
                  <p className="text-[15px] font-semibold text-white/70">No apps installed</p>
                  <p className="text-[12px] text-white/35 leading-relaxed max-w-[200px]">
                    Open the Play Store to browse and install mini-apps.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
