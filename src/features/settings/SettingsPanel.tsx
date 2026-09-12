/**
 * Global controls: motion, view, interruptions and local data.
 *
 * Document 02: the browser motion preference is the initial default, a user override can ask for
 * more or less motion, and there is a clear reset to the system setting. Document 09: clearing
 * local progress is one confirmed action. "Saved on this device" appears only after a successful
 * write.
 */
import { useState } from 'react';
import { usePreferences } from '../../app/PreferencesProvider.tsx';
import styles from './SettingsPanel.module.css';

export interface SettingsPanelProps {
  /** Supplied by the progress store once local progress exists. */
  onClearProgress?: () => void;
  onClearAll?: () => void;
}

export function SettingsPanel({
  onClearProgress,
  onClearAll,
}: SettingsPanelProps = {}): React.JSX.Element {
  const { preferences, update, resetPreferences, reducedMotion, systemPrefersReduce, savedOnThisDevice } =
    usePreferences();
  const [confirming, setConfirming] = useState<null | 'progress' | 'all'>(null);

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>Settings</summary>
      <div className={styles.body}>
        <fieldset>
          <legend>Motion</legend>
          <p className={styles.hint}>
            Your browser currently asks for {systemPrefersReduce ? 'reduced' : 'full'} motion.
            Reduced motion removes travelling pulses, automatic camera movement and autoplay;
            every step remains available manually.
          </p>
          {(['system', 'reduce', 'full'] as const).map((value) => (
            <label key={value} className={styles.choice}>
              <input
                type="radio"
                name="hs-motion"
                checked={preferences.motion === value}
                onChange={() => {
                  update({ motion: value });
                }}
              />
              {value === 'system'
                ? 'Follow my system setting'
                : value === 'reduce'
                  ? 'Always reduce motion'
                  : 'Always allow motion'}
            </label>
          ))}
          <p className={styles.hint}>
            Currently effective: {reducedMotion ? 'reduced motion' : 'full motion'}.
          </p>
        </fieldset>

        <fieldset>
          <legend>Anatomy view</legend>
          {(['3d', '2d'] as const).map((value) => (
            <label key={value} className={styles.choice}>
              <input
                type="radio"
                name="hs-view"
                checked={preferences.view === value}
                onChange={() => {
                  update({ view: value });
                }}
              />
              {value === '3d' ? 'Prefer the 3D body when available' : 'Always use the 2D diagram'}
            </label>
          ))}
          <p className={styles.hint}>
            The 2D diagram teaches the same relationships and works without WebGL.
          </p>
        </fieldset>

        <fieldset>
          <legend>Practice questions</legend>
          <label className={styles.choice}>
            <input
              type="checkbox"
              checked={preferences.predictionsEnabled}
              onChange={(event) => {
                update({ predictionsEnabled: event.target.checked });
              }}
            />
            Pause for practice questions during a lesson
          </label>
          <p className={styles.hint}>
            Turning these off changes interruptions only. Seeing an answer still counts as having
            seen it.
          </p>
        </fieldset>

        <fieldset>
          <legend>Local data</legend>
          <p className={styles.hint}>
            {savedOnThisDevice
              ? 'Saved on this device.'
              : 'Nothing has been written to this browser in this session yet.'}
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => {
                resetPreferences();
                setConfirming(null);
              }}
            >
              Reset settings
            </button>
            {onClearProgress && (
              <button
                type="button"
                onClick={() => {
                  setConfirming('progress');
                }}
              >
                Clear lesson progress
              </button>
            )}
            {onClearAll && (
              <button
                type="button"
                onClick={() => {
                  setConfirming('all');
                }}
              >
                Reset all local data
              </button>
            )}
          </div>
          {confirming !== null && (
            <div role="alertdialog" aria-label="Confirm deletion" className={styles.confirm}>
              <p>
                {confirming === 'progress'
                  ? 'Delete the lesson progress stored in this browser? This cannot be undone.'
                  : 'Delete both the settings and the lesson progress stored in this browser? This cannot be undone.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirming === 'progress') onClearProgress?.();
                  else onClearAll?.();
                  setConfirming(null);
                }}
              >
                Yes, delete it
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(null);
                }}
              >
                Keep my data
              </button>
            </div>
          )}
        </fieldset>
      </div>
    </details>
  );
}
