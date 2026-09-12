/**
 * The search palette.
 *
 * Document 02: available from a visible button and from "/" when focus is not in an editable
 * control; matches names, aliases and glossary terms case-insensitively; groups results by entity
 * type; orders exact matches before prefix and token matches; explains empty and zero-result
 * states. It is a dialog, so it traps focus and closes on Escape, restoring the invoking control.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '../../app/ContentProvider.tsx';
import { usePreferences } from '../../app/PreferencesProvider.tsx';
import type { SearchKind, SearchResult } from '../../content/repository.ts';
import { exploreUrl, timelineUrl } from '../../app/urls.ts';
import styles from './SearchPalette.module.css';

const KIND_LABEL: Record<SearchKind, string> = {
  signal: 'Signals',
  journey: 'Signal journeys',
  state: 'Human states',
  exercise: 'Exercises',
  anatomy: 'Body and brain',
  concept: 'Ideas and terms',
};

function isEditable(element: Element | null): boolean {
  if (!element) return false;
  const tag = element.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (element as HTMLElement).isContentEditable
  );
}

export function SearchPalette(): React.JSX.Element | null {
  const { repository } = useContent();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const invoker = useRef<HTMLElement | null>(null);
  const inputId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === '/' && !open && !isEditable(document.activeElement)) {
        event.preventDefault();
        invoker.current = document.activeElement as HTMLElement | null;
        setOpen(true);
        return;
      }
      if (!open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === 'Tab' && dialogRef.current) {
        // Dialogs contain focus; persistent panels elsewhere deliberately do not.
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  // Opening moves focus into the dialog; closing restores it to the control that opened it.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      return;
    }
    invoker.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    if (!repository) return [];
    return repository.search(query, 24);
  }, [repository, query]);

  const grouped = useMemo(() => {
    const map = new Map<SearchKind, SearchResult[]>();
    for (const result of results) {
      map.set(result.kind, [...(map.get(result.kind) ?? []), result]);
    }
    return [...map.entries()];
  }, [results]);

  const openResult = useCallback(
    (result: SearchResult): void => {
      const depth = preferences.depth;
      const path =
        result.kind === 'journey' || result.kind === 'state' || result.kind === 'exercise'
          ? timelineUrl(result.id, result.kind, { depth })
          : exploreUrl({ kind: result.kind, id: result.id }, depth);
      void navigate(path);
      close();
    },
    [preferences.depth, navigate, close],
  );

  if (!repository) return null;

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={(event) => {
          invoker.current = event.currentTarget;
          setOpen(true);
        }}
      >
        Search
        <span className={styles.shortcut} aria-hidden="true">
          /
        </span>
      </button>

      {open && (
        <div className={styles.backdrop}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${inputId}-label`}
            ref={dialogRef}
          >
            <label id={`${inputId}-label`} htmlFor={inputId} className={styles.label}>
              Search signals, body regions, ideas and lessons
            </label>
            <div className={styles.inputRow}>
              <input
                id={inputId}
                ref={inputRef}
                type="search"
                value={query}
                autoComplete="off"
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                className={styles.input}
              />
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
              >
                Clear
              </button>
              <button type="button" onClick={close}>
                Close
              </button>
            </div>

            <div className={styles.results} aria-live="polite">
              {query.trim() === '' ? (
                <div>
                  <h2 className={styles.groupHeading}>Start here</h2>
                  <ul className={styles.list}>
                    {repository.bundle.timelines.slice(0, 5).map((timeline) => (
                      <li key={timeline.id}>
                        <button
                          type="button"
                          onClick={() => {
                            openResult({
                              id: timeline.id,
                              kind: timeline.kind,
                              label: timeline.label,
                              matched: timeline.label,
                              rank: 0,
                            });
                          }}
                        >
                          {timeline.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : results.length === 0 ? (
                <p className={styles.emptyState}>
                  Nothing published in this content version matches &ldquo;{query}&rdquo;. Try a
                  different word, or browse the catalog in Explore.
                </p>
              ) : (
                grouped.map(([kind, items]) => (
                  <div key={kind}>
                    <h2 className={styles.groupHeading}>{KIND_LABEL[kind]}</h2>
                    <ul className={styles.list}>
                      {items.map((result) => (
                        <li key={result.id}>
                          <button
                            type="button"
                            onClick={() => {
                              openResult(result);
                            }}
                          >
                            <span>{result.label}</span>
                            {result.matched !== result.label && (
                              <span className={styles.matched}>matched “{result.matched}”</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
