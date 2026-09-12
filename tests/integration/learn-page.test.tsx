/**
 * The Learn page (work package 6, AC-10).
 *
 * First use explains local-only storage and offers the exercise as practice. After real
 * progress exists, counts appear with denominators and the exposure rule — and never a
 * percentage or a mastery claim.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App.tsx';
import { serveContent, type ServedContent } from '../fixtures/serve-content.ts';
import { seekScrubber } from '../fixtures/seek.ts';

let served: ServedContent;

beforeEach(async () => {
  localStorage.clear();
  served = await serveContent();
});

afterEach(() => {
  served.restore();
  globalThis.location.hash = '';
  cleanup();
});

async function openLearn(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('link', { name: 'Learn' }));
  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Learn');
  });
}

/** Answers the first checkpoint correctly and then seeks to the end, which completes the lesson. */
async function completeFirstCheckpoint(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  globalThis.location.hash = '#/exercise/exercise-synthetic-feedback';
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Abstract exercise: an invented signalling loop',
    );
  });
  await seekScrubber(2700);
  await user.click(screen.getByRole('button', { name: 'Play' }));
  await screen.findByRole('heading', { name: /Practice question/ });
  await user.click(screen.getByRole('radio', { name: 'The Peripheral structure releases Gamma.' }));
  await user.click(screen.getByRole('button', { name: 'Check answer' }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('button', { name: 'Pause' }));
  await seekScrubber(6000);
  await waitFor(() => {
    expect(screen.getByText(/Journey completed/)).toBeInTheDocument();
  });
}

describe('Learn page', () => {
  it('explains local-only storage on first use and offers the exercise as practice', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Explore how your body communicates',
      );
    });

    await openLearn(user);

    expect(screen.getByText(/results live only in this browser/i)).toBeInTheDocument();
    expect(screen.getByText(/no account and nothing is sent anywhere/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Practice and transfer exercises/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Abstract exercise/ })).toBeInTheDocument();
    expect(screen.queryByText(/✓ Completed/)).not.toBeInTheDocument();
  });

  it('shows counts with denominators and the exposure rule after real progress', async () => {
    const user = userEvent.setup();
    await completeFirstCheckpoint(user);

    await openLearn(user);

    expect(screen.getByText(/Lessons completed:/)).toBeInTheDocument();
    expect(screen.getByText(/Practice questions answered:/)).toBeInTheDocument();
    expect(screen.getByText(/1 of 1 correct on the first unassisted attempt/)).toBeInTheDocument();
    expect(
      screen.getByText(/An attempt counts as unassisted only if you had not seen the answer/),
    ).toBeInTheDocument();
    // The fixture carries no journey timelines, so there is no sequence badge to assert here;
    // the completion fact above is the record that the badge would mirror.
  });

  it('never shows a percentage, a mastery score or a badge', async () => {
    const user = userEvent.setup();
    await completeFirstCheckpoint(user);

    await openLearn(user);

    const page = screen.getByRole('main');
    expect(page.textContent).not.toContain('%');
    expect(page.textContent).not.toMatch(/you (have )?mastered/i);
    expect(screen.queryByText(/level \d|bronze|gold|streak/i)).not.toBeInTheDocument();
  });
});
