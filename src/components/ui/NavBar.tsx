import { useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { BackButton } from '../BackButton';
import { ReaderStatusPill } from './ReaderStatusPill';
import { useOS } from '../../context/OSContext';
import { cn } from '../../utils/cn';

/** System navigation bar: home + back on the left, true browser fullscreen on the right. */
export function NavBar({ overlay }: { overlay?: boolean }) {
  const { stack, goBack, goHome, immersive, setImmersive } = useOS();
  const canGoBack = stack.length > 0;

  // Keep the shared `immersive` flag in sync with the real Fullscreen API.
  useEffect(() => {
    const onChange = () => setImmersive(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [setImmersive]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <nav
      className={cn(
        'relative z-40 flex h-[58px] w-full shrink-0 items-center justify-between gap-3 px-4 pb-1.5',
        overlay ? 'text-white' : 'text-ink2',
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Home"
          onClick={goHome}
          className="tap grid size-11 place-items-center rounded-full hover:bg-white/10 hover:text-ink"
        >
          <HomeIcon className="size-[17px]" />
        </button>
        <BackButton onPress={goBack} disabled={!canGoBack} />
      </div>

      {/* Background session indicator */}
      <ReaderStatusPill />

      <button
        type="button"
        aria-label={immersive ? 'Exit fullscreen' : 'Enter fullscreen'}
        title={immersive ? 'Exit fullscreen' : 'Fullscreen'}
        onClick={toggleFullscreen}
        className={cn(
          'tap grid size-11 place-items-center rounded-full hover:bg-white/10',
          immersive ? 'bg-emerald-500/20 text-emerald-400' : 'hover:text-ink',
        )}
      >
        {immersive ? <Minimize2 className="size-[17px]" /> : <Maximize2 className="size-[17px]" />}
      </button>
    </nav>
  );
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
