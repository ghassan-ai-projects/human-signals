import styles from './AboutPage.module.css';
import { formatDiagnostics, readDiagnostics } from '../../platform/diagnostics.ts';
import { useState } from 'react';

/**
 * Document 10: About states the educational scope, the content version and review status, the
 * access methods and the local-data controls, and works without the 3D model.
 */
export function AboutPage(): React.JSX.Element {
  const [diagnostics, setDiagnostics] = useState<string | null>(null);

  return (
    <main id="main" tabIndex={-1} className={styles.about}>
      <h1>About Human Signals and its sources</h1>

      <h2>Educational scope</h2>
      <p>
        Human Signals teaches an authored visual model of physiological communication. The model is
        simplified on purpose: routes are schematic, timing is described qualitatively, and every
        lesson names what it leaves out. It is not medical advice and does not describe any
        individual&rsquo;s body.
      </p>

      <h2>Scientific review status</h2>
      <p>
        Content in this build is <strong>draft</strong>. No qualified physiology reviewer has
        approved it, and no reference list has been verified. The production build is blocked until
        that review exists; this preview exists so the software can be tested honestly in the
        meantime.
      </p>

      <h2>Versions</h2>
      <dl className={styles.versions}>
        <dt>Content version</dt>
        <dd>{__CONTENT_VERSION__}</dd>
        <dt>Build</dt>
        <dd>{__CONTENT_BUILD_ID__}</dd>
        <dt>Mode</dt>
        <dd>{__APP_MODE__}</dd>
      </dl>

      <h2>Your data</h2>
      <p>
        Human Signals has no account, no database and no remote analytics. Preferences and lesson
        progress are stored only in this browser and can be deleted from the settings panel.
      </p>

      <h2>Diagnostics</h2>
      <p>
        If something fails, you can review a short local log before deciding whether to share it.
        It holds error codes and versions only — never answers, addresses or personal details.
      </p>
      <button
        type="button"
        onClick={() => {
          setDiagnostics(formatDiagnostics());
        }}
      >
        Show diagnostics ({readDiagnostics().length})
      </button>
      {diagnostics !== null && (
        <pre
          className={styles.diagnostics}
          role="region"
          tabIndex={0}
          aria-label="Local diagnostics log"
        >
          {diagnostics}
        </pre>
      )}
    </main>
  );
}
