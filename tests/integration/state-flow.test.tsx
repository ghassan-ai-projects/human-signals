/**
 * The parallel human state, end to end (work package 7, AC-04 at fixture level).
 *
 * The invented alarm state plays through three tracks of different speeds on one shared
 * cursor: simultaneous events keep their authored order, a shared structure is highlighted
 * twice by authored schedule, trends persist until an authored event changes them, and the
 * state's own checkpoints ask about fast-versus-slow timing. No numeric biological value is
 * ever shown.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App.tsx';
import { serveContent, type ServedContent } from '../fixtures/serve-content.ts';

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

async function openState(): Promise<void> {
  globalThis.location.hash = '#/state/state-fictional-alarm';
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'The invented alarm state',
    );
  });
}

describe('the states catalog', () => {
  it('lists the invented state with its track summary', async () => {
    globalThis.location.hash = '#/states';
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Human states');
    });

    const card = screen.getByRole('link', { name: /The invented alarm state/ }).closest('li');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText(/3 parallel tracks/)).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText(/Fast route/)).toBeInTheDocument();
  });
});

describe('playing the parallel state', () => {
  it('shows per-track steps and simultaneous events in their authored order', async () => {
    const user = userEvent.setup();
    await openState();

    // Step to the 5 s instant: the fast route acts while the carried route's trend is set.
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByLabelText('Lesson position')).toHaveValue('5000');

    const panel = screen.getByRole('region', { name: 'What is happening now' });
    // Fast track at its own step:
    expect(within(panel).getByText(/The fast route reaches the intermediary structure first/)).toBeInTheDocument();
    // Carried track still at its initial authored step:
    expect(
      within(panel).getByText(/The slower route leaves the trigger at the same time as the fast one/),
    ).toBeInTheDocument();
    // The simultaneous event on the carried track wrote the trend:
    expect(trendItem(panel, 'Alpha (invented) is increasing in this scenario')).toBeDefined();
    // Track order is the authored order, not render order:
    const headings = within(panel).getAllByRole('heading', { level: 3 });
    expect(headings[0]).toHaveTextContent('Fast route (invented)');
    expect(headings[1]).toHaveTextContent('Slower carried route (invented)');
    expect(headings[2]).toHaveTextContent('Slowest regulation (invented)');
  });

  it('keeps biological timing qualitative and independent per track', async () => {
    await openState();

    fireEvent.change(screen.getByLabelText('Lesson position'), { target: { value: '5000' } });
    const panel = screen.getByRole('region', { name: 'What is happening now' });
    expect(within(panel).getAllByText(/First: the fast route/).length).toBeGreaterThan(0);
    expect(within(panel).getAllByText(/Ordering only/).length).toBeGreaterThan(0);
    expect(within(panel).getAllByText(/Presentation time is not biological time/).length).toBeGreaterThan(0);
    // No numeric biological value appears in the track panel.
    expect(within(panel).queryByText(/\bms\b|milliseconds|\bseconds\b/)).not.toBeInTheDocument();
  });

  it('applies the authored shared-organ schedule: the carried route re-highlights later', async () => {
    await openState();

    // After the fast route acts, its caption names the shared structure.
    fireEventSeek(20000);
    let panel = screen.getByRole('region', { name: 'What is happening now' });
    expect(within(panel).getByText(/The fast route reaches the intermediary structure first/)).toBeInTheDocument();

    // After the carried route acts on the same structure, the carried track says so.
    fireEventSeek(45000);
    panel = screen.getByRole('region', { name: 'What is happening now' });
    expect(within(panel).getByText(/The slower route now acts on the intermediary structure too/)).toBeInTheDocument();
    // The regulating track has still not joined at this point.
    expect(within(panel).getByText(/The slowest track has not joined yet/)).toBeInTheDocument();
  });

  it('changes trends only at authored events and never resets by itself', async () => {
    await openState();

    fireEventSeek(5000);
    let panel = screen.getByRole('region', { name: 'What is happening now' });
    expect(trendItem(panel, 'Alpha (invented) is increasing in this scenario')).toBeDefined();

    // The regulating track overwrites the carried trend at 60 s (authored, not automatic).
    fireEventSeek(60000);
    panel = screen.getByRole('region', { name: 'What is happening now' });
    expect(trendItem(panel, 'Beta (invented) is staying raised in this scenario')).toBeDefined();
    expect(trendItem(panel, 'Alpha (invented) is decreasing in this scenario')).toBeDefined();

    // At the very end, the authored end state persists; no invented return to baseline.
    fireEventSeek(90000);
    panel = screen.getByRole('region', { name: 'What is happening now' });
    expect(trendItem(panel, 'Alpha (invented) is decreasing in this scenario')).toBeDefined();
  });

  it('asks its own state question and classifies a repeat after reload as practice', async () => {
    const user = userEvent.setup();
    await openState();

    fireEventSeek(19900);
    await user.click(screen.getByRole('button', { name: 'Play' }));
    await screen.findByRole('heading', { name: /Practice question/ });
    expect(screen.getByText(/Which one acts on the target first/)).toBeInTheDocument();

    await user.click(
      screen.getByRole('radio', { name: 'The fast route, before the carried route arrives.' }),
    );
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('Correct.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    cleanup();

    // A fresh pass: the previously answered family opens as practice.
    await openState();
    fireEventSeek(19900);
    await user.click(screen.getByRole('button', { name: 'Play' }));
    await screen.findByRole('heading', { name: /Practice question/ });
    expect(screen.getByText(/this attempt is practice rather than a first try/)).toBeInTheDocument();
  });
});

describe('the focused-track view', () => {
  it('collapses other tracks to summaries and restores them, without touching the transcript', async () => {
    const user = userEvent.setup();
    await openState();

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByLabelText('Lesson position')).toHaveValue('5000');

    const panel = screen.getByRole('region', { name: 'What is happening now' });
    const fastTrack = within(panel).getByRole('article', { name: 'Fast route (invented) track' });
    await user.click(within(fastTrack).getByRole('button', { name: 'Focus this track' }));

    // Focused: the fast track keeps its full caption; other tracks collapse to summaries.
    expect(within(panel).getByText(/Focused view: the other tracks are summarised/)).toBeInTheDocument();
    const carriedTrack = within(panel).getByRole('article', { name: 'Slower carried route (invented) track' });
    expect(within(carriedTrack).queryByText(/The slower route leaves the trigger at the same time/)).not.toBeInTheDocument();
    expect(within(carriedTrack).getByText('The carried route leaves too')).toBeInTheDocument();

    // The transcript keeps every track's contribution.
    const transcript = screen.getByRole('region', { name: 'Causal transcript' });
    expect(
      within(transcript).getAllByText(/The slower route leaves the trigger at the same time/).length,
    ).toBeGreaterThan(0);

    // Restoring brings the full caption back.
    await user.click(within(fastTrack).getByRole('button', { name: 'Show all tracks' }));
    expect(
      within(panel).getByText(/The slower route leaves the trigger at the same time as the fast one/),
    ).toBeInTheDocument();
  });
});

/** Trend rows split their text across elements; match on the whole row's text content. */
function trendItem(panel: HTMLElement, includes: string): HTMLElement | undefined {
  return within(panel)
    .getAllByRole('listitem')
    .find((item) => item.textContent?.includes(includes));
}

/** Seeks by setting the scrubber, which pauses at the destination like a learner drag would. */
function fireEventSeek(ms: number): void {
  fireEvent.change(screen.getByLabelText('Lesson position'), { target: { value: String(ms) } });
  void waitFor;
}
