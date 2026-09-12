/**
 * The checkpoint question, end to end, at the real route (work package 6, AC-09).
 *
 * These tests drive the real application over the real engine: playback stops at the authored
 * checkpoint, nothing is revealed before submission, exactly one submission happens, and skip,
 * continue and depth changes behave as document 02 specifies.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App.tsx';
import { serveContent, type ServedContent } from '../fixtures/serve-content.ts';

const LESSON_PATH = '#/exercise/exercise-synthetic-feedback';

let served: ServedContent;

beforeEach(async () => {
  localStorage.clear();
  served = await serveContent();
});

afterEach(() => {
  served.restore();
  globalThis.location.hash = '';
});

/** Opens the lesson and parks the cursor just before the first checkpoint at 2800 ms. */
async function openBeforeFirstCheckpoint(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  globalThis.location.hash = LESSON_PATH;
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Abstract exercise: an invented signalling loop',
    );
  });
  fireEvent.change(screen.getByLabelText('Lesson position'), { target: { value: '2700' } });
  await waitFor(() => {
    expect(screen.getByLabelText('Lesson position')).toHaveValue('2700');
  });
  await user.click(screen.getByRole('button', { name: 'Play' }));
  await screen.findByRole('heading', { name: /Practice question/ });
}

describe('reaching a checkpoint', () => {
  it('stops playback and asks before anything is revealed', async () => {
    const user = userEvent.setup();
    await openBeforeFirstCheckpoint(user);

    expect(screen.getByLabelText('Lesson position')).toHaveValue('2800');
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(screen.getByText(/Under these assumptions:/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'The Peripheral structure releases Gamma.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
    // Nothing is revealed before submission.
    expect(screen.queryByText(/Best answer/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Correct\./)).not.toBeInTheDocument();
  });

  it('records exactly one submission and shows feedback with words and an icon', async () => {
    const user = userEvent.setup();
    await openBeforeFirstCheckpoint(user);

    await user.click(screen.getByRole('radio', { name: 'The Peripheral structure releases Gamma.' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(screen.getByText('Correct.')).toBeInTheDocument();
    const chosen = screen.getByRole('radio', { name: /The Peripheral structure releases Gamma\./ });
    expect(chosen.closest('label')).toHaveTextContent('✓ Correct');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    // The question interface is gone: there is nothing left to submit.
    expect(screen.queryByRole('button', { name: 'Check answer' })).not.toBeInTheDocument();

    // Further submissions are impossible: the radio group is resolved, not answerable.
    expect(chosen).toBeDisabled();
  });

  it('corrects a wrong choice with the mechanism, the best answer and the evidence', async () => {
    const user = userEvent.setup();
    await openBeforeFirstCheckpoint(user);

    await user.click(screen.getByRole('radio', { name: 'The Source structure releases more Alpha.' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(screen.getByText('Not quite.')).toBeInTheDocument();
    const chosen = screen.getByRole('radio', { name: /The Source structure releases more Alpha\./ });
    expect(chosen.closest('label')).toHaveTextContent('✗ Your answer');
    const best = screen.getByRole('radio', { name: /The Peripheral structure releases Gamma\./ });
    expect(best.closest('label')).toHaveTextContent('✓ Best answer');
    // The chosen distractor's authored feedback is shown, not a generic message.
    expect(screen.getByText(/Nothing here tells the Source to release more Alpha/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show the evidence' }));
    const evidence = await screen.findByRole('complementary', { name: /^Evidence:/ });
    expect(within(evidence).getByRole('heading', { name: 'What is claimed' })).toBeInTheDocument();
  });

  it('continues from the reveal point and keeps playing', async () => {
    const user = userEvent.setup();
    await openBeforeFirstCheckpoint(user);

    await user.click(screen.getByRole('radio', { name: 'The Peripheral structure releases Gamma.' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Playback resumes, so the cursor moves on from the reveal point; pause to measure it.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    await waitFor(() => {
      expect(Number(screen.getByLabelText('Lesson position').getAttribute('value'))).toBeGreaterThan(
        2800,
      );
    });
  });

  it('never autoplays under reduced motion, so stepping bypasses the checkpoint quietly', async () => {
    localStorage.setItem(
      'human-signals:preferences:v1',
      JSON.stringify({
        version: 1,
        depth: 'standard',
        view: '2d',
        motion: 'reduce',
        contrast: 'system',
        speed: 1,
        predictionsEnabled: true,
      }),
    );
    const user = userEvent.setup();
    globalThis.location.hash = LESSON_PATH;
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Abstract exercise: an invented signalling loop',
      );
    });
    fireEvent.change(screen.getByLabelText('Lesson position'), { target: { value: '2700' } });
    await waitFor(() => {
      expect(screen.getByLabelText('Lesson position')).toHaveValue('2700');
    });
    await user.click(screen.getByRole('button', { name: 'Play' }));

    // Reduced motion never starts the clock (D4): no question can interrupt.
    expect(screen.queryByRole('heading', { name: /Practice question/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Lesson position')).toHaveValue('2700');

    // Manual stepping remains complete and seek rules apply: the checkpoint is bypassed.
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Lesson position')).toHaveValue('3000');
    });
    expect(screen.queryByRole('heading', { name: /Practice question/ })).not.toBeInTheDocument();
  });

  it('skips without showing feedback and lands paused on the revealed step', async () => {
    const user = userEvent.setup();
    await openBeforeFirstCheckpoint(user);

    await user.click(screen.getByRole('button', { name: 'Skip and continue' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Lesson position')).toHaveValue('3000');
    });
    expect(screen.queryByRole('heading', { name: /Practice question/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Correct\.|Not quite\./)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('changes depth without changing the chosen answer or the verdict', async () => {
    const user = userEvent.setup();
    await openBeforeFirstCheckpoint(user);

    await user.click(screen.getByRole('radio', { name: 'The Peripheral structure releases Gamma.' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('Correct.')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Mechanism/ }));

    // The wording changes; the verdict and the chosen answer do not.
    expect(screen.getByText('Correct.')).toBeInTheDocument();
    const card = screen.getByRole('region', { name: /Practice question/ });
    const stillChosen = within(card).getByRole('radio', { checked: true });
    expect(stillChosen.closest('label')).toHaveTextContent(/Gamma/);
  });
});
