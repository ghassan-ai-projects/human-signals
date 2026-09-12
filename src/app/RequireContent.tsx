/**
 * Gates the routes that cannot render without content.
 *
 * Document 08: loading text appears immediately and a retryable failure appears after the load
 * timeout, with navigation and help still available. Document 05: an invalid or mismatched
 * bundle fails safely for that content version instead of partially rendering.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from './ContentProvider.tsx';
import styles from './RequireContent.module.css';

const EXPLANATION: Record<string, string> = {
  CONTENT_NETWORK: 'The lesson content could not be downloaded.',
  CONTENT_SCHEMA: 'This lesson version could not be loaded because its content did not match the format this application understands.',
  CONTENT_HASH: 'This lesson version could not be loaded because the delivered content did not match its published fingerprint.',
  CONTENT_VERSION: 'This lesson version could not be loaded because the application and the content are different versions.',
};

export function RequireContent({ children }: { children: ReactNode }): React.JSX.Element {
  const { status, error, retry } = useContent();

  if (status === 'loading') {
    return (
      <main id="main" tabIndex={-1} className={styles.state}>
        <h1>Loading the lessons</h1>
        <p role="status">Fetching the published content for this build.</p>
      </main>
    );
  }

  if (status === 'failed') {
    return (
      <main id="main" tabIndex={-1} className={styles.state}>
        <h1>This lesson version could not be loaded</h1>
        <p role="alert">
          {EXPLANATION[error?.code ?? ''] ?? 'The lesson content could not be loaded.'}
        </p>
        <p className={styles.detail}>
          Error code <code>{error?.code}</code>. {error?.detail}
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={retry}>
            Try again
          </button>
          <Link to="/">Go to the home page</Link>
          <Link to="/about">About and sources</Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
