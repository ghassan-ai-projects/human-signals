# Scientific content and evidence

## Editorial boundary

The application teaches an authored visual model. It must distinguish that model from a measured human response. No physiology in this package has been externally verified. The implementation agent may build fictional fixtures and content structure autonomously; release of real claims requires verified sources and recorded scientific review.

The user requested work within this fresh project. Therefore this specification contains no invented reference list and makes no claim of external research. When implementing scientific content, obtain source material through whatever access the user authorizes at that stage. If such access is unavailable, complete engineering and retain a clearly labeled private synthetic preview. Do not bypass this gate with AI-generated citations.

## Claim as the unit of evidence

An evidence badge describes a specific claim under a specific context. It never describes an entire hormone, page, researcher or journal. Claims can cover a relationship, timing description, mechanism, anatomy placement or pedagogical simplification. A single relationship can cite multiple claims if transport, effect and timing need different support.

Each claim records:

- Exact statement and the relevant context IDs.
- Relation kind: causal, associative or descriptive.
- Support category: established, supported, emerging, contested or unresolved.
- Evidence basis: human, animal, in-vitro, computational-model, authoritative-synthesis, and/or educational-consensus.
- Applicability and limits, including species/population, experimental conditions and variability when relevant.
- Supporting and challenging reference links with a locator and explanation of what each supports.
- Review identity, date, disposition and content fingerprint.

**Support strength and context dependence are independent.** An established mechanism may apply only in a specific receptor, tissue or scenario. UI must show both, such as “Established · context-dependent.” An association may have strong observational support but must not be animated as a causal edge.

## Visual evidence vocabulary

| Label | Intended meaning | UI treatment |
|---|---|---|
| Established | Reviewer finds convergent, mature support for this scoped statement | Solid evidence icon plus text |
| Supported | Credible support with meaningful limits | Same prominence; accessible text label |
| Emerging | Early or narrow evidence that needs replication or generalization | Dashed-outline evidence icon plus limits |
| Contested | Relevant sources disagree or interpretation is disputed | Disagreement label and competing interpretations |
| Unresolved | Insufficient support to teach a definite relation | Not permitted to drive a deterministic causal event |

No invented confidence percentages or five-dot scores. Badges are reviewer-assigned categorical summaries, not outputs of a citation-count algorithm. Contested/emerging content may be published if the lesson explicitly teaches the uncertainty and review permits it. Unresolved or associative claims cannot authorize “A causes B” playback; they can support separate explanatory notes or noncausal context links.

## References

Store title, authors/organization, year, source type, DOI where available, stable HTTPS URL and a precise locator (chapter, section, figure, table or page). The referenced full text or relevant excerpt must actually have been checked. A DOI's existence does not establish that it supports the claim. Reviewers record what the source supports and, where relevant, what it does not.

Prefer original studies for specific empirical claims and authoritative synthesis for established educational physiology; use both where a specific mechanistic claim needs context. Distinguish primary research, review, textbook, guideline and other sources. Do not cite a model organism as direct human confirmation. Avoid press releases, influencer content and commercial wellness marketing as physiological evidence.

References are metadata and brief paraphrases, not scraped textbook chapters. Respect licenses for text, figures and assets. Third-party figures require explicit reuse permission or an applicable license; otherwise create an original schematic based on supported claims and review it for accuracy.

## Author → validate → review → publish

1. **Draft:** author adds structured content and references. Draft content is available only in development/private previews.
2. **Machine validation:** schema, graph, timing, anchors, reference links, explanation termination and assessment contracts pass.
3. **Scientific review:** qualified reviewer checks claims, sources, anatomy, visuals, timing, uncertainty, simplified language and assessments at all depths.
4. **Editorial review:** confirm accessibility, terminology, continuity and comprehension. This does not replace scientific review.
5. **Approve:** record reviewer ID, role/qualification, UTC date and the exact scientific bundle SHA-256. Reviewer must be identifiable in project review records; public attribution follows the reviewer's preference.
6. **Release:** production build accepts only content included in the approved fingerprint and asset license manifest. Changes invalidate approval until reviewed again.

The implementing agent cannot self-assign a human qualification or fabricate sign-off. Automated reviewers may identify issues but cannot satisfy the qualified-review gate. The project owner assigns reviewers; implementation can finish before this dependency is resolved.

## Fingerprint and staleness

The scientific bundle hash covers canonical serialized scientific records, scenario/playback definitions, question text/answers, visible explanatory strings and semantic anatomy/route mappings. It excludes the review ledger itself, build timestamps and purely presentational application source code. Keys are recursively sorted; array order is preserved; UTF-8 JSON has no insignificant whitespace. Assets referenced by semantic mapping are represented by their file SHA-256 values.

Any byte-level change to this normalized scope invalidates the corresponding bundle approval. Re-reviewing the bundle is deliberately coarse for R1; avoid a complex incremental approval system. Reviewers compare the displayed version, not just JSON text. A renderer change that changes scientific meaning requires a new visual review record even when data hash is unchanged.

Review at least every 12 months, and sooner on a reported scientific issue. Production build fails if approval is older than 365 days at build time. A deployed artifact does not magically rewrite itself on expiry; the release owner schedules review and can withdraw affected lessons using a new reviewed manifest. About exposes the content review date.

## Scientific visual rules

- Route types are circulation, portal, synaptic, local and schematic. Renderers must never turn an abstract link into an apparently anatomically precise blood vessel or nerve.
- Neural communication and blood-borne signals use different patterns/icons and explicit labels.
- An inhibitory effect is represented with a terminal bar and the word “inhibits” or a more precise reviewed verb. A slow/fast animation does not establish effect strength.
- Background anatomy cannot imply a nonexistent source or target. Distributed effects use regions, labeled overlays or lists.
- Trends are ordinal teaching cues; values have no physiological units. Do not interpolate them into apparent laboratory measurements.
- Feedback direction and sign belong to each relationship; they are not inferred by drawing a circle.
- Mechanism variants must not strengthen a claim merely because they use technical language.

## Publication checklist per lesson

- Every asserted causal edge has applicable reviewed causal support.
- Sources and targets, transport, effect and timing are independently correct in the depicted context.
- Missing systems and simplifications are declared where they change interpretation.
- The animation, text, Why tree, comparison and prediction feedback agree.
- No path labels a correlation as mechanism or presents animal evidence as established human physiology.
- Prediction questions have one defensible best answer under explicit assumptions; distractors are corrected in feedback.
- The reviewer has inspected the 3D and 2D representations and reduced-motion step sequence.
- No exact timing, concentration, effect size or clinical implication appears without suitable support.

## Corrections

Every page exposes its content ID/version and a “Report a content issue” action that copies a concise report template without learner data. R1 does not require a messaging backend. The deployment owner may configure a project issue URL; absent that, instructions tell users to contact the site publisher through its configured contact channel. Do not invent an address or silently send reports.

A serious correction withdraws the affected lesson from the public manifest and removes dependent links or uses a coordinated replacement bundle. Preserve old IDs in a tombstone map for explanatory recovery. Record the correction, reviewer decision and impacted assessments; old local progress is historical, not silently transferred to changed questions.
