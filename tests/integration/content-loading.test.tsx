/**
 * Loading and failure behaviour (document 10 reliability table, AC-14).
 *
 * The loader is exercised through the real application: a manifest pointer, a hash-named bundle,
 * and the recovery each failure must produce.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App.tsx';
import { loadContent } from '../../src/content/loader.ts';
import { serveContent, type ServedContent } from '../fixtures/serve-content.ts';

let served: ServedContent | null = null;

beforeEach(() => {
  localStorage.clear();
  globalThis.location.hash = '#/explore';
});

afterEach(() => {
  served?.restore();
  served = null;
  globalThis.location.hash = '';
});

describe('successful load', () => {
  it('requests the manifest first and then the hash-named bundle', async () => {
    served = await serveContent();
    const result = await loadContent({ manifestPath: 'content/manifest.json' });
    expect(result.ok).toBe(true);
    expect(served.requests[0]).toBe('content/manifest.json');
    expect(served.requests[1]).toBe(served.manifest.bundlePath);
  });
});

describe('failure recovery', () => {
  it('keeps navigation and offers a retry when the network fails', async () => {
    served = await serveContent({ offline: true });
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be downloaded/i);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About and sources' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('retries once per click, with at most one request in flight', async () => {
    const user = userEvent.setup();
    served = await serveContent({ offline: true });
    render(<App />);
    await screen.findByRole('alert');

    const before = served.requests.length;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => {
      expect(served!.requests.length).toBeGreaterThan(before);
    });
    expect(served.requests.length).toBe(before + 1);
  });

  it('refuses a bundle whose delivered bytes do not match the manifest hash', async () => {
    served = await serveContent({ corruptBundle: true });
    const result = await loadContent({ manifestPath: 'content/manifest.json' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('CONTENT_HASH');

    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/published fingerprint/i);
  });

  it('refuses a bundle the application build does not expect', async () => {
    served = await serveContent();
    const result = await loadContent({
      manifestPath: 'content/manifest.json',
      expectedContentVersion: '9.9.9',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('CONTENT_VERSION');
      expect(result.detail).toContain('9.9.9');
    }
  });

  it('refuses an unsupported schema version rather than guessing a migration', async () => {
    served = await serveContent();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () =>
      Promise.resolve(
        new Response('{"schemaVersion": 99}', { status: 200 }),
      );
    const result = await loadContent({ manifestPath: 'content/manifest.json' });
    globalThis.fetch = originalFetch;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('CONTENT_VERSION');
  });

  it('reports a manifest that does not match its schema', async () => {
    served = await serveContent();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () =>
      Promise.resolve(
        new Response('{"schemaVersion": 1, "catalog": "not-an-array"}', { status: 200 }),
      );
    const result = await loadContent({ manifestPath: 'content/manifest.json' });
    globalThis.fetch = originalFetch;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('CONTENT_SCHEMA');
  });

  it('reports malformed JSON as a schema failure', async () => {
    served = await serveContent();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () =>
      Promise.resolve(new Response('{not json', { status: 200 }));
    const result = await loadContent({ manifestPath: 'content/manifest.json' });
    globalThis.fetch = originalFetch;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('CONTENT_SCHEMA');
  });

  it('reports an HTTP error as a network failure', async () => {
    served = await serveContent();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => Promise.resolve(new Response('nope', { status: 503 }));
    const result = await loadContent({ manifestPath: 'content/manifest.json' });
    globalThis.fetch = originalFetch;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail).toContain('503');
  });

  it('gives up after the load timeout instead of spinning forever', async () => {
    served = await serveContent();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new Error('aborted'));
        });
      })) as unknown as typeof fetch;
    const result = await loadContent({ manifestPath: 'content/manifest.json', timeoutMs: 10 });
    globalThis.fetch = originalFetch;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('CONTENT_NETWORK');
  });
});
