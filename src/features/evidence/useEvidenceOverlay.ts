/**
 * Shared state for the evidence overlay: what is open, opening with an invoker, and closing
 * with focus restored to that invoker (document 02). Escape closes it. LessonPlayer layers a
 * second panel under this one; its own Escape handler defers while evidence is open.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export interface EvidenceRequest {
  claimIds: string[];
  title: string;
}

export function useEvidenceOverlay(): {
  evidence: EvidenceRequest | null;
  openEvidence: (claimIds: string[], title: string) => void;
  closeEvidence: () => void;
  /** Clears the overlay without moving focus; for closes handled by a wider panel. */
  clearEvidence: () => void;
} {
  const [evidence, setEvidence] = useState<EvidenceRequest | null>(null);
  const lastInvoker = useRef<HTMLElement | null>(null);

  const openEvidence = useCallback((claimIds: string[], title: string) => {
    lastInvoker.current = document.activeElement as HTMLElement | null;
    setEvidence({ claimIds, title });
  }, []);

  const closeEvidence = useCallback(() => {
    setEvidence(null);
    lastInvoker.current?.focus();
  }, []);

  const clearEvidence = useCallback(() => {
    setEvidence(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && evidence !== null) closeEvidence();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [evidence, closeEvidence]);

  return { evidence, openEvidence, closeEvidence, clearEvidence };
}
