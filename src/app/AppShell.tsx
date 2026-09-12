import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import styles from './AppShell.module.css';
import { cx } from '../styles/cx.ts';

const NAV = [
  { to: '/explore', label: 'Explore' },
  { to: '/states', label: 'Human States' },
  { to: '/compare', label: 'Compare' },
  { to: '/learn', label: 'Learn' },
  { to: '/about', label: 'About & sources' },
] as const;

/**
 * The persistent application frame. It survives a content failure so that navigation, About and
 * retry always remain available (document 02, Home empty/error behaviour).
 */
export function AppShell({ children }: { children: ReactNode }): React.JSX.Element {
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
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
