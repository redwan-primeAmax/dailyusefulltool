import { motion } from 'framer-motion';
import { ArrowLeft, CloudDownload, Play, Share2, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { AppIcon } from '../../../components/ui/AppIcon';
import { CustomButton } from '../../../components/CustomButton';
import { ProgressBar } from '../../../components/ui/DataViz';
import { cn } from '../../../utils/cn';
import type { AppManifest } from '../../../types';

export interface AppDetailProps {
  app: AppManifest;
  installed: boolean;
  progress?: number;
  onInstall: () => void;
  onUninstall: () => void;
  onOpen: () => void;
  onClose: () => void;
  onManage: () => void;
}

const SCREENSHOT_GRADIENTS = [
  'from-emerald-400/60 via-teal-400/30 to-transparent',
  'from-amber-300/60 via-orange-400/30 to-transparent',
  'from-sky-400/60 via-cyan-400/30 to-transparent',
];

export function AppDetail({ app, installed, progress, onInstall, onUninstall, onOpen, onClose }: AppDetailProps) {
  const Icon = app.icon;
  const downloading = progress !== undefined;

  return (
    <div
      className={cn('flex h-full min-h-0 flex-col bg-[#0d1612]')}
    >
      {/* Back / title */}
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-[#0d1612]/80 px-3 py-3 backdrop-blur-lg">
        <button
          type="button"
          aria-label="Back"
          onClick={onClose}
          className="tap grid size-10 place-items-center rounded-full text-emerald-100 hover:bg-white/5"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold text-emerald-50">{app.name}</h1>
          <p className="truncate text-[11px] font-medium text-emerald-300/70">{app.developer}</p>
        </div>
        <button type="button" aria-label="Share"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.share) {
              void navigator.share({ title: app.name, text: app.description }).catch(() => {});
            }
          }}
          className="tap grid size-10 place-items-center rounded-full text-emerald-100 hover:bg-white/5">
          <Share2 className="size-[18px]" />
        </button>
      </header>

      {/* Body */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-32">
        {/* Hero */}
        <div className="relative px-4 pt-5">
          <div className="flex items-start gap-4">
            <AppIcon icon={Icon} gradient={app.gradient} size="xl" />
            <div className="min-w-0 flex-1 pt-2">
              <h2 className="text-[22px] font-bold leading-tight text-emerald-50">{app.name}</h2>
              <p className="text-[12.5px] font-semibold text-emerald-400">{app.developer}</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-200/60">
                <span className="flex items-center gap-0.5 font-bold text-amber-400">
                  <Star className="size-3 fill-amber-400" /> {app.rating}
                </span>
                <span>·</span>
                <span>{app.sizeMb} MB</span>
                <span>·</span>
                <span className="uppercase tracking-wider text-emerald-300/80">{app.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="mt-5 px-4">
          {installed ? (
            <div className="flex gap-3">
              <CustomButton fullWidth size="lg" variant="success" onClick={onOpen} leadingIcon={<Play className="size-4" />}>
                Open
              </CustomButton>
              <CustomButton
                size="lg"
                variant="danger"
                onClick={onUninstall}
                leadingIcon={<Trash2 className="size-4" />}
              >
                Uninstall
              </CustomButton>
            </div>
          ) : (
            <CustomButton
              fullWidth
              size="lg"
              onClick={onInstall}
              loading={downloading}
              leadingIcon={downloading ? undefined : <CloudDownload className="size-[18px]" />}
              className="!bg-gradient-to-r !from-emerald-400 !to-teal-500 !text-emerald-950 !font-extrabold shadow-lg shadow-emerald-500/30"
            >
              {downloading ? `Installing ${Math.round(progress ?? 0)}%` : 'Install'}
            </CustomButton>
          )}
          {downloading && (
            <div className="mt-3">
              <ProgressBar value={progress ?? 0} height={8} tone="good" />
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div className="mt-6 border-y border-emerald-500/10 bg-emerald-900/10 px-4 py-3 grid grid-cols-4 text-center">
          {[
            { v: `${app.rating}`, l: 'Rating', sub: app.reviews, icon: true },
            { v: app.sizeMb, l: 'Size', sub: 'MB' },
            { v: app.installs, l: 'Downloads' },
            { v: app.version, l: 'Version' },
          ].map((s) => (
            <div key={s.l} className="flex flex-col items-center">
              <span className="flex items-center gap-0.5 text-[14px] font-bold text-emerald-100">
                {s.icon ? <Star className="size-3 fill-amber-400 text-amber-400" /> : null}
                {s.v}
              </span>
              <span className="text-[9.5px] font-bold uppercase tracking-widest text-emerald-300/60">{s.l}</span>
              {s.sub && <span className="text-[9px] text-emerald-200/40">{s.sub}</span>}
            </div>
          ))}
        </div>

        {/* Screenshots */}
        <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto px-4 pb-1">
          {SCREENSHOT_GRADIENTS.map((g, i) => (
            <motion.div
              key={g}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`grid h-48 w-28 shrink-0 place-items-center rounded-[24px] border border-emerald-400/10 bg-gradient-to-b ${g}`}
            >
              <div className="grid size-12 place-items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
                <Icon className="size-7 text-white" strokeWidth={2.4} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* About */}
        <section className="space-y-3 px-4 pt-6">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">About this app</h3>
          <p className="text-[13.5px] leading-relaxed text-emerald-50/85">{app.description}</p>
          <ul className="mt-2 space-y-2.5">
            {app.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[12.5px] text-emerald-100/80">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Ratings bar */}
        <section className="space-y-2 px-4 pt-6">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">Ratings & reviews</h3>
          <div className="flex items-center gap-5 py-2">
            <div className="text-center">
              <p className="text-[36px] font-light leading-none text-emerald-50">{app.rating}</p>
              <div className="mt-1 flex gap-0.5 justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-3 ${i < Math.round(app.rating) ? 'fill-amber-400 text-amber-400' : 'text-emerald-900'}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-[10px] text-emerald-300/60">{app.reviews} reviews</p>
            </div>
            <div className="flex-1 space-y-1">
              {[92, 6, 1, 0.6, 0.4].map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[9px] w-1 text-emerald-300/60">{5 - i}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-emerald-900/40">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${w}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <p className="px-4 pt-6 text-center text-[10.5px] text-emerald-300/40">
          Google Play · Web OS · Verified safe
        </p>
      </div>
    </div>
  );
}
