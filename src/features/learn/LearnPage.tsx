/**
 * The Learn page: local completion, practice counts and suggested next lessons.
 *
 * Document 09: this page may show counts with their denominators and the exposure rule —
 * never a mastery score, percentile, diagnosis or badge. Completion means the end of a lesson
 * was reached, nothing more. The first-use view explains that everything is stored in this
 * browser alone.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRepository } from '../../app/ContentProvider.tsx';
import { useOptionalProgress } from '../../app/ProgressProvider.tsx';
import { timelineUrl } from '../../app/urls.ts';
import { summariseByObjective } from '../../platform/progress.ts';
import styles from './LearnPage.module.css';

export function LearnPage(): React.JSX.Element {
  const repository = useRepository();
  const progress = useOptionalProgress();
  const record = progress?.progress;

  const currentVersion =
    record !== undefined && record.contentVersion === repository.manifest.contentVersion
      ? record
      : undefined;

  const completed = currentVersion?.completed ?? [];
  const summaries = useMemo(
    () => (currentVersion ? summariseByObjective(currentVersion) : []),
    [currentVersion],
  );
  const answeredQuestionIds = new Set(
    (currentVersion?.attempts ?? [])
      .filter((attempt) => attempt.selectedOptionId !== null)
      .map((attempt) => attempt.questionId),
  );
  const skippedCount = (currentVersion?.attempts ?? []).filter(
    (attempt) => attempt.selectedOptionId === null,
  ).length;

  const journeys = repository.bundle.timelines.filter((timeline) => timeline.kind === 'journey');
  const exercises = repository.bundle.timelines.filter((timeline) => timeline.kind === 'exercise');
  const hasProgress = completed.length > 0 || (currentVersion?.attempts.length ?? 0) > 0;

  return (
    <main id="main" tabIndex={-1} className={styles.page}>
      <header className={styles.header}>
        <h1>Learn</h1>
        <p className={styles.localNote}>
          Your results live only in this browser. There is no account and nothing is sent anywhere.
          You can erase everything with one confirmed action under Settings → Local data.
        </p>
      </header>

      {hasProgress && (
        <section aria-labelledby="hs-learn-progress" className={styles.section}>
          <h2 id="hs-learn-progress">Your practice so far</h2>
          <ul className={styles.facts}>
            <li>
              Lessons completed: <strong>{completed.length}</strong> of{' '}
              {repository.bundle.timelines.length}
            </li>
            <li>
              Practice questions answered: <strong>{answeredQuestionIds.size}</strong>
              {skippedCount > 0 && <> (plus {skippedCount} skipped)</>}
            </li>
          </ul>

          {summaries.length > 0 && (
            <div className={styles.objectives}>
              <h3>By learning objective</h3>
              <ul>
                {summaries.map((summary) => {
                  const objective = repository.getObjective(summary.objectiveId);
                  return (
                    <li key={summary.objectiveId}>
                      <p>{objective?.statement ?? summary.objectiveId}</p>
                      <p className={styles.counts}>
                        {summary.unassistedFirstAttemptsCorrect} of{' '}
                        {summary.unassistedFirstAttempts} correct on the first unassisted attempt
                        {summary.practiceAttempts > 0 && (
                          <>
                            ; {summary.practiceAttempts} further{' '}
                            {summary.practiceAttempts === 1 ? 'attempt' : 'attempts'} counted as
                            practice
                          </>
                        )}
                        .
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className={styles.rule}>
                An attempt counts as unassisted only if you had not seen the answer before, had not
                opened Why or the transcript for that question, and had not already revealed that
                answer family earlier. Everything else is practice, and practice is a normal part
                of learning here.
              </p>
            </div>
          )}

          {completed.length > 0 && (
            <p className={styles.rule}>
              Completing a lesson means you reached the end of it. It is not a measure of mastery,
              and this page will never show you a score.
            </p>
          )}
        </section>
      )}

      {journeys.length > 0 && (
        <section aria-labelledby="hs-learn-sequence" className={styles.section}>
          <h2 id="hs-learn-sequence">
            {hasProgress ? 'Pick up where you left off' : 'Where to start'}
          </h2>
          <ol className={styles.sequence}>
            {journeys.map((timeline) => (
              <li key={timeline.id}>
                <Link to={timelineUrl(timeline.id, timeline.kind)}>{timeline.label}</Link>
                <span className={styles.description}>{timeline.description.intro}</span>
                {completed.includes(timeline.id) && (
                  <span className={styles.completed}>✓ Completed</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="hs-learn-practice" className={styles.section}>
        <h2 id="hs-learn-practice">Practice and transfer exercises</h2>
        <p className={styles.description}>
          These are invented signalling systems, clearly labelled as exercises. You can launch
          either form as practice; results are described as practice, never as an unseen test.
        </p>
        <ul className={styles.sequence}>
          {exercises.map((timeline) => (
            <li key={timeline.id}>
              <Link to={timelineUrl(timeline.id, timeline.kind)}>{timeline.label}</Link>
              <span className={styles.description}>{timeline.description.intro}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
