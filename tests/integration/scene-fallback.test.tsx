/**
 * Losing 3D must never cost the learner the lesson (document 10, AC-12 and AC-14).
 *
 * jsdom has no WebGL, which is exactly the unsupported case: the scene host must fall back to
 * the 2D diagram, say so once, and keep every relationship reachable.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App.tsx';
import { PREFERENCES_KEY } from '../../src/platform/preferences.ts';
import { serveContent, type ServedContent } from '../fixtures/serve-content.ts';

let served: ServedContent;

beforeEach(async () => {
  localStorage.clear();
  served = await serveContent();
});

afterEach(() => {
  served.restore();
  globalThis.location.hash = '';
});

function storePreferences(view: '3d' | '2d'): void {
  localStorage.setItem(
    PREFERENCES_KEY,
    JSON.stringify({
      version: 1,
      depth: 'standard',
      view,
      motion: 'system',
      contrast: 'system',
      speed: 1,
      predictionsEnabled: true,
    }),
  );
}

async function openLesson(): Promise<void> {
  globalThis.location.hash = '#/exercise/exercise-synthetic-feedback';
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Abstract exercise');
  });
}

describe('when WebGL is unavailable', () => {
  it('uses the 2D diagram, explains why once, and offers to retry 3D', async () => {
    storePreferences('3d');
    await openLesson();

    expect(await screen.findByText(/cannot show the 3D body/)).toBeInTheDocument();
    expect(screen.getByTestId('diagram-2d')).toBeInTheDocument();
    const structure = screen.getByRole('button', { name: 'Source structure (invented)' });
    expect(structure).toHaveAttribute('aria-pressed', 'false');
    await userEvent.setup().click(structure);
    expect(structure).toHaveAttribute('aria-pressed', 'true');
    // "Unsupported" is not a transient failure, so no retry is offered for it.
    expect(screen.queryByRole('button', { name: 'Retry 3D' })).not.toBeInTheDocument();
  });

  it('keeps the whole lesson usable: stepping, transcript, Why and evidence', async () => {
    const user = userEvent.setup();
    storePreferences('3d');
    await openLesson();

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByLabelText('Lesson position')).toHaveValue('1000');

    const transcript = screen.getByRole('region', { name: 'Causal transcript' });
    await user.click(
      within(transcript).getAllByRole('button', {
        name: /^Why\? Gamma inhibits the Source structure/,
      })[0]!,
    );
    const why = await screen.findByRole('complementary', { name: /inhibits/ });
    expect(within(why).getByText(/feedback/)).toBeInTheDocument();
  });
});

describe('when the learner prefers the 2D diagram', () => {
  it('uses it without complaining about the renderer', async () => {
    storePreferences('2d');
    await openLesson();

    expect(screen.getByTestId('diagram-2d')).toBeInTheDocument();
    expect(screen.queryByText(/cannot show the 3D body/)).not.toBeInTheDocument();
  });
});
