import { Component, type ErrorInfo, type ReactNode } from 'react';
import { recordDiagnostic, type ErrorCode, type RouteKind } from '../platform/diagnostics.ts';

interface Props {
  /** Names the boundary for the recovery copy: the shell, content or a renderer. */
  scope: 'shell' | 'content' | 'renderer';
  code: ErrorCode;
  routeKind?: RouteKind;
  children: ReactNode;
  fallback?: (retry: () => void) => ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Document 08 requires separate shell, content and renderer boundaries: a renderer failure
 * must preserve the lesson, and invalid content must not partially render.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo): void {
    recordDiagnostic(this.props.code, this.props.routeKind ?? 'unknown');
  }

  private readonly retry = (): void => {
    this.setState({ failed: false });
  };

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.retry);
    return (
      <div role="alert" className="hs-recovery">
        <h2>This part of the page could not be shown</h2>
        <p>
          The rest of Human Signals is still available. Error code <code>{this.props.code}</code>.
        </p>
        <button type="button" onClick={this.retry}>
          Try again
        </button>
      </div>
    );
  }
}
