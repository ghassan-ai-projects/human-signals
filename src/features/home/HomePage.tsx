import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

/**
 * Document 02: Home gives equal weight to the three entry paths and states the educational
 * scope honestly. It is useful without completing any onboarding.
 */
export function HomePage(): React.JSX.Element {
  return (
    <main id="main" tabIndex={-1} className={styles.home}>
      <h1>Explore how your body communicates</h1>
      <p className={styles.lede}>
        Follow a signal from what triggered it, to where it came from, how it travelled, where it
        acted, what changed, and what regulated the response.
      </p>

      <h2>Start anywhere</h2>
      <ul className={styles.entries}>
        <li>
          <Link to="/about">Start with an experience</Link>
          <p>Watch several body systems respond together in one scenario.</p>
        </li>
        <li>
          <Link to="/about">Find a signal</Link>
          <p>Look up a hormone or neurotransmitter and see where it acts.</p>
        </li>
        <li>
          <Link to="/about">Explore the body</Link>
          <p>Select a region and see which signalling relationships involve it.</p>
        </li>
      </ul>

      <h2>What this is, and what it is not</h2>
      <p>
        Human Signals is an educational model that uses simplified anatomy and authored,
        qualitative scenarios. It is not a patient model, a clinical simulator, a diagnostic tool
        or a prediction of any individual&rsquo;s physiology.
      </p>
    </main>
  );
}
