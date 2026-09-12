/**
 * The primary learning loop, end to end, with no 3D dependency (work package 3).
 *
 * These tests drive the real application: the real loader over a stubbed static host, the real
 * engine, and the real 2D renderer.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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

async function openLesson(path = LESSON_PATH): Promise<void> {
  globalThis.location.hash = path;
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Abstract exercise: an invented signalling loop',
    );
  });
}

describe('opening a lesson', () => {
  it('loads paused on the overview with the whole stage sequence visible', async () => {
    await openLesson();

    expect(screen.getByRole('heading', { name: 'What this lesson covers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start journey' })).toBeInTheDocument();

    const stages = screen.getByRole('navigation', { name: 'Lesson stages' });
    for (const label of [
      'The Source structure releases Alpha',
      'Alpha travels to the Intermediary structure',
      'The Intermediary structure responds',
      'The Peripheral structure releases Gamma',
      'Gamma inhibits the Source structure',
    ]) {
      expect(within(stages).getByText(label)).toBeInTheDocument();
    }
  });

  it('does not autoplay, and the scrubber measures presentation time only', async () => {
    await openLesson();
    const scrubber = screen.getByLabelText('Lesson position');
    expect(scrubber).toHaveValue('0');
    expect(
      screen.getByText(/measures presentation time in the lesson, not time in the body/i),
    ).toBeInTheDocument();
  });

  it('shows the scenario assumptions and what the lesson leaves out', async () => {
    await openLesson();
    expect(screen.getAllByText(/Scenario assumptions/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: 'What this lesson simplifies' }),
    ).toBeInTheDocument();
  });
});

describe('stepping through a lesson without a pointer', () => {
  it('advances one authored step at a time and keeps the diagram in step', async () => {
    const user = userEvent.setup();
    await openLesson();

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByLabelText('Lesson position')).toHaveValue('1000');

    const diagram = screen.getByTestId('diagram-2d');
    await waitFor(() => {
      expect(diagram.getAttribute('aria-label')).toContain('Alpha stimulates');
    });

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByLabelText('Lesson position')).toHaveValue('2000');
    await user.click(screen.getByRole('button', { name: 'Previous step' }));
    expect(screen.getByLabelText('Lesson position')).toHaveValue('1000');
  });

  it('seeks to an authored step from the stage strip and stays paused', async () => {
    const user = userEvent.setup();
    await openLesson();

    const stages = screen.getByRole('navigation', { name: 'Lesson stages' });
    await user.click(within(stages).getByText('Gamma inhibits the Source structure'));

    expect(screen.getByLabelText('Lesson position')).toHaveValue('5000');
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(globalThis.location.hash).toContain('step=exercise-synthetic-feedback-step-feedback');
  });

  it('reads the same relationships in the transcript as the diagram shows', async () => {
    const user = userEvent.setup();
    await openLesson();
    await user.click(screen.getByRole('button', { name: 'Next step' }));

    const transcript = screen.getByRole('region', { name: 'Causal transcript' });
    expect(
      within(transcript).getAllByText(/Source structure \(invented\) stimulates/)[0],
    ).toBeInTheDocument();
    expect(
      within(transcript).getAllByText(/Peripheral structure \(invented\) inhibits/)[0],
    ).toBeInTheDocument();
  });
});

describe('inspecting a relationship', () => {
  it('opens Why, follows a deeper question and returns by breadcrumb', async () => {
    const user = userEvent.setup();
    await openLesson();

    const transcript = screen.getByRole('region', { name: 'Causal transcript' });
    await user.click(
      within(transcript).getAllByRole('button', {
        name: /^Why\? Alpha stimulates the Intermediary structure/,
      })[0]!,
    );

    const why = await screen.findByRole('complementary', { name: /stimulates/ });
    expect(
      within(why).getByRole('heading', { name: /Why does the Source structure act/ }),
    ).toBeInTheDocument();

    await user.click(within(why).getByRole('button', { name: /How does Alpha reach/ }));
    expect(
      within(why).getByText(/This is the deepest explanation in this lesson/),
    ).toBeInTheDocument();

    await user.click(within(why).getByRole('button', { name: /Why does the Source structure act/ }));
    expect(within(why).getByRole('button', { name: /How does Alpha reach/ })).toBeInTheDocument();
  });

  it('shows a categorical evidence badge and says the content is draft', async () => {
    const user = userEvent.setup();
    await openLesson();

    const transcript = screen.getByRole('region', { name: 'Causal transcript' });
    await user.click(
      within(transcript).getAllByRole('button', {
        name: /^Why\? Alpha stimulates the Intermediary structure/,
      })[0]!,
    );
    const why = await screen.findByRole('complementary', { name: /stimulates/ });

    expect(within(why).getByText(/Supported/)).toBeInTheDocument();
    expect(within(why).getByText(/not yet checked by a qualified reviewer/i)).toBeInTheDocument();

    await user.click(within(why).getByRole('button', { name: 'Evidence and limits' }));
    const evidence = await screen.findByRole('complementary', { name: /^Evidence:/ });
    expect(within(evidence).getByRole('heading', { name: 'What is claimed' })).toBeInTheDocument();
    expect(within(evidence).getByRole('heading', { name: 'Where it applies' })).toBeInTheDocument();
    expect(
      within(evidence).getByText(/No reference has been recorded for this claim yet/),
    ).toBeInTheDocument();
  });

  it('closes the panel with Escape', async () => {
    const user = userEvent.setup();
    await openLesson();
    const transcript = screen.getByRole('region', { name: 'Causal transcript' });
    await user.click(within(transcript).getAllByRole('button', { name: /^Why\?/ })[0]!);
    await screen.findByRole('complementary', { name: /stimulates/ });

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('complementary', { name: /stimulates/ })).not.toBeInTheDocument();
    });
  });
});

describe('depth', () => {
  it('changes the wording without changing the cursor or the relationships', async () => {
    const user = userEvent.setup();
    await openLesson();
    await user.click(screen.getByRole('button', { name: 'Next step' }));

    const before = screen.getByLabelText('Lesson position').getAttribute('value');
    const diagramBefore = screen.getByTestId('diagram-2d').getAttribute('aria-label');

    await user.click(screen.getByRole('radio', { name: /Mechanism/ }));

    expect(screen.getByLabelText('Lesson position')).toHaveValue(before);
    expect(screen.getByTestId('diagram-2d').getAttribute('aria-label')).toBe(diagramBefore);
    expect(globalThis.location.hash).toContain('depth=mechanism');
    expect(
      screen.getAllByText(/The route becomes visible and the Alpha trend is set to increasing/)
        .length,
    ).toBeGreaterThan(0);
  });
});

describe('deep links', () => {
  it('opens at the requested step, paused', async () => {
    await openLesson(`${LESSON_PATH}?step=exercise-synthetic-feedback-step-output&depth=standard`);
    await waitFor(() => {
      expect(screen.getByLabelText('Lesson position')).toHaveValue('3000');
    });
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('explains an unknown step instead of guessing one', async () => {
    await openLesson(`${LESSON_PATH}?step=exercise-synthetic-feedback-step-nowhere`);
    expect(screen.getByText(/not part of this lesson/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Lesson position')).toHaveValue('0');
  });

  it('recovers from an unknown lesson identifier without substituting another', async () => {
    globalThis.location.hash = '#/journey/j-does-not-exist';
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'That lesson is not available' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse what is published/ })).toBeInTheDocument();
  });
});
