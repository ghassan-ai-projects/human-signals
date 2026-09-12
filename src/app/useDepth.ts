/**
 * Depth resolution: explicit URL, then a valid stored preference, then Intro (document 08).
 * Selecting a new depth updates both the URL and the stored preference, and changes nothing
 * about the cursor, the answer state or the meaning of the content (document 06, SET_DEPTH).
 */
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Depth } from '../content/schema.ts';
import { parseDepth } from './urls.ts';
import { usePreferences } from './PreferencesProvider.tsx';

export function useDepth(): [Depth, (depth: Depth) => void] {
  const [params, setParams] = useSearchParams();
  const { preferences, update } = usePreferences();
  const depth = parseDepth(params.get('depth'), preferences.depth);

  const setDepth = useCallback(
    (next: Depth) => {
      update({ depth: next });
      const updated = new URLSearchParams(params);
      updated.set('depth', next);
      // Replace: changing depth is not a new place in the history stack.
      setParams(updated, { replace: true });
    },
    [params, setParams, update],
  );

  return [depth, setDepth];
}
