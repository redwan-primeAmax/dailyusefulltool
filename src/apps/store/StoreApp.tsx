import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Sparkles, Star, X, TrendingUp, Gamepad2, Pencil,
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#0d1612]">
      {/* ── Header ────────────────────────────────── */}
      <header className="shrink-0 px-4 pt-3">
        <div className="flex items-center gap-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[24px] border border-emerald-500/20 bg-emerald-950/50 px-4 py-2.5">
            <Search className="size-4 shrink-0 text-emerald-400/80" />
            <input
              type="search"
              name="store-search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps & games"
              className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-white outline-none placeholder:text-emerald-200/40"
            />
            <AnimatePresence>
              {query && (
                <motion.button initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                  type="button" onClick={() => setQuery('')} className="shrink-0 text-emerald-200/70">
                  <X className="size-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <button type="button" onClick={() => setProfileOpen(true)} aria-label="Profile"
            className="tap grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-lg shadow-md shadow-emerald-500/30">
            {avatarIsUrl
              ? <img src={device.profileAvatar} alt="avatar" className="size-full object-cover" />
              : <span>{device.profileAvatar}</span>}
          </button>
        </div>

        {/* Tabs */}
        <nav className="mt-3 flex gap-1.5 pb-1">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); setQuery(''); }}
              className={cn(
                'tap flex-1 rounded-full py-2 text-[13px] font-bold transition-colors',
                tab === t.id && !query
                  ? 'bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/25'
                  : 'bg-emerald-950/40 text-emerald-100/60',
              )}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Body: page scrolls vertically only ─────── */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-28">
        <AnimatePresence mode="wait">
          {query ? (
            <motion.section key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5 px-4 pt-4">
              <p className="px-1 pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400/70">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="text-[30px]">🔍</p>
                  <p className="mt-2 text-[14px] font-semibold text-emerald-50">No apps found</p>
                  <p className="text-[12px] text-emerald-200/50">Try a different search term</p>
                </div>
              ) : results.map((app, i) => (
                <AppCard key={app.id} app={app} index={i} installed={isInstalled.has(app.id)} progress={installing[app.id]}
                  onOpen={() => setSelected(app.id)} onInstall={() => handleInstall(app.id, app.version)}
                  onLaunch={() => launchApp(app.id)} onUninstall={() => handleUninstall(app.id)} />
              ))}
            </motion.section>
          ) : (
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }} className="pt-4">
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

/**
 * One rich-card layout used across every shelf. Deep background, gradient
 * wash, smooth fade-in, rating + install/open action. The single source of
 * card visuals (no duplicate styling between shelves).
 */
function Shelf({ title, accent, icon, apps, ...props }: { title: string; accent?: string; icon?: React.ReactNode; apps: AppManifest[] } & ListProps) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2 px-5">
        {icon}
        <p className={cn('text-[11px] font-bold uppercase tracking-[0.18em]', accent ?? 'text-emerald-200/80')}>{title}</p>
      </div>
      {/* Only this row scrolls horizontally. */}
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {apps.map((app, i) => (
          <ShelfCard key={app.id} app={app} index={i} {...props} />
        ))}
      </div>
    </section>
  );
}

function ShelfCard({ app, index, isInstalled, installing, setSelected, handleInstall, launchApp }: { app: AppManifest; index: number } & ListProps) {
  const installed = isInstalled.has(app.id);
  const progress = installing[app.id];
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.25), type: 'spring', stiffness: 240, damping: 24 }}
      onClick={() => setSelected(app.id)}
      whileTap={{ scale: 0.97 }}
      className="relative flex h-[138px] w-[188px] shrink-0 overflow-hidden rounded-[24px] border border-emerald-500/10 bg-emerald-950/40 p-3.5 text-left shadow-xl shadow-black/30"
    >
      {/* Deep gradient wash */}
      <div className={cn('absolute inset-0 opacity-25 bg-gradient-to-br', app.gradient)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <div className="relative z-10 flex w-full flex-col justify-between">
        <div className="flex items-start gap-3">
          <AppIcon icon={app.icon} gradient={app.gradient} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-extrabold text-white">{app.name}</p>
            <p className="mt-0.5 truncate text-[10.5px] font-medium text-emerald-100/60">{app.subcategory}</p>
          </div>
        </div>
        <p className="line-clamp-2 text-[10.5px] leading-snug text-white/70">{app.description}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10.5px] font-bold text-amber-300">
            <Star className="size-3 fill-current" /> {app.rating}
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (installed) launchApp(app.id);
              else handleInstall(app.id, app.version);
            }}
            className="rounded-full bg-emerald-400 px-2.5 py-1 text-[10px] font-black text-emerald-950"
          >
            {progress !== undefined ? `${Math.round(progress)}%` : installed ? 'Open' : 'Install'}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function ForYou(props: ListProps) {
  // System apps never appear in For You shelves.
  const browseable = STORED_APPS.filter((a) => a.kind !== 'system');

  /**
   * Partition the browseable set into non-overlapping groups so every app has
   * EXACTLY one card in this tab. Recommended = top-rated picks, New = the
   * rest sorted by release, category shelves = only what's left.
   */
  const recommendedIds = new Set(
    [...browseable].sort((a, b) => b.rating - a.rating).slice(0, 4).map((a) => a.id),
  );
  const newestIds = new Set(
    [...browseable]
      .filter((a) => !recommendedIds.has(a.id))
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, 4)
      .map((a) => a.id),
  );

  const recommended = browseable.filter((a) => recommendedIds.has(a.id));
  const newest = browseable.filter((a) => newestIds.has(a.id));
  const remainder = browseable.filter((a) => !recommendedIds.has(a.id) && !newestIds.has(a.id));

  return (
    <div className="space-y-6">
      <Shelf title="Recommended" accent="text-emerald-300/90" icon={<TrendingUp className="size-4 text-emerald-400" />} apps={recommended} {...props} />
      <Shelf title="New & recently updated" accent="text-sky-300/90" icon={<Sparkles className="size-4 text-sky-300" />} apps={newest} {...props} />

      {APP_CATEGORIES.map((cat) => {
        const apps = remainder.filter((a) => a.category === cat);
        if (apps.length === 0) return null;
        return <Shelf key={cat} title={cat} apps={apps} {...props} />;
      })}
    </div>
  );
}

function GamesTab(props: ListProps) {
  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center gap-2 px-1">
        <Gamepad2 className="size-4 text-teal-300" />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-300/90">Built for Web OS</p>
      </div>
      {GAME_APPS.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-emerald-200/50">No games available yet.</p>
      ) : (
        GAME_APPS.map((app, i) => (
          <AppCard key={app.id} app={app} index={i} installed={props.isInstalled.has(app.id)} progress={props.installing[app.id]}
            onOpen={() => props.setSelected(app.id)} onInstall={() => props.handleInstall(app.id, app.version)}
            onLaunch={() => props.launchApp(app.id)} onUninstall={() => props.handleUninstall(app.id)} />
        ))
      )}
    </div>
  );
}

function AppsTab(props: ListProps) {
  return (
    <div className="space-y-6">
      {APP_CATEGORIES.filter((c) => c !== 'Games').map((cat) => {
        const apps = APP_APPS.filter((a) => a.category === cat);
        if (apps.length === 0) return null;
        return <Shelf key={cat} title={cat} apps={apps} {...props} />;
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
