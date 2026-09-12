/**
 * The two-signal comparison, end to end (work package 5, AC-08).
 *
 * Selectors prompt in order, the same signal is rejected politely, the eight authored
 * dimensions stay aligned by row with per-cell evidence, a not-comparable value keeps its
 * authored reason, and the URL carries the pair and depth so it can be shared and reloaded.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
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

async function openCompare(hash = '#/compare'): Promise<void> {
  globalThis.location.hash = hash;
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Compare two signals');
  });
}

describe('choosing signals', () => {
  it('prompts for a second signal after the first choice', async () => {
    const user = userEvent.setup();
    await openCompare();

    await user.selectOptions(screen.getByLabelText('First signal'), 'sig-alpha');
    expect(screen.getByText(/is in the first column/)).toBeInTheDocument();
    expect(globalThis.location.hash).toContain('a=sig-alpha');
  });

  it('rejects the same signal politely and keeps asking', async () => {
    await openCompare('#/compare?a=sig-alpha&b=sig-alpha');

    expect(
      screen.getByText(/Comparison needs two different signals/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Second signal')).toBeInTheDocument();
  });

  it('shows the full aligned table once both signals are chosen', async () => {
    const user = userEvent.setup();
    await openCompare();

    await user.selectOptions(screen.getByLabelText('First signal'), 'sig-alpha');
    await user.selectOptions(screen.getByLabelText('Second signal'), 'sig-beta');

    const table = screen.getByRole('table');
    for (const dimension of [
      'Signal type',
      'Principal sources in covered contexts',
      'Transport mode',
      'Targets and context',
      'Effects',
      'Timing description',
      'Feedback and regulation',
      'Common misconception',
    ]) {
      expect(within(table).getByRole('rowheader', { name: dimension })).toBeInTheDocument();
    }
    expect(within(table).getAllByRole('rowheader')).toHaveLength(9);
    expect(globalThis.location.hash).toContain('a=sig-alpha');
    expect(globalThis.location.hash).toContain('b=sig-beta');
  });

  it('updates only the second column when the second choice changes', async () => {
    const user = userEvent.setup();
    await openCompare('#/compare?a=sig-alpha&b=sig-beta');
    const table = await screen.findByRole('table');
    expect(within(table).getAllByText('The middle structure.')).toHaveLength(1);

    await user.selectOptions(screen.getByLabelText('Second signal'), 'sig-gamma');

    expect(globalThis.location.hash).toContain('b=sig-gamma');
    const updated = screen.getByRole('table');
    // Alpha's authored text is untouched; Gamma's cell appears in its place.
    expect(within(updated).queryAllByText('The middle structure.')).toHaveLength(0);
    expect(within(updated).getAllByText('The peripheral structure.')).toHaveLength(1);
  });
});

describe('authored values', () => {
  it('labels a not-comparable value with its authored reason instead of inventing one', async () => {
    await openCompare('#/compare?a=sig-alpha&b=sig-gamma');

    const table = await screen.findByRole('table');
    const row = within(table).getByRole('row', { name: /Common misconception/ });
    expect(within(row).getByText(/Not comparable here\./)).toBeInTheDocument();
    expect(within(row).getByText(/Not a punishment signal\./)).toBeInTheDocument();
  });

  it('opens the evidence behind a cell, closes with Escape and restores focus', async () => {
    const user = userEvent.setup();
    await openCompare('#/compare?a=sig-alpha&b=sig-beta');

    const table = await screen.findByRole('table');
    const typeRow = within(table).getByRole('row', { name: /Signal type/ });
    const trigger = within(typeRow).getAllByRole('button', { name: 'Evidence' })[0]!;
    await user.click(trigger);

    const evidence = await screen.findByRole('complementary', { name: /^Evidence:/ });
    expect(within(evidence).getByRole('heading', { name: 'What is claimed' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('complementary', { name: /^Evidence:/ })).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('prompts for the missing first signal when only the second is given', async () => {
    await openCompare('#/compare?b=sig-beta');

    expect(screen.getByText(/is in the second column/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('recovers from malformed identifiers without substituting content', async () => {
    await openCompare('#/compare?a=SIG-ALPHA&b=' + 'x'.repeat(200));

    expect(screen.getByText(/That comparison is not available/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows the curated pair essay when the pair is curated', async () => {
    await openCompare('#/compare?a=sig-alpha&b=sig-beta');

    expect(screen.getByRole('heading', { name: 'Alpha and Beta in the invented loop' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Evidence for this comparison' })).toBeInTheDocument();
  });

  it('offers the curated pairs as starting points from an empty compare', async () => {
    const user = userEvent.setup();
    await openCompare('#/compare');

    await user.click(screen.getByRole('button', { name: 'Alpha and Beta in the invented loop' }));

    expect(globalThis.location.hash).toContain('a=sig-alpha');
    expect(globalThis.location.hash).toContain('b=sig-beta');
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});

describe('addresses and recovery', () => {
  it('reloads a shared pair at the requested depth', async () => {
    await openCompare('#/compare?a=sig-alpha&b=sig-beta&depth=mechanism');

    const table = await screen.findByRole('table');
    const row = within(table).getByRole('row', { name: /Signal type/ });
    // The mechanism wording differs from the intro wording of the same authored cell.
    expect(within(row).getAllByText(/no real class applies/).length).toBeGreaterThan(0);
  });

  it('recovers from an unknown signal without substituting one', async () => {
    await openCompare('#/compare?a=sig-does-not-exist');

    expect(screen.getByText(/That comparison is not available/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse what is published/i })).toBeInTheDocument();
  });
});
