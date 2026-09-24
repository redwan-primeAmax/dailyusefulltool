import { AnimatePresence, motion } from 'framer-motion';
import { Battery, Bluetooth, Clock, Moon, Palette, Sparkles, Sun, Wifi } from 'lucide-react';
import { CustomButton } from '../CustomButton';
import { useOS } from '../../context/OSContext';
import { APP_CATALOG, getAppManifest } from '../../apps/registry';
import { cn } from '../../utils/cn';

const WALLPAPERS = ['aurora', 'nebula', 'mint', 'sunset', 'carbon'];

/** Pull-down quick-settings shade with device toggles and app shortcuts. */
export function QuickShade() {
  const { shadeOpen, setShadeOpen, device, setDevice, installed, recent, launchApp, stack, goBack } = useOS();
  const activeApp = stack.length ? getAppManifest(stack[stack.length - 1].appId) : undefined;

  const tiles = [
    {
      label: device.darkMode ? 'Dark' : 'Light',
      Icon: device.darkMode ? Moon : Sun,
      active: device.darkMode,
      action: () => setDevice({ darkMode: !device.darkMode }),
    },
    {
      label: 'Motion',
      Icon: Sparkles,
      active: device.animations,
      action: () => setDevice({ animations: !device.animations }),
    },
    {
      label: '24-hour',
      Icon: Clock,
      active: device.clock24h,
      action: () => setDevice({ clock24h: !device.clock24h }),
    },
    { label: 'Wi-Fi', Icon: Wifi, active: true, action: () => undefined },
    { label: 'Bluetooth', Icon: Bluetooth, active: false, action: () => undefined },
    { label: 'Battery', Icon: Battery, active: false, action: () => undefined },
  ];

  return (
    <AnimatePresence>
      {shadeOpen && (
        <motion.div
          className="absolute inset-0 z-[70] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close quick settings"
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
            onClick={() => setShadeOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => info.offset.y < -80 && setShadeOpen(false)}
            className="glass relative z-10 m-2 mt-3 overflow-hidden rounded-[28px] border border-hairline p-4 shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/25" />

            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-ink">Quick settings</p>
                <p className="text-[11px] text-ink3">
                  {installed.length} apps installed · Web OS 1.0
                </p>
              </div>
              {activeApp && (
                <CustomButton size="sm" variant="tonal" onClick={goBack}>
                  Resume {activeApp.shortName}
                </CustomButton>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {tiles.map(({ label, Icon, active, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className={cn(
                    'tap flex flex-col items-start gap-2 rounded-2xl border p-3 text-left',
                    active
                      ? 'border-accent/40 bg-accent text-white'
                      : 'border-hairline bg-surface3/60 text-ink2',
                  )}
                >
                  <Icon className="size-[18px]" />
                  <span className="text-[11.5px] font-semibold">{label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink3">
                <Palette className="size-3.5" /> Wallpaper
              </p>
              <div className="flex gap-2">
                {WALLPAPERS.map((wp) => (
                  <button
                    key={wp}
                    type="button"
                    aria-label={`${wp} wallpaper`}
                    onClick={() => setDevice({ wallpaper: wp })}
                    className={cn(
                      'tap h-12 flex-1 rounded-xl border-2 wp-' + wp,
                      device.wallpaper === wp ? 'border-accent' : 'border-transparent opacity-70',
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-hairline pt-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink3">Recent apps</p>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const seen = new Set<string>();
                  const list: typeof APP_CATALOG[number][] = [];
                  for (const id of recent) {
                    if (seen.has(id)) continue;
                    const app = APP_CATALOG.find((a) => a.id === id);
                    if (app && installed.includes(id)) {
                      seen.add(id);
                      list.push(app);
                    }
                    if (list.length >= 4) break;
                  }
                  if (list.length === 0) {
                    return (
                      <p className="text-[11.5px] text-ink3">No recently opened apps yet.</p>
                    );
                  }
                  return list.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => launchApp(app.id)}
                      className="tap rounded-full border border-hairline bg-surface3/60 px-3 py-1.5 text-[11.5px] font-semibold text-ink2 hover:text-ink"
                    >
                      {app.shortName}
                    </button>
                  ));
                })()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
