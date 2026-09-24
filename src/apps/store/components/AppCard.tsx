import { motion } from 'framer-motion';
import { Check, CloudDownload, Play, Trash2, Star } from 'lucide-react';
import { AppIcon } from '../../../components/ui/AppIcon';
import { CustomButton } from '../../../components/CustomButton';
import { ProgressBar } from '../../../components/ui/DataViz';
import type { AppManifest } from '../../../types';
import { cn } from '../../../utils/cn';

export interface AppCardProps {
  app: AppManifest;
  index: number;
  installed: boolean;
  progress?: number;
  onOpen: () => void;
  onInstall: () => void;
  onLaunch: () => void;
  onUninstall: () => void;
}

export function AppCard({ app, index, installed, progress, onOpen, onInstall, onLaunch, onUninstall }: AppCardProps) {
  const downloading = progress !== undefined;
  const Icon = app.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25), type: 'spring', stiffness: 260, damping: 24 }}
      onClick={onOpen}
      className="flex cursor-pointer items-center gap-3.5 rounded-2xl p-2.5 transition-colors hover:bg-emerald-950/30"
    >
      <div className="shrink-0">
        <AppIcon icon={Icon} gradient={app.gradient} size="md" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-emerald-50">{app.name}</p>
        <p className="truncate text-[11.5px] text-emerald-300/60">
          <span className="capitalize">{app.category.toLowerCase()}</span> · {app.developer}
        </p>
        <div className="mt-1 flex items-center gap-2.5 text-[11px] font-semibold text-emerald-200/70">
          <span className="flex items-center gap-0.5">
            {app.rating}
            <Star className="size-3 fill-amber-400 text-amber-400" />
          </span>
          <span>{app.sizeMb} MB</span>
          <span className="hidden sm:inline">{app.installs}</span>
        </div>
        {downloading && (
          <div className="mt-2 space-y-1">
            <ProgressBar value={progress ?? 0} height={5} tone="good" />
            <p className="text-[10.5px] font-semibold text-emerald-400">
              Installing… {Math.round(progress ?? 0)}%
            </p>
          </div>
        )}
      </div>
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        {installed ? (
          <div className="flex flex-col items-center gap-1">
            <CustomButton size="sm" variant="success" onClick={onLaunch} leadingIcon={<Play className="size-3.5" />}>
              Open
            </CustomButton>
            <button
              type="button"
              onClick={onUninstall}
              className="flex items-center gap-1 text-[10.5px] font-semibold text-emerald-300/50 hover:text-red-400"
            >
              <Trash2 className="size-3" /> Uninstall
            </button>
          </div>
        ) : (
          <CustomButton
            size="sm"
            onClick={onInstall}
            loading={downloading}
            leadingIcon={downloading ? undefined : <CloudDownload className="size-3.5" />}
            className={cn(
              '!rounded-full !bg-gradient-to-r !from-emerald-400 !to-teal-500 !text-emerald-950 !font-extrabold !px-3',
              'shadow-md shadow-emerald-500/20',
            )}
          >
            {downloading ? `${Math.round(progress ?? 0)}%` : 'Install'}
          </CustomButton>
        )}
      </div>
      {installed && !downloading && (
        <span className="sr-only">
          <Check className="size-3" /> installed
        </span>
      )}
    </motion.article>
  );
}
