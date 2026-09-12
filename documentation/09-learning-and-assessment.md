# Learning and assessment

## Learning model

Learning moves through orientation → causal sequence → mechanism → regulation → application. A lesson must connect spatial location to communication, not merely ask the learner to identify an organ. Every objective describes an observable explanation or prediction.

Required recurring patterns:

- **Sequence:** infer the next communication from source and target context.
- **Feedback:** predict the direction of an upstream regulatory response under stated assumptions.
- **Parallel timing:** distinguish concurrent systems and earlier/later qualitative responses.
- **Context:** explain why one signal can have different effects in different pathways/targets.
- **Transport:** distinguish blood-borne, portal, neural and local communication.

The 14 signal pages support these patterns; they are not independent memorization flashcards.

## Depth rubric

| Depth | What the learner sees | What must remain accurate |
|---|---|---|
| Intro | Plain language, named source/target, key effect, one main mechanism | Direction, context, timing limits and uncertainty |
| Standard | Pathway names, transport distinctions, feedback and relevant tissues | Same claims with more explanatory detail |
| Mechanism | Reviewed receptor/circuit/cell processes and evidence distinctions | No speculative detail presented as settled mechanism |

Depth changes the wording of an assessment, not the correct answer or assessed construct. If a question cannot be understood at Intro without the hidden mechanism, add a prerequisite explanation or restrict that question's launch to a clearly introduced lesson. Do not surprise users with terminology they have not been given.

## Prediction authoring

Each question contains an objective, explicit context/assumptions, 2–4 options, exactly one best answer, option-specific feedback, explanation links and evidence. At least half of the 24 checkpoint prompts must test mechanisms, feedback, context or timing rather than name recall.

Feedback explains why the selected answer fits or fails under the stated scenario. It must correct the misconception in a wrong distractor. Avoid trick wording, “all of the above,” implausible nonsense options and irrelevant clinical data. A physiology reviewer checks the full option set, not only the marked answer.

Prediction UI is optional formative practice. A learner can disable interruptions, skip any question or inspect Why first. These choices never block lesson access. Assisted and exposed attempts are explicitly distinguished from unassisted ones in local results.

## Transfer exercises

Author six transfer prompts in exercise timelines, separate from the 24 in-lesson checkpoints. There are three families: feedback, parallel timing and context-specific target effects. Each family has two matched forms (A and B) using structurally similar but differently presented systems. Each form is a distinct question with a shared `familyId` for exposure tracking and reviewer-confirmed equivalence.

For ordinary learning, the learner can launch either form as practice, and results are described as practice. For a controlled study, the researcher assigns one form pre-learning and the other post-learning with counterbalanced order. The app does not claim an ordinary repeat of an exposed family is an unseen transfer assessment.

“Unseen” means the specific assessed relation/answer has not been taught or revealed in that study condition, not merely that a question has a new ID. Use a reviewed abstract signaling system if all named physiological axes were already taught; explicitly label abstract systems as exercises, not real anatomy. Exposure-family metadata is necessary but not sufficient: the study protocol must define which lessons are withheld and avoid source pages that reveal the answer.

R1 exercise timelines use the same engine and question UI. They may use a 2D diagram and fictional or reviewed held-out biology. Fictional assessment examples must be visibly labeled abstract and cannot appear in the real signal catalog. Their scientific claims concern the taught principle and assumptions, not fictional organs.

## Local results

Learn shows completed lessons, answered practice prompts and per-objective attempts. It may display “3 of 4 practice questions correct on first unassisted attempt” only with the denominator and exposure rule. Do not create a proprietary mastery score, percentile, diagnosis or badge asserting competence.

Correctness is evaluated against the versioned answer key. Repeat attempts are separate records. Changing a question's assessed meaning creates a new content version and resets current-version interpretation. A learner can clear local progress with one confirmed action; confirmation here protects intentional data deletion, not routine usage.

All results are local and device-specific. No remote event collection, user IDs or database. R1 does not add a learner-results export feature; research can be conducted with consent and researcher-managed observation outside the app's default product behavior.

## Proposed evaluation protocol

This protocol tests the intended outcome; it is not evidence already obtained.

1. Run formative usability with at least five participants representing novice and university-level use. Observe finding Stress, identifying its parallel tracks, opening Why/evidence and completing a prediction without assistance.
2. Revise critical comprehension and interaction failures before a larger pilot.
3. Pilot with a target of at least 20 consenting learners. Document recruitment, baseline knowledge, exclusions, attrition and which lesson/assessment forms each participant saw.
4. Counterbalance pre/post forms within each pattern family. Teach a subset of systems, then assess application to withheld systems or reviewed abstract structures.
5. Measure unassisted correctness and explanation quality; separately record whether source material or hints were seen. Report counts and uncertainty, not only percentages.
6. Offer a delayed check 7 ± 2 days later using an unexposed form. With only two forms per family, a separate delayed form must be authored/reviewed for a three-timepoint study; do not reuse a post-test as if unseen.

Preliminary targets: ≥80% complete the core navigation tasks without help; ≥70% interpret Stress timing without numerical overclaim; median transfer accuracy improves by at least 20 percentage points from baseline with no decline in context/uncertainty understanding. A small uncontrolled pilot cannot establish causal superiority over another teaching method. Publish no efficacy claim without an appropriately designed analysis and limitations.

Delayed recall and the 20-point transfer target are learning-validation gates for claiming the product improves learning, not prerequisites to finishing the engineering build. A poor result requires lesson redesign and retest, not changing the metric afterward.

## Quality review rubric

For each flagship lesson, reviewers answer the ten questions from the source brief using the anchored 0–2 rubric in document 11. Review must include one attempt to predict before explanation and one next-day/delayed recall observation when evaluating retention. Reviewers must distinguish “we believe this helps” from observed learner performance.
