import '../examTracker.css';

function Wave({ slow = false }: { slow?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`exam-liquid-progress__wave absolute bottom-0 left-0 h-full w-[200%] ${slow ? 'exam-liquid-progress__wave--slow' : ''}`}
      viewBox="0 0 400 36"
      preserveAspectRatio="none"
    >
      <path
        d="M0 14 C24 5 44 23 68 14 S112 5 136 14 S180 23 204 14 S248 5 272 14 S316 23 340 14 S376 5 400 14 V36 H0 Z"
        fill={slow ? 'rgba(255,255,255,0.22)' : 'rgba(11,70,48,0.22)'}
      />
    </svg>
  );
}

export function LiquidProgressBar({ value, label = 'Overall progress' }: { value: number; label?: string }) {
  const progress = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      className="h-4 overflow-hidden rounded-full border border-white/10 bg-slate-950/65 shadow-inner shadow-black/30"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div
        className="exam-liquid-progress__fill relative h-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-green-400 to-lime-300 shadow-[0_0_18px_rgba(52,211,153,0.32)]"
        style={{ width: `${progress}%` }}
      >
        <Wave />
        <Wave slow />
        <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-white/45 to-transparent" />
      </div>
    </div>
  );
}
