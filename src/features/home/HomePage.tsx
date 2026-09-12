import { Link } from 'react-router-dom';
import { useContent } from '../../app/ContentProvider.tsx';
import { timelineUrl } from '../../app/urls.ts';
import styles from './HomePage.module.css';

/**
 * Document 02: Home gives equal weight to the three entry paths, offers a starter lesson, states
 * the educational scope honestly, and is useful without completing any onboarding. It renders
 * before the content bundle arrives, so a content failure never blocks the shell.
 */
export function HomePage(): React.JSX.Element {
  const { status, repository } = useContent();
  const starter =
    repository?.bundle.timelines.find((timeline) => timeline.kind === 'state') ??
    repository?.bundle.timelines[0];

  return (
    <main id="main" tabIndex={-1} className={styles.home}>
      <h1>Explore how your body communicates</h1>
      <p className={styles.lede}>
        Follow a signal from what triggered it, to where it came from, how it travelled, where it
        acted, what changed, and what regulated the response.
      </p>

      {starter && (
        <p className={styles.starter}>
          <Link to={timelineUrl(starter.id, starter.kind)} className={styles.starterLink}>
            Start with {starter.label}
          </Link>
        </p>
      )}

      <h2>Start anywhere</h2>
      <ul className={styles.entries}>
        <li>
          <Link to="/states">Start with an experience</Link>
          <p>Watch several body systems respond together in one scenario.</p>
        </li>
        <li>
          <Link to="/explore">Find a signal</Link>
          <p>Look up a hormone or neurotransmitter and see where it acts.</p>
        </li>
        <li>
          <Link to="/explore">Explore the body</Link>
          <p>Select a region and see which signalling relationships involve it.</p>
        </li>
      </ul>

      {status === 'failed' && (
        <p role="status" className={styles.contentNotice}>
          The lesson catalog could not be loaded just now. Navigation and the About page still
          work, and opening a lesson will offer a retry.
        </p>
      )}

      <h2>What this is, and what it is not</h2>
      <p>
        Human Signals is an educational model that uses simplified anatomy and authored,
        qualitative scenarios. It is not a patient model, a clinical simulator, a diagnostic tool
        or a prediction of any individual&rsquo;s physiology.
      </p>
      <p>
        <Link to="/about">Read how the content is reviewed, and what it leaves out.</Link>
      </p>
    </main>
  );
}
