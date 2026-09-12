/**
 * The checkpoint question and its feedback, one card for both states.
 *
 * Document 02: one question at a time, assumptions visible, selection never submits by itself,
 * no countdown and no score shaming. Feedback shows correctness with words and an icon, the
 * mechanism-based feedback for the chosen option, the best answer and the evidence behind it.
 * Changing depth rewords the question; it never changes the chosen or correct answer.
 */
import { useEffect, useRef } from 'react';
import type { Depth, Prediction } from '../../content/schema.ts';
import { cx } from '../../styles/cx.ts';
import styles from './CheckpointCard.module.css';

export type CheckpointStatus = 'question' | 'feedback';

export interface CheckpointCardProps {
  prediction: Prediction;
  status: CheckpointStatus;
  depth: Depth;
  selectedOptionId: string | undefined;
  /** The answer family was already exposed, so this pass is practice rather than a first try. */
  isPractice: boolean;
  onChoose: (optionId: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onContinue: () => void;
  onOpenEvidence: (claimIds: string[], title: string) => void;
}

const KIND_LABEL: Record<Prediction['kind'], string> = {
  recall: 'Recall',
  mechanism: 'Mechanism',
  transfer: 'Transfer',
};

export function CheckpointCard({
  prediction,
  status,
  depth,
  selectedOptionId,
  isPractice,
  onChoose,
  onSubmit,
  onSkip,
  onContinue,
  onOpenEvidence,
}: CheckpointCardProps): React.JSX.Element {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const answering = status === 'question';
  const correct = selectedOptionId === prediction.correctOptionId;

  // Moving focus here is how a screen reader learns that playback stopped for a question,
  // and later that feedback has arrived. A depth change does not retrigger it.
  useEffect(() => {
    headingRef.current?.focus();
  }, [status]);

  return (
    <section className={styles.card} aria-labelledby="hs-checkpoint-title">
      <h2 id="hs-checkpoint-title" tabIndex={-1} ref={headingRef} className={styles.title}>
        Practice question <span className={styles.kind}>{KIND_LABEL[prediction.kind]}</span>
      </h2>

      {isPractice && (
        <p className={styles.practiceNote}>
          You have already seen this answer, so this attempt is practice rather than a first try.
        </p>
      )}

      <p className={styles.prompt}>{prediction.prompt[depth]}</p>

      <p className={styles.assumptionsLabel}>Under these assumptions:</p>
      <ul className={styles.assumptions}>
        {prediction.assumptions.map((assumption) => (
          <li key={assumption}>{assumption}</li>
        ))}
      </ul>

      <fieldset className={styles.options}>
        <legend>Answer options</legend>
        {prediction.options.map((option) => {
          const chosen = selectedOptionId === option.id;
          const isBest = option.id === prediction.correctOptionId;
          const showMark = !answering && (chosen || isBest);
          return (
            <label
              key={option.id}
              className={cx(
                styles.option,
                !answering && styles.optionResolved,
                chosen && styles.optionChosen,
              )}
            >
              <span className={styles.optionRow}>
                <input
                  type="radio"
                  name={`hs-checkpoint-${prediction.id}`}
                  value={option.id}
                  checked={chosen}
                  disabled={!answering}
                  onChange={() => {
                    onChoose(option.id);
                  }}
                />
                <span>{option.text[depth]}</span>
                {showMark && (
                  <span
                    className={
                      chosen && isBest
                        ? cx(styles.mark, styles.markCorrect)
                        : chosen
                          ? cx(styles.mark, styles.markIncorrect)
                          : cx(styles.mark, styles.markCorrect)
                    }
                  >
                    <span aria-hidden="true">{chosen && isBest ? '✓' : chosen ? '✗' : '✓'}</span>{' '}
                    {chosen && isBest ? 'Correct' : chosen ? 'Your answer' : 'Best answer'}
                  </span>
                )}
              </span>
              {!answering && chosen && <p className={styles.optionFeedback}>{option.feedback[depth]}</p>}
            </label>
          );
        })}
      </fieldset>

      {answering ? (
        <div className={styles.actions}>
          <button type="button" onClick={onSubmit} disabled={selectedOptionId === undefined}>
            Check answer
          </button>
          <button type="button" className={styles.secondary} onClick={onSkip}>
            Skip and continue
          </button>
          <p className={styles.hint}>
            You can open Why or the transcript first; the question then counts as practice.
          </p>
        </div>
      ) : (
        <div className={styles.actions}>
          <p
            className={cx(
              styles.verdict,
              correct ? styles.verdictCorrect : styles.verdictIncorrect,
            )}
          >
            <span aria-hidden="true">{correct ? '✓' : '✗'}</span> {correct ? 'Correct.' : 'Not quite.'}
          </p>
          <p className={styles.explanation}>{prediction.explanation[depth]}</p>
          <button type="button" onClick={onContinue}>
            Continue
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              onOpenEvidence(
                prediction.claimIds,
                `Practice question: ${KIND_LABEL[prediction.kind]}`,
              );
            }}
          >
            Show the evidence
          </button>
        </div>
      )}
    </section>
  );
}
