import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { CustomButton } from './CustomButton';

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  error: Error | null;
}

/** Keeps a crashed mini-app from taking down the whole OS shell. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[os] screen crashed', this.props.name, error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface px-8 text-center">
        <span className="grid size-16 place-items-center rounded-3xl bg-amber-500/15 text-amber-400">
          <TriangleAlert className="size-7" />
        </span>
        <div>
          <h2 className="text-[17px] font-semibold text-ink">
            {this.props.name ?? 'This app'} stopped unexpectedly
          </h2>
          <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-ink3">
            {this.state.error.message || 'An unknown runtime error occurred.'}
          </p>
        </div>
        <CustomButton onClick={this.reset} leadingIcon={<RefreshCw className="size-4" />}>
          Try again
        </CustomButton>
      </div>
    );
  }
}
