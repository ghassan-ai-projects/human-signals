import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { SearchPalette } from '../features/search/SearchPalette.tsx';
import { SettingsPanel } from '../features/settings/SettingsPanel.tsx';
import { usePreferences } from './PreferencesProvider.tsx';
import { useContent } from './ContentProvider.tsx';
import { ProgressProvider, useOptionalProgress } from './ProgressProvider.tsx';
import { learnUrl, compareUrl } from './urls.ts';
import styles from './AppShell.module.css';
import { cx } from '../styles/cx.ts';

const NAV = [
  { to: '/explore', label: 'Explore' },
  { to: '/states', label: 'Human States' },
  { to: compareUrl(), label: 'Compare' },
  { to: learnUrl(), label: 'Learn' },
  { to: '/about', label: 'About & sources' },
] as const;

/**
 * The persistent application frame. It survives a content failure so that navigation, About and
 * retry always remain available (document 02, Home empty/error behaviour).
 *
 * Progress mounts once the content version is known, around the header as well as the page, so
 * the settings panel and the storage notices see it; until then everything renders without it.
 */
export function AppShell({ children }: { children: ReactNode }): React.JSX.Element {
  const content = useContent();
  const frame = (
    <>
      <ShellHeader />
      <div className={styles.body}>{children}</div>
    </>
  );

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">
        Skip to main content
      </a>
      {__APP_MODE__ !== 'production' && (
        <p className={styles.previewBanner} role="status">
          <strong>Draft preview.</strong> Content has not been scientifically reviewed and must not
          be used as a reference.
        </p>
      )}
      {content.repository ? (
        <ProgressProvider contentVersion={content.repository.manifest.contentVersion}>
          {frame}
        </ProgressProvider>
      ) : (
        frame
      )}
    </div>
  );
}

function ShellHeader(): React.JSX.Element {
  const { storageNotice, dismissStorageNotice, resetPreferences } = usePreferences();
  const progress = useOptionalProgress();

  return (
    <>
      <header className={styles.header}>
        <NavLink to="/" className={cx(styles.brand)}>
          Human&nbsp;Signals
        </NavLink>
        <nav aria-label="Primary">
          <ul className={styles.nav}>
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => cx(isActive ? styles.navLinkActive : styles.navLink)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.tools}>
          <SearchPalette />
          <SettingsPanel
            {...(progress
              ? {
                  onClearProgress: progress.clearProgress,
                  onClearAll: () => {
                    progress.clearProgress();
                    resetPreferences();
                  },
                }
              : {})}
          />
        </div>
      </header>
      {storageNotice !== null && (
        <p className={styles.storageNotice} role="status">
          {storageNotice}{' '}
          <button type="button" onClick={dismissStorageNotice} className={styles.noticeDismiss}>
            Dismiss
          </button>
        </p>
      )}
      {progress?.storageNotice != null && (
        <p className={styles.storageNotice} role="status">
          {progress.storageNotice}{' '}
          <button
            type="button"
            onClick={progress.dismissStorageNotice}
            className={styles.noticeDismiss}
          >
            Dismiss
          </button>
        </p>
      )}
    </>
  );
}
