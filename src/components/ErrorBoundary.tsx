import { Component, type ErrorInfo, type ReactNode } from "react";
import { BUTTON_PRIMARY } from "./buttonStyles";

/**
 * Last-resort net around the whole app -- localStorage writes are already
 * guarded (see lib/storage's safeSetItem), but this catches anything else
 * that throws during render so the user gets a recoverable screen instead
 * of a silent blank page. React error boundaries only catch render-phase
 * errors and must be class components (no hook equivalent exists).
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error in app tree", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-neutral-950 p-6 text-center text-neutral-300">
          <h1 className="text-lg font-semibold text-white">Something went wrong</h1>
          <p className="max-w-sm text-sm text-neutral-400">
            The app hit an unexpected error and couldn't continue. Reloading usually fixes it --
            your saved data isn't affected.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={BUTTON_PRIMARY}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
