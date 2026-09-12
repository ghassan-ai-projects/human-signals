/**
 * Explanation depth.
 *
 * Document 09: depth changes wording and optional detail, never the underlying facts, the
 * evidence strength or the answer to a question. The control says so, because a learner
 * switching depth needs to know the meaning has not changed.
 */
import type { Depth } from '../../content/schema.ts';
import styles from './DepthControl.module.css';

const DEPTHS: Array<{ value: Depth; label: string; hint: string }> = [
  { value: 'intro', label: 'Intro', hint: 'Plain language, one main mechanism' },
  { value: 'standard', label: 'Standard', hint: 'Pathway names, transport and feedback' },
  { value: 'mechanism', label: 'Mechanism', hint: 'Reviewed mechanism and evidence distinctions' },
];

export function DepthControl({
  depth,
  onChange,
}: {
  depth: Depth;
  onChange: (depth: Depth) => void;
}): React.JSX.Element {
  return (
    <fieldset className={styles.control}>
      <legend className={styles.legend}>Explanation depth</legend>
      <div className={styles.options}>
        {DEPTHS.map((option) => (
          <label
            key={option.value}
            className={depth === option.value ? styles.optionActive : styles.option}
          >
            <input
              type="radio"
              name="hs-depth"
              value={option.value}
              checked={depth === option.value}
              onChange={() => {
                onChange(option.value);
              }}
            />
            <span className={styles.optionLabel}>{option.label}</span>
            <span className={styles.optionHint}>{option.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
