/**
 * Shared lesson-scrubber helper for integration tests.
 *
 * Under parallel worker load a single change event can be lost or land late, so the seek
 * retries until the scrubber actually reads the requested position.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { expect } from 'vitest';

export async function seekScrubber(ms: number): Promise<void> {
  const target = String(ms);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    fireEvent.change(screen.getByLabelText('Lesson position'), { target: { value: target } });
    try {
      await waitFor(
        () => {
          expect(screen.getByLabelText('Lesson position')).toHaveValue(target);
        },
        { timeout: 2000 },
      );
      return;
    } catch {
      // Retry: the change can be lost under load.
    }
  }
  throw new Error(`the lesson position never reached ${ms} ms`);
}
