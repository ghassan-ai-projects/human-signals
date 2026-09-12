/**
 * Loads the content bundle once per session and shares an indexed repository.
 *
 * Document 08: render the shell first, show loading text immediately, and offer a user-triggered
 * retry with at most one request in flight. A stale response can never replace the active bundle.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { loadContent, type ContentErrorCode } from '../content/loader.ts';
import { createRepository, type ContentRepository } from '../content/repository.ts';
import { recordDiagnostic, setDiagnosticContentVersion } from '../platform/diagnostics.ts';

interface ContentState {
  status: 'loading' | 'ready' | 'failed';
  repository?: ContentRepository;
  error?: { code: ContentErrorCode; detail: string };
  retry: () => void;
}

const ContentContext = createContext<ContentState | null>(null);

export function ContentProvider({
  children,
  manifestPath = __CONTENT_MANIFEST_PATH__,
}: {
  children: ReactNode;
  manifestPath?: string;
}): React.JSX.Element {
  const [state, setState] = useState<Omit<ContentState, 'retry'>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    const controller = new AbortController();
    let current = true;

    setState({ status: 'loading' });
    void loadContent({ manifestPath, signal: controller.signal })
      .then((result) => {
        if (!current) return;
        if (result.ok) {
          setDiagnosticContentVersion(result.content.manifest.contentVersion);
          setState({
            status: 'ready',
            repository: createRepository(result.content.bundle, result.content.manifest),
          });
        } else {
          recordDiagnostic(result.code, 'unknown');
          setState({ status: 'failed', error: { code: result.code, detail: result.detail } });
        }
      })
      .finally(() => {
        inFlight.current = false;
      });

    return () => {
      current = false;
      controller.abort();
      inFlight.current = false;
    };
  }, [manifestPath, attempt]);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  return <ContentContext.Provider value={{ ...state, retry }}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentState {
  const value = useContext(ContentContext);
  if (!value) throw new Error('useContent must be used inside ContentProvider');
  return value;
}

/** For pages that cannot render without content; callers handle loading and failure above it. */
export function useRepository(): ContentRepository {
  const { repository } = useContent();
  if (!repository) throw new Error('content is not loaded');
  return repository;
}
