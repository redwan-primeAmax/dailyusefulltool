import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Sparkles, Star, X, TrendingUp, Gamepad2, Pencil, Store, Grid2X2, ChevronRight, ArrowUpRight,
} from 'lucide-react';
import { AppDetail } from './components/AppDetail';
import { AppCard } from './components/AppCard';
import { AppIcon } from '../../components/ui/AppIcon';
import { Modal } from '../../components/Modal';
import { CustomButton } from '../../components/CustomButton';
import { TextField } from '../../components/ui/controls';
import { useOS } from '../../context/OSContext';
import { STORED_APPS, GAME_APPS, APP_APPS, APP_CATEGORIES } from '../registry';
import type { AppId, AppManifest } from '../../types';
import { cn } from '../../utils/cn';

type Tab = 'foryou' | 'games' | 'apps';
const TABS: { id: Tab; label: string }[] = [
  { id: 'foryou', label: 'For you' },
  { id: 'games', label: 'Games' },
  { id: 'apps', label: 'Apps' },
];

/** 12 unique avatar emojis — no fish, no empty slots. */
const AVATAR_EMOJIS = ['🙂', '😎', '', '🐯', '', '🐸', '🐰', '', '👾', '', '', '🎧'];

interface ListProps {
  isInstalled: Set<AppId>;
  installing: Partial<Record<AppId, number>>;
  setSelected: (id: AppId) => void;
  handleInstall: (id: AppId, version: string) => void;
  handleUninstall: (id: AppId) => void;
  launchApp: (id: AppId) => void;
}

export function StoreApp() {
  const { installed, install, uninstall, installing, launchApp, device, setDevice } = useOS();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('foryou');
  const [selected, setSelected] = useState<AppId | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const isInstalled = useMemo(() => new Set(installed), [installed]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return STORED_APPS.filter((a) =>
      `${a.name} ${a.developer} ${a.category} ${a.subcategory}`.toLowerCase().includes(q),
    );
  }, [query]);

  const handleInstall = (id: AppId, version: string) => { void install(id, version); };
  const handleUninstall = (id: AppId) => {
    void uninstall(id);
    // Stay inside the current section: if the app being removed was the one
    // open in the detailed listing, fall back to the store grid rather than
    // letting the global route-stack filter eject the whole Store screen.
    if (selected === id) setSelected(null);
  };

  if (selected) {
    const app = STORED_APPS.find((a) => a.id === selected);
    if (app) {
      return (
        <AppDetail
          app={app}
          installed={isInstalled.has(app.id)}
          progress={installing[app.id]}
          onInstall={() => handleInstall(app.id, app.version)}
          onUninstall={() => handleUninstall(app.id)}
          onOpen={() => launchApp(app.id)}
          onClose={() => setSelected(null)}
          onManage={() => setProfileOpen(true)}
        />
      );
    }
  }

  const listProps: ListProps = { isInstalled, installing, setSelected, handleInstall, handleUninstall, launchApp };
  const avatarIsUrl = device.profileAvatar.startsWith('http');

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#08120f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.11),transparent_44%),radial-gradient(ellipse_at_bottom_left,rgba(20,184,166,0.06),transparent_38%)]" />
      <header className="relative z-10 shrink-0 border-b border-white/[0.055] bg-[#08120f]/90 px-4 pb-0 pt-4 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-[16px] border border-emerald-200/15 bg-gradient-to-br from-emerald-300/20 to-teal-500/10 text-emerald-200 shadow-lg shadow-emerald-950/40">
              <Store size={20} strokeWidth={2.1} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-emerald-300/60">Daily Useful Tool</p>
              <h1 className="mt-0.5 truncate text-[20px] font-black tracking-tight text-white">Play Store</h1>
            </div>
          </div>
          <button type="button" onClick={() => setProfileOpen(true)} aria-label="Open profile and manage installed apps"
            className="tap grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-emerald-400 to-teal-500 text-lg shadow-lg shadow-emerald-950/50 transition hover:scale-105">
            {avatarIsUrl
              ? <img src={device.profileAvatar} alt="Profile avatar" className="size-full object-cover" />
              : <span>{device.profileAvatar}</span>}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-[18px] border border-white/[0.09] bg-white/[0.055] px-3.5 py-3 transition focus-within:border-emerald-300/35 focus-within:bg-white/[0.075]">
          <Search className="size-[17px] shrink-0 text-emerald-300/80" />
          <input
            type="search"
            name="store-search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps, tools & games"
            aria-label="Search apps, tools and games"
            className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-white outline-none placeholder:text-slate-500"
          />
          <AnimatePresence>
            {query && (
              <motion.button initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                type="button" onClick={() => setQuery('')} aria-label="Clear search"
                className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[0.07] text-slate-300 transition hover:bg-white/[0.12]">
                <X className="size-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <nav aria-label="Store sections" className="no-scrollbar mt-3 flex gap-5 overflow-x-auto">
          {TABS.map((t) => {
            const TabIcon = t.id === 'foryou' ? Sparkles : t.id === 'games' ? Gamepad2 : Grid2X2;
            const active = tab === t.id && !query;
            return (
              <button key={t.id} type="button" onClick={() => { setTab(t.id); setQuery(''); }} aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex shrink-0 items-center gap-1.5 border-b-2 px-0.5 pb-3 pt-1 text-[12px] font-bold transition-colors',
                  active ? 'border-emerald-300 text-emerald-100' : 'border-transparent text-slate-500 hover:text-slate-200',
                )}>
                <TabIcon size={14} strokeWidth={2.2} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="no-scrollbar relative z-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-28">
        <AnimatePresence mode="wait">
          {query ? (
            <motion.section key="search" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4 pb-5 pt-5">
              <div className="mb-3 flex items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-300/65">Search results</p>
                  <p className="mt-1 max-w-[230px] truncate text-[17px] font-extrabold text-white">“{query.trim()}”</p>
                </div>
                <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-slate-400">
                  {results.length} {results.length === 1 ? 'match' : 'matches'}
                </span>
              </div>
              {results.length === 0 ? (
                <div className="mt-4 rounded-[24px] border border-white/[0.07] bg-white/[0.025] px-5 py-12 text-center">
                  <p className="text-[30px]">🔍</p>
                  <p className="mt-2 text-[14px] font-semibold text-white">No apps found</p>
                  <p className="mt-1 text-[12px] text-slate-500">Try a different app name or category.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.055] overflow-hidden rounded-[22px] border border-white/[0.07] bg-white/[0.025] px-2 py-1">
                  {results.map((app, i) => (
                    <AppCard key={app.id} app={app} index={i} installed={isInstalled.has(app.id)} progress={installing[app.id]}
                      onOpen={() => setSelected(app.id)} onInstall={() => handleInstall(app.id, app.version)}
                      onLaunch={() => launchApp(app.id)} onUninstall={() => handleUninstall(app.id)} />
                  ))}
                </div>
              )}
            </motion.section>
          ) : (
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }} className="pb-5 pt-4">
              {tab === 'foryou' && <ForYou {...listProps} />}
              {tab === 'games' && <GamesTab {...listProps} />}
              {tab === 'apps' && <AppsTab {...listProps} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)}
        name={device.profileName} avatar={device.profileAvatar}
        onSave={(name, avatar) => setDevice({ profileName: name, profileAvatar: avatar })}
        installed={installed} catalog={STORED_APPS} isInstalled={isInstalled}
        onLaunch={launchApp} onUninstall={handleUninstall} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function FeaturedApp({ app, ...props }: { app: AppManifest } & ListProps) {
  const installed = props.isInstalled.has(app.id);
  const progress = props.installing[app.id];
  const actionLabel = progress !== undefined
    ? `Installing ${Math.round(progress)}%`
    : installed ? 'Open app' : 'Install';

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="relative isolate overflow-hidden rounded-[28px] border border-white/10 p-5 shadow-2xl shadow-black/30"
      style={{ background: `radial-gradient(ellipse at 94% 0%, ${app.accent}55 0%, transparent 43%), linear-gradient(145deg, #14271f 0%, #0d1915 56%, #0a1210 100%)` }}
    >
      <div className="pointer-events-none absolute -bottom-16 -right-10 size-52 rounded-full blur-3xl" style={{ backgroundColor: `${app.accent}18` }} />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-emerald-100/80">
          <Sparkles size={12} /> {app.reviews === 'New' ? 'Just added' : 'Featured for you'}
        </div>
        <AppIcon icon={app.icon} gradient={app.gradient} size="xl" />
      </div>
      <div className="relative z-10 mt-3 max-w-[92%]">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">{app.category} · {app.subcategory}</p>
        <h2 className="mt-1 text-[25px] font-black leading-tight tracking-tight text-white">{app.name}</h2>
        <p className="mt-2 line-clamp-2 text-[12px] leading-[1.55] text-slate-300/80">{app.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-300/70">
          {app.reviews === 'New' ? (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-emerald-100">New</span>
          ) : (
            <span className="inline-flex items-center gap-1"><Star size={11} className="fill-amber-300 text-amber-300" /> {app.rating.toFixed(1)}</span>
          )}
          <span>{app.sizeMb} MB</span>
          <span>{app.installs} installs</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => props.setSelected(app.id)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3.5 text-[11px] font-bold text-white transition hover:bg-white/[0.13]">
            Explore <ArrowUpRight size={14} />
          </button>
          <button type="button" disabled={progress !== undefined}
            onClick={() => installed ? props.launchApp(app.id) : props.handleInstall(app.id, app.version)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-emerald-300 px-3.5 text-[11px] font-extrabold text-emerald-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-200 disabled:opacity-70">
            {actionLabel} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </motion.section>
  );
}

function Shelf({ title, accent, icon, apps, ...props }: { title: string; accent?: string; icon?: React.ReactNode; apps: AppManifest[] } & ListProps) {
  if (apps.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.04]">{icon}</span>
          <div className="min-w-0">
            <h2 className={cn('truncate text-[14px] font-extrabold tracking-tight text-white', accent)}>{title}</h2>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-500">{apps.length} {apps.length === 1 ? 'app' : 'apps'} to explore</p>
          </div>
        </div>
        <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full text-slate-500"><ChevronRight size={15} /></span>
      </div>
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {apps.map((app, i) => <ShelfCard key={app.id} app={app} index={i} {...props} />)}
      </div>
    </section>
  );
}

function ShelfCard({ app, index, isInstalled, installing, setSelected, handleInstall, launchApp }: { app: AppManifest; index: number } & ListProps) {
  const installed = isInstalled.has(app.id);
  const progress = installing[app.id];
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.2), type: 'spring', stiffness: 240, damping: 24 }}
      className="group relative flex h-[218px] w-[176px] shrink-0 snap-start flex-col overflow-hidden rounded-[23px] border border-white/[0.085] bg-[#101b17] shadow-xl shadow-black/20 transition hover:border-white/15"
    >
      <div className={cn('pointer-events-none absolute inset-0 opacity-[0.19] bg-gradient-to-br', app.gradient)} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35" />
      <div className="relative flex h-full flex-col p-3.5">
        <button type="button" onClick={() => setSelected(app.id)} aria-label={`View ${app.name} details`} className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60">
          <div className="flex items-start justify-between gap-2">
            <AppIcon icon={app.icon} gradient={app.gradient} size="md" />
            <span className={cn('max-w-[78px] truncate rounded-full border px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.12em]',
              app.reviews === 'New' ? 'border-emerald-200/15 bg-emerald-300/10 text-emerald-200' : 'border-white/[0.08] bg-black/15 text-slate-400')}>
              {app.reviews === 'New' ? 'New' : app.category}
            </span>
          </div>
          <p className="mt-3 truncate text-[13px] font-extrabold text-white">{app.name}</p>
          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">{app.subcategory}</p>
          <p className="mt-2 line-clamp-2 min-h-[30px] text-[10px] leading-[1.5] text-slate-400/90">{app.description}</p>
        </button>
        <div className="mt-auto">
          <div className="mb-2 flex items-center justify-between gap-2 text-[9px] font-bold text-slate-400">
            <span className="inline-flex items-center gap-1 text-amber-200">
              {app.reviews === 'New' ? 'New' : <><Star size={10} className="fill-current" /> {app.rating.toFixed(1)}</>}
            </span>
            <span>{app.sizeMb} MB</span>
          </div>
          <button type="button" disabled={progress !== undefined}
            onClick={() => installed ? launchApp(app.id) : handleInstall(app.id, app.version)}
            className={cn('min-h-8 w-full rounded-full px-2 text-[10px] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200',
              installed ? 'border border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15' : 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200',
              progress !== undefined && 'cursor-wait opacity-75')}>
            {progress !== undefined ? `Installing ${Math.round(progress)}%` : installed ? 'Open' : 'Install'}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function ForYou(props: ListProps) {
  const browseable = STORED_APPS.filter((app) => app.kind !== 'system');
  const [featured, ...unfeatured] = [...browseable].sort(
    (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || b.rating - a.rating,
  );

  // Keep the spotlight out of the shelves so the For You page does not repeat apps.
  const recommended = [...unfeatured].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const recommendedIds = new Set(recommended.map((app) => app.id));
  const newest = [...unfeatured]
    .filter((app) => !recommendedIds.has(app.id))
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .slice(0, 4);
  const newestIds = new Set(newest.map((app) => app.id));
  const remainder = unfeatured.filter((app) => !recommendedIds.has(app.id) && !newestIds.has(app.id));

  return (
    <div className="space-y-7">
      <div className="px-4">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-emerald-300/60">Curated for you</p>
        <h2 className="mt-1 text-[19px] font-black tracking-tight text-white">Everyday apps, hand-picked.</h2>
      </div>
      {featured && <div className="px-4"><FeaturedApp app={featured} {...props} /></div>}
      <Shelf title="Recommended" accent="text-emerald-100" icon={<TrendingUp className="size-4 text-emerald-300" />} apps={recommended} {...props} />
      <Shelf title="New & recently updated" accent="text-sky-100" icon={<Sparkles className="size-4 text-sky-300" />} apps={newest} {...props} />
      {APP_CATEGORIES.map((category) => {
        const apps = remainder.filter((app) => app.category === category);
        if (apps.length === 0) return null;
        return <Shelf key={category} title={category} apps={apps} {...props} />;
      })}
    </div>
  );
}

function GamesTab(props: ListProps) {
  return (
    <div className="space-y-5 px-4">
      <section className="relative overflow-hidden rounded-[25px] border border-teal-300/10 bg-gradient-to-br from-teal-400/[0.12] via-[#111c1a] to-[#0a1210] p-5">
        <div className="pointer-events-none absolute -right-8 -top-12 size-40 rounded-full bg-teal-300/[0.08] blur-3xl" />
        <div className="relative flex items-center gap-2 text-teal-200">
          <Gamepad2 size={16} />
          <p className="text-[9px] font-extrabold uppercase tracking-[0.18em]">Built for Web OS</p>
        </div>
        <h2 className="relative mt-2 text-[21px] font-black tracking-tight text-white">A little play goes a long way.</h2>
        <p className="relative mt-1 max-w-sm text-[11px] leading-5 text-slate-400">Quick games made for a short break, right here in your store.</p>
        <div className="relative mt-3 inline-flex rounded-full border border-white/[0.08] bg-black/15 px-2.5 py-1 text-[9px] font-bold text-teal-100/75">
          {GAME_APPS.length} {GAME_APPS.length === 1 ? 'game' : 'games'} available
        </div>
      </section>
      {GAME_APPS.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-10 text-center text-[13px] text-slate-500">No games available yet.</p>
      ) : (
        <div className="divide-y divide-white/[0.055] overflow-hidden rounded-[22px] border border-white/[0.07] bg-white/[0.025] px-2 py-1">
          {GAME_APPS.map((app, i) => (
            <AppCard key={app.id} app={app} index={i} installed={props.isInstalled.has(app.id)} progress={props.installing[app.id]}
              onOpen={() => props.setSelected(app.id)} onInstall={() => props.handleInstall(app.id, app.version)}
              onLaunch={() => props.launchApp(app.id)} onUninstall={() => props.handleUninstall(app.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AppsTab(props: ListProps) {
  const appCount = APP_APPS.filter((app) => app.kind !== 'system').length;
  return (
    <div className="space-y-7">
      <section className="mx-4 rounded-[24px] border border-white/[0.07] bg-gradient-to-r from-white/[0.055] to-white/[0.02] px-4 py-4">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.19em] text-emerald-300/60">Browse the collection</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[19px] font-black tracking-tight text-white">Tools for every day.</h2>
            <p className="mt-1 text-[11px] text-slate-400">{appCount} apps across useful categories</p>
          </div>
          <span className="mb-0.5 rounded-full border border-emerald-300/10 bg-emerald-300/[0.06] px-2.5 py-1 text-[9px] font-bold text-emerald-200/75">Explore</span>
        </div>
      </section>
      {APP_CATEGORIES.filter((category) => category !== 'Games').map((category) => {
        const apps = APP_APPS.filter((app) => app.category === category);
        if (apps.length === 0) return null;
        return <Shelf key={category} title={category} apps={apps} {...props} />;
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function ProfileModal({ open, onClose, name, avatar, onSave, installed, catalog, isInstalled, onLaunch, onUninstall }: {
  open: boolean; onClose: () => void; name: string; avatar: string;
  onSave: (name: string, avatar: string) => void;
  installed: AppId[]; catalog: AppManifest[]; isInstalled: Set<AppId>;
  onLaunch: (id: AppId) => void; onUninstall: (id: AppId) => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const [draftAvatar, setDraftAvatar] = useState(avatar);
  const [urlMode, setUrlMode] = useState(false);

  // Safety: only render real, unique emojis (guards against blank slots &
  // duplicate React keys that caused multi-select highlighting).
  const emojis = useMemo(() => {
    const seen = new Set<string>();
    return AVATAR_EMOJIS.filter((e) => {
      if (!e || e.length === 0 || seen.has(e)) return false;
      seen.add(e);
      return true;
    });
  }, []);

  return (
    <Modal open={open} onClose={onClose} sheet title="Your profile" description="Name, avatar & installed apps">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-2xl shadow-lg">
            {draftAvatar.startsWith('http') ? <img src={draftAvatar} alt="" className="size-full object-cover" /> : draftAvatar}
          </div>
          <div className="flex-1">
            <TextField label="Display name" value={draftName} placeholder="Your name"
              onChange={setDraftName} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink3">Avatar</p>
            <button type="button" onClick={() => setUrlMode((m) => !m)}
              className="flex items-center gap-1 text-[11px] font-bold text-accent">
              <Pencil className="size-3" /> {urlMode ? 'Use emoji' : 'Use image URL'}
            </button>
          </div>
          {urlMode ? (
            <TextField label="Image URL" value={draftAvatar.startsWith('http') ? draftAvatar : ''} placeholder="https://…"
              onChange={setDraftAvatar} />
          ) : (
            <div className="grid grid-cols-6 gap-2">
              {emojis.map((e, i) => (
                <button key={`${i}-${e}`} type="button" onClick={() => setDraftAvatar(e)}
                  className={cn('tap grid aspect-square place-items-center rounded-2xl text-xl transition-all',
                    draftAvatar === e ? 'bg-accent scale-105' : 'bg-surface3/60')}>
                  <span>{e}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <CustomButton fullWidth onClick={() => { onSave(draftName.trim() || 'You', draftAvatar.trim() || '🙂'); onClose(); }}>
            Save profile
          </CustomButton>
        </div>

        {/* Manage apps */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink3">
            Manage apps · {installed.length} installed
          </p>
          <div className="max-h-56 space-y-1.5 overflow-y-auto no-scrollbar">
            {catalog.filter((a) => isInstalled.has(a.id)).map((app) => (
              <div key={app.id} className="flex items-center gap-3 rounded-2xl bg-surface3/40 p-2.5">
                <AppIcon icon={app.icon} gradient={app.gradient} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{app.name}</p>
                  <p className="text-[10.5px] text-ink3">v{app.version}</p>
                </div>
                {app.core ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">System</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => onLaunch(app.id)}
                      className="tap rounded-full bg-accentsoft px-2.5 py-1 text-[10.5px] font-bold text-accent">Open</button>
                    <button type="button" onClick={() => onUninstall(app.id)}
                      className="tap rounded-full px-2 py-1 text-[10.5px] font-semibold text-red-400/80 hover:text-red-400">Remove</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
