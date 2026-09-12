/**
 * One polite live region for the whole application.
 *
 * Document 10: never announce per-frame animation. Meaningful step changes and feedback are
 * announced politely; during playback updates are throttled and remain interruptible.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface AnnouncerState {
  announce: (message: string, options?: { throttleMs?: number }) => void;
}

const AnnouncerContext = createContext<AnnouncerState | null>(null);

export function AnnouncerProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [message, setMessage] = useState('');
  const lastAt = useRef(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((text: string, options?: { throttleMs?: number }) => {
    const throttleMs = options?.throttleMs ?? 0;
    const now = Date.now();
    if (pending.current !== null) {
      clearTimeout(pending.current);
      pending.current = null;
    }
    const wait = Math.max(0, throttleMs - (now - lastAt.current));
    if (wait === 0) {
      lastAt.current = now;
      setMessage(text);
      return;
    }
    pending.current = setTimeout(() => {
      lastAt.current = Date.now();
      setMessage(text);
    }, wait);
  }, []);

  const value = useMemo(() => ({ announce }), [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="hs-visually-hidden">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer(): AnnouncerState {
  return useContext(AnnouncerContext) ?? { announce: () => undefined };
}
