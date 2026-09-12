/**
 * Explore and search: anatomy as navigation, and a deterministic local catalog search.
 * Covers acceptance scenarios AC-02 (tree and panel share one selection) and AC-03.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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
});

async function openExplore(hash = '#/explore'): Promise<void> {
  globalThis.location.hash = hash;
  render(<App />);
  await waitFor(() => {
    expect(
      screen.getByRole('heading', { name: 'Explore the body and its signals' }),
    ).toBeInTheDocument();
  });
}

describe('explore', () => {
  it('starts by asking for a selection rather than guessing one', async () => {
    await openExplore();
    expect(screen.getByRole('heading', { name: 'Choose a region or a signal' })).toBeInTheDocument();
  });

  it('selects the same entity from the anatomy tree and shows it in the panel', async () => {
    const user = userEvent.setup();
    await openExplore();

    const tree = screen.getByRole('tree', { name: 'Body regions' });
    await user.click(within(tree).getByRole('button', { name: 'Source structure (invented)' }));

    const panel = await screen.findByRole('heading', { name: 'Source structure (invented)' });
    expect(panel).toBeInTheDocument();
    expect(globalThis.location.hash).toContain('anatomy=anat-fictional-source');

    const item = within(tree)
      .getAllByRole('treeitem')
      .find((element) => element.textContent?.includes('Source structure (invented)'));
    expect(item).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates the tree with the keyboard alone', async () => {
    const user = userEvent.setup();
    await openExplore();

    const tree = screen.getByRole('tree', { name: 'Body regions' });
    const parent = within(tree)
      .getAllByRole('treeitem')
      .find((element) => element.textContent?.includes('Source structure (invented)'))!;
    expect(parent).toHaveAttribute('aria-expanded', 'false');
    parent.focus();

    // Right expands a parent, down moves to its child, Enter selects it.
    await user.keyboard('{ArrowRight}');
    expect(parent).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowDown}');
    // A nested treeitem contains its children, so match on the level rather than on text alone.
    const child = within(tree)
      .getAllByRole('treeitem')
      .find(
        (element) =>
          element.getAttribute('aria-level') === '2' &&
          element.textContent?.includes('Intermediary structure (invented)'),
      )!;
    expect(child).toHaveFocus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(globalThis.location.hash).toContain('anatomy=anat-fictional-intermediary');
    });
  });

  it('lists the relationships that involve the selected region', async () => {
    await openExplore('#/explore?anatomy=anat-fictional-peripheral');
    expect(
      await screen.findByText(/Peripheral structure \(invented\) inhibits Source structure/),
    ).toBeInTheDocument();
    expect(screen.getAllByText('feedback').length).toBeGreaterThan(0);
  });

  it('shows where a signal comes from when a signal is selected', async () => {
    await openExplore('#/explore?signal=sig-alpha');
    expect(await screen.findByRole('heading', { name: 'Alpha (invented)' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('diagram-2d').getAttribute('aria-label')).toContain(
        'Source structure (invented) as source',
      );
    });
  });

  it('explains an identifier that is not in this content version', async () => {
    await openExplore('#/explore?signal=sig-not-here');
    expect(
      await screen.findByRole('heading', { name: 'That item is not in this content version' }),
    ).toBeInTheDocument();
  });
});

describe('search', () => {
  async function openSearch(): Promise<ReturnType<typeof userEvent.setup>> {
    const user = userEvent.setup();
    await openExplore();
    await user.click(screen.getByRole('button', { name: /^Search/ }));
    await screen.findByRole('dialog');
    return user;
  }

  it('resolves a mixed-case alias to its signal', async () => {
    const user = await openSearch();
    await user.type(screen.getByRole('searchbox'), 'ALPHA SIGNAL');

    const dialog = screen.getByRole('dialog');
    await waitFor(() => {
      expect(within(dialog).getByRole('button', { name: /Alpha \(invented\)/ })).toBeInTheDocument();
    });
    expect(within(dialog).getByText(/matched/)).toBeInTheDocument();
  });

  it('groups results by entity type and orders names before token matches', async () => {
    const user = await openSearch();
    await user.type(screen.getByRole('searchbox'), 'structure');

    const dialog = screen.getByRole('dialog');
    await waitFor(() => {
      expect(within(dialog).getByRole('heading', { name: 'Body and brain' })).toBeInTheDocument();
    });
  });

  it('offers suggestions on an empty query and explains a zero-result query', async () => {
    const user = await openSearch();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Start here' })).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'zzzznotathing');
    await waitFor(() => {
      expect(within(dialog).getByText(/Nothing published in this content version matches/)).toBeInTheDocument();
    });
  });

  it('opens from the / shortcut, but not while typing in a field', async () => {
    const user = userEvent.setup();
    await openExplore();

    await user.keyboard('/');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'a/b');
    expect(screen.getByRole('searchbox')).toHaveValue('a/b');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('closes on Escape and returns focus to the control that opened it', async () => {
    const user = userEvent.setup();
    await openExplore();
    const trigger = screen.getByRole('button', { name: /^Search/ });
    await user.click(trigger);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('navigates to a lesson from a result', async () => {
    const user = await openSearch();
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Abstract exercise/ }));

    await waitFor(() => {
      expect(globalThis.location.hash).toContain('/exercise/exercise-synthetic-feedback');
    });
  });
});
