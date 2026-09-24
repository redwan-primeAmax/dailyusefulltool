import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CloudSun, Droplets, Wind, Eye, Thermometer, MapPin, Search, X, ArrowLeft } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';
import { BD_LOCATIONS, BD_DIVISIONS, seedFrom, type BdLocation } from './bdLocations';

/* ──────────────────────────────────────────────────────────────── */
/*  Deterministic simulated weather                                 */
/* ──────────────────────────────────────────────────────────────── */

const CONDITIONS = [
  { label: 'Sunny', emoji: '☀️' },
  { label: 'Partly Cloudy', emoji: '⛅' },
  { label: 'Overcast', emoji: '🌥️' },
  { label: 'Light Rain', emoji: '🌦️' },
  { label: 'Rainy', emoji: '🌧️' },
  { label: 'Thunderstorm', emoji: '⛈️' },
  { label: 'Hazy', emoji: '🌫️' },
];

const DAY_CONDITIONS = [
  { label: 'Sunny', emoji: '☀️' },
  { label: 'Partly Cloudy', emoji: '⛅' },
  { label: 'Cloudy', emoji: '☁️' },
  { label: 'Rainy', emoji: '🌧️' },
  { label: 'Stormy', emoji: '⛈️' },
];

interface WeatherData {
  condition: string;
  emoji: string;
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  visibility: number;
  high: number;
  low: number;
  forecast: { day: string; emoji: string; label: string; high: number; low: number }[];
}

function weatherFor(name: string): WeatherData {
  const s = seedFrom(name.toLowerCase());
  const s2 = seedFrom(name + 'b');
  const s3 = seedFrom(name + 'c');
  const cond = CONDITIONS[Math.floor(s * CONDITIONS.length) % CONDITIONS.length];
  const base = 24 + Math.round(s2 * 14); // 24–38 °C (BD climate)
  const forecastDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  return {
    condition: cond.label,
    emoji: cond.emoji,
    temp: base,
    feels: base + Math.round(s3 * 4 - 1),
    humidity: 55 + Math.round(s2 * 35),
    wind: 4 + Math.round(s3 * 22),
    visibility: 6 + Math.round(s * 18),
    high: base + 2 + Math.round(s3 * 3),
    low: base - 5 - Math.round(s2 * 3),
    forecast: forecastDays.map((day, i) => {
      const c = DAY_CONDITIONS[Math.floor(seedFrom(name + day) * DAY_CONDITIONS.length) % DAY_CONDITIONS.length];
      const hi = base + 1 + Math.round(seedFrom(name + day + 'h') * 5);
      return { day, emoji: c.emoji, label: c.label, high: hi, low: hi - 6 - Math.round(i * 0.5) };
    }),
  };
}

const WORLD_CITIES = ['Dhaka', 'Chattogram', 'Sylhet', 'Kolkata', 'Mumbai', 'New Delhi', 'Dubai', 'London', 'New York', 'Tokyo', 'Sydney', 'Singapore'];

/* ──────────────────────────────────────────────────────────────── */
/*  App                                                             */
/* ──────────────────────────────────────────────────────────────── */

export function WeatherApp() {
  const { openScreen } = useOS();
  const [location, setLocation] = useState<{ name: string; district?: string; division?: string }>({ name: 'Dhaka' });
  const [browsing, setBrowsing] = useState(false);

  const w = useMemo(() => weatherFor(location.name), [location.name]);
  const today = new Date();

  return (
    <ScreenShell
      title="Weather"
      subtitle={location.name}
      icon={<CloudSun className="size-4" />}
      contentClassName="!space-y-4"
      onOpenSettings={() => openScreen('weather', 'settings')}
      headerActions={
        <button
          type="button"
          onClick={() => setBrowsing(true)}
          className="tap flex items-center gap-1.5 rounded-full bg-accentsoft px-3 py-2 text-[12px] font-bold text-accent"
        >
          <MapPin className="size-3.5" /> Location
        </button>
      }
    >
      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-sky-500/25 via-blue-500/10 to-cyan-500/20 p-5">
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-sky-200/80">
            <MapPin className="size-3.5" />
            <span className="truncate">
              {location.name}
              {location.district && location.name !== location.district && <span className="text-sky-200/50"> · {location.district}</span>}
              {location.division && <span className="text-sky-200/40"> · {location.division}</span>}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-[58px] font-extralight leading-none text-white">{w.temp}°</p>
              <p className="mt-1.5 text-[14px] font-semibold text-sky-100">{w.condition}</p>
              <p className="text-[11.5px] text-sky-200/60">H:{w.high}° · L:{w.low}° · Feels {w.feels}°</p>
            </div>
            <motion.span
              key={location.name}
              initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              className="text-[72px] drop-shadow-lg"
            >
              {w.emoji}
            </motion.span>
          </div>
          <button
            type="button"
            onClick={() => setBrowsing(true)}
            className="tap mt-4 flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[12px] font-bold text-white backdrop-blur"
          >
            <MapPin className="size-3.5" /> Change location
            <span className="text-white/50">· Bangladesh & worldwide</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Droplets, label: 'Humidity', value: `${w.humidity}%`, color: '#38bdf8' },
          { icon: Wind, label: 'Wind', value: `${w.wind} km/h`, color: '#a78bfa' },
          { icon: Eye, label: 'Visibility', value: `${w.visibility} km`, color: '#34d399' },
          { icon: Thermometer, label: 'Feels Like', value: `${w.feels}°C`, color: '#fb923c' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card flex items-center gap-3 p-3.5">
            <div className="size-9 grid place-items-center rounded-xl" style={{ background: color + '22' }}>
              <Icon className="size-4" style={{ color }} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-ink">{value}</p>
              <p className="text-[10.5px] text-ink3">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Forecast */}
      <div className="card overflow-hidden">
        <div className="px-4 pt-3.5 pb-1">
          <p className="text-[11px] font-bold text-ink uppercase tracking-wider">7-Day Forecast</p>
          <p className="text-[10.5px] text-ink3">from {today.getDate() + 1} {today.toLocaleDateString(undefined, { month: 'short' })}</p>
        </div>
        <div className="divide-y divide-hairline">
          {w.forecast.map((f, i) => (
            <motion.div key={f.day} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }} className="flex items-center gap-3 px-4 py-3">
              <span className="w-9 text-[12px] font-semibold text-ink2">{f.day}</span>
              <span className="text-[17px]">{f.emoji}</span>
              <span className="flex-1 text-[12px] text-ink3">{f.label}</span>
              <span className="text-[12px] font-bold text-ink">{f.high}°</span>
              <span className="w-7 text-right text-[12px] text-ink3">{f.low}°</span>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="text-center text-[10.5px] text-ink3">Simulated data · {BD_LOCATIONS.length} Bangladesh locations supported</p>

      <LocationBrowser
        open={browsing}
        onClose={() => setBrowsing(false)}
        onPick={(loc) => { setLocation(loc); setBrowsing(false); }}
        quickCities={WORLD_CITIES}
      />
    </ScreenShell>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/*  Location browser — search + browse divisions/districts/towns     */
/* ──────────────────────────────────────────────────────────────── */

function LocationBrowser({
  open,
  onClose,
  onPick,
  quickCities,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (loc: { name: string; district?: string; division?: string }) => void;
  quickCities: string[];
}) {
  const [q, setQ] = useState('');
  const [division, setDivision] = useState<string | null>(null);

  const queryResults = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return BD_LOCATIONS.filter(
      (l) => l.name.toLowerCase().includes(s) || l.district.toLowerCase().includes(s) || l.division.toLowerCase().includes(s),
    ).slice(0, 30);
  }, [q]);

  const divisionLocations = useMemo(() => {
    if (!division) return [];
    const districts = new Set<string>();
    return BD_LOCATIONS.filter((l) => l.division === division && (districts.has(l.district) ? false : (districts.add(l.district), true)));
  }, [division]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] flex items-end sm:items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative z-10 flex max-h-[86%] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#0b1520] text-ink"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
              <button type="button" onClick={() => { setDivision(null); setQ(''); }}
                className="tap grid size-9 place-items-center rounded-full bg-white/5 text-white/70 disabled:opacity-30"
                disabled={!division}>
                <ArrowLeft className="size-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-white">{division ?? 'Choose Location'}</p>
                <p className="text-[11px] text-white/45">{division ? 'Districts in this division' : 'Bangladesh districts, towns & more'}</p>
              </div>
              <button type="button" onClick={onClose} className="tap grid size-9 place-items-center rounded-full bg-white/5 text-white/70">
                <X className="size-4" />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-white/8 p-3">
              <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3.5 py-2.5">
                <Search className="size-4 text-white/40" />
                <input
                  type="search"
                  name="weather-location-search"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search district, town or city…"
                  className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/35"
                />
                {q && (
                  <button type="button" onClick={() => setQ('')} className="text-white/50">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="no-scrollbar min-h-[220px] flex-1 overflow-y-auto pb-6">
              {q.trim() ? (
                /* Search results */
                <div className="divide-y divide-white/5">
                  {queryResults.length === 0 && (
                    <p className="py-10 text-center text-[13px] text-white/40">No locations match “{q}”</p>
                  )}
                  {queryResults.map((l: BdLocation) => (
                    <button key={`${l.district}-${l.name}`} type="button"
                      onClick={() => onPick({ name: l.name, district: l.district, division: l.division })}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-300">
                        <MapPin className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-white">
                          {l.name}{l.name !== l.district && <span className="font-normal text-white/45">, {l.district}</span>}
                        </span>
                        <span className="text-[11px] text-white/40">{l.division} Division · Bangladesh</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : division ? (
                /* Districts in selected division */
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {divisionLocations.map((l: BdLocation) => (
                      <button key={l.district} type="button"
                        onClick={() => onPick({ name: l.name, district: l.district, division: l.division })}
                        className="tap flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-left">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-300">
                          <MapPin className="size-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] font-semibold text-white">{l.district}</span>
                          <span className="text-[10.5px] text-white/40">{l.division} Division</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Quick world cities */}
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10.5px] font-bold uppercase tracking-widest text-white/35">Quick cities</p>
                    <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
                      {quickCities.map((c) => (
                        <button key={c} type="button" onClick={() => onPick({ name: c })}
                          className="tap shrink-0 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold text-white/80">
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Divisions */}
                  <div className="px-4 pt-4 pb-1">
                    <p className="text-[10.5px] font-bold uppercase tracking-widest text-white/35">Browse by division</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {BD_DIVISIONS.map((div) => (
                      <button key={div} type="button" onClick={() => setDivision(div)}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-white/5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-300">
                          <MapPin className="size-4" />
                        </span>
                        <span className="flex-1 text-[14px] font-semibold text-white">{div} Division</span>
                        <span className="text-[11px] text-white/35">
                          {BD_LOCATIONS.filter((l) => l.division === div && l.name === l.district).length} districts
                        </span>
                        <span className="text-white/30">›</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
