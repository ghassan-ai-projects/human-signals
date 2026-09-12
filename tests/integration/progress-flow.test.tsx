/**
 * Local progress through the real application (work package 6, AC-09 and AC-10).
 *
 * Attempts reach the storage key through the real engine, provider and settings; a repeat after
 * a reload is practice; storage that is blocked or corrupt leaves the lesson fully usable; and
 * one confirmed action clears the key and the live state.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App.tsx';
import { serveContent, type ServedContent } from '../fixtures/serve-content.ts';
import { PROGRESS_KEY } from '../../src/platform/progress.ts';

const LESSON_PATH = '#/exercise/exercise-synthetic-feedback';

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

function storedProgress(): { attempts: Array<Record<string, unknown>> } {
  const raw = localStorage.getItem(PROGRESS_KEY) ?? '{}';
  return JSON.parse(raw) as { attempts: Array<Record<string, unknown>> };
}

/** Opens the exercise and answers the first checkpoint correctly. */
async function answerFirstCheckpointCorrectly(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  globalThis.location.hash = LESSON_PATH;
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Abstract exercise: an invented signalling loop',
    );
  });
  fireEvent.change(screen.getByLabelText('Lesson position'), { target: { value: '2700' } });
  await user.click(screen.getByRole('button', { name: 'Play' }));
  await screen.findByRole('heading', { name: /Practice question/ });
  await user.click(screen.getByRole('radio', { name: 'The Peripheral structure releases Gamma.' }));
  await user.click(screen.getByRole('button', { name: 'Check answer' }));
  expect(screen.getByText('Correct.')).toBeInTheDocument();
}

describe('attempts reach local storage', () => {
  it('records one first attempt, the exposure and a skip without leaving the page', async () => {
    const user = userEvent.setup();
    await answerFirstCheckpointCorrectly(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Lesson position')).toHaveValue('3000');
    });
    await user.click(screen.getByRole('button', { name: 'Pause' }));

    const record = storedProgress();
    expect(record.attempts).toHaveLength(1);
    expect(record.attempts[0]).toMatchObject({
      questionId: 'pred-fictional-next',
      familyId: 'family-fictional-sequence',
      selectedOptionId: 'pred-fictional-next-gamma',
      correct: true,
      firstAttempt: true,
      assisted: false,
    });
    expect(localStorage.getItem(PROGRESS_KEY)).toContain('family-fictional-sequence');
  });

  it('shows "Saved on this device" only after a real write', async () => {
    const user = userEvent.setup();
    await answerFirstCheckpointCorrectly(user);

    await user.click(screen.getByText('Settings'));
    expect(screen.getByText('Saved on this device.')).toBeInTheDocument();
  });

  it('classifies a repeat after reload as practice, never a first attempt', async () => {
    const user = userEvent.setup();
    await answerFirstCheckpointCorrectly(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    cleanup();

    await answerFirstCheckpointCorrectly(user);

    expect(screen.getByText(/this attempt is practice rather than a first try/)).toBeInTheDocument();
    const record = storedProgress();
    expect(record.attempts).toHaveLength(2);
    expect(record.attempts[1]).toMatchObject({ firstAttempt: false, exposedBefore: true });
  });
});

describe('storage that fails', () => {
  it('keeps the lesson fully usable when storage is denied, with one notice', async () => {
    const realStorage = globalThis.localStorage;
    const original = Object.getOwnPropertyDescriptor(globalThis.window, 'localStorage');
    Object.defineProperty(globalThis.window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('storage denied');
      },
    });
    try {
      const user = userEvent.setup();
      globalThis.location.hash = LESSON_PATH;
      render(<App />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'Abstract exercise: an invented signalling loop',
        );
      });
      fireEvent.change(screen.getByLabelText('Lesson position'), { target: { value: '2700' } });
      await user.click(screen.getByRole('button', { name: 'Play' }));
      await screen.findByRole('heading', { name: /Practice question/ });

      await user.click(screen.getByRole('radio', { name: 'The Peripheral structure releases Gamma.' }));
      await user.click(screen.getByRole('button', { name: 'Check answer' }));

      // Teaching still works in memory; the notice appears once and names the limitation.
      expect(screen.getByText('Correct.')).toBeInTheDocument();
      expect(screen.getByText(/Progress cannot be saved in this browser\./)).toBeInTheDocument();
      expect(screen.getAllByText(/Progress cannot be saved/)).toHaveLength(1);
      expect(realStorage.getItem(PROGRESS_KEY)).toBe(null);
    } finally {
      if (original) Object.defineProperty(globalThis.window, 'localStorage', original);
    }
  });

  it('resets corrupt data with a notice instead of breaking the lesson', async () => {
    localStorage.setItem(PROGRESS_KEY, '{not a record');
    globalThis.location.hash = LESSON_PATH;
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Abstract exercise: an invented signalling loop',
      );
    });
    expect(
      screen.getByText(/Saved progress could not be read and has been reset on this device\./),
    ).toBeInTheDocument();

    // The lesson itself is untouched by the bad data.
    expect(screen.getByRole('button', { name: 'Start journey' })).toBeEnabled();
  });

  it('merges a concurrent tab without losing either record', async () => {
    const user = userEvent.setup();
    await answerFirstCheckpointCorrectly(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Pause' }));

    // A second tab answered the second question and skipped nothing; it writes its own record.
    const otherTab = {
      version: 1,
      contentVersion: '0.1.0',
      completed: [],
      attempts: [
        {
          attemptId: 'other-tab-attempt',
          contentVersion: '0.1.0',
          timelineId: 'exercise-synthetic-feedback',
          questionId: 'pred-fictional-feedback',
          familyId: 'family-fictional-feedback',
          objectiveId: 'obj-fictional-feedback',
          selectedOptionId: 'pred-fictional-feedback-down',
          correct: true,
          firstAttempt: true,
          assisted: false,
          exposedBefore: false,
          at: 999,
        },
      ],
      exposedFamilyIds: ['family-fictional-feedback'],
      exposureTruncated: false,
      history: [],
    };
    window.dispatchEvent(
      new StorageEvent('storage', { key: PROGRESS_KEY, newValue: JSON.stringify(otherTab) }),
    );

    // The merged exposure reaches this lesson: the second question is announced as practice.
    fireEvent.change(screen.getByLabelText('Lesson position'), { target: { value: '4400' } });
    await user.click(screen.getByRole('button', { name: 'Play' }));
    await screen.findByRole('heading', { name: /Practice question/ });
    expect(screen.getByText(/this attempt is practice rather than a first try/)).toBeInTheDocument();

    // This tab's next write merges both records: my first answer, the other tab's answer, and
    // my second answer — three stable ids, nothing duplicated or lost.
    await user.click(screen.getByRole('radio', { name: 'Alpha release goes down.' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await waitFor(() => {
      const record = storedProgress();
      expect(record.attempts.some((attempt) => attempt['attemptId'] === 'other-tab-attempt')).toBe(
        true,
      );
    });
    const record = storedProgress();
    expect(record.attempts).toHaveLength(3);
    // Merged attempts are ordered by their local timestamp; the other tab's is the oldest.
    expect(record.attempts.map((attempt) => attempt['attemptId'])).toEqual([
      'other-tab-attempt',
      expect.any(String),
      expect.any(String),
    ]);
    expect(
      record.attempts.filter((attempt) => attempt['questionId'] === 'pred-fictional-feedback'),
    ).toHaveLength(2);
  });
});

describe('clearing local progress', () => {
  it('clears the key and the live progress with one confirmed action', async () => {
    const user = userEvent.setup();
    await answerFirstCheckpointCorrectly(user);
    expect(localStorage.getItem(PROGRESS_KEY)).not.toBe(null);

    await user.click(screen.getByText('Settings'));
    await user.click(screen.getByRole('button', { name: 'Clear lesson progress' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Confirm deletion' });
    await user.click(within(dialog).getByRole('button', { name: 'Yes, delete it' }));

    expect(localStorage.getItem(PROGRESS_KEY)).toBe(null);

    // Answering again after the reset is a first attempt once more.
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    fireEvent.change(screen.getByLabelText('Lesson position'), { target: { value: '2700' } });
    await user.click(screen.getByRole('button', { name: 'Play' }));
    await screen.findByRole('heading', { name: /Practice question/ });
    expect(
      screen.queryByText(/this attempt is practice rather than a first try/),
    ).not.toBeInTheDocument();
  });
});
