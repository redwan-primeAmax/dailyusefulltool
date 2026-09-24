import { Lock, Award } from 'lucide-react';
import type { MilestoneBadge } from '../addictionModel';

interface BadgesGridProps {
  badges: (MilestoneBadge & { unlocked: boolean })[];
  unlockedCount: number;
}

export function BadgesGrid({ badges, unlockedCount }: BadgesGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-amber-400" />
          <p className="text-[12px] font-bold uppercase tracking-wider text-ink">
            Milestone Badges & Trophies
          </p>
        </div>
        <span className="text-[11px] font-bold text-amber-400">
          {unlockedCount} / {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {badges.map((badge) => {
          return (
            <div
              key={badge.id}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all ${
                badge.unlocked
                  ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/15 via-surface2 to-surface2 shadow-md shadow-amber-500/10 scale-100'
                  : 'border-hairline bg-surface2/40 opacity-55'
              }`}
            >
              <div className="relative grid size-12 place-items-center rounded-2xl bg-surface3/80 shadow-inner">
                <span className="text-[26px] select-none">{badge.emoji}</span>
                {!badge.unlocked && (
                  <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-surface2 text-ink3 border border-hairline shadow">
                    <Lock className="size-3" />
                  </span>
                )}
              </div>

              <div className="min-w-0 w-full">
                <p className={`truncate text-[12px] font-bold ${badge.unlocked ? 'text-ink' : 'text-ink3'}`}>
                  {badge.name}
                </p>
                <p className="text-[10px] text-ink3 mt-0.5">
                  {badge.unlocked ? 'Unlocked ✓' : `${badge.daysRequired} Days Clean`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
