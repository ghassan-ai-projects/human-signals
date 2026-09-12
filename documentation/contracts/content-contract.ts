/** Normative R1 content shapes. Runtime validation is required; this file alone is not validation. */
export type Id = string;
export type Depth = 'intro' | 'standard' | 'mechanism';
export type DepthText = Record<Depth, string>;
export type ReviewStatus = 'draft' | 'approved' | 'withdrawn';
export type NodeRef = { kind: 'anatomy' | 'signal' | 'concept'; id: Id };
export type Support = 'established' | 'supported' | 'emerging' | 'contested' | 'unresolved';
export type Basis = 'human' | 'animal' | 'in-vitro' | 'computational-model'
  | 'authoritative-synthesis' | 'educational-consensus';

export interface Context {
  id: Id;
  label: string;
  description: DepthText;
  assumptions: string[];
  exclusions: string[];
  variability: string;
  claimIds: Id[];
}

export interface Reference {
  id: Id;
  title: string;
  authors: string[];
  year: number;
  kind: 'primary-study' | 'review' | 'textbook' | 'guideline' | 'other';
  doi?: string;
  url: string;
  checkedOn: string; // YYYY-MM-DD; a real source check, never a guessed date
}

export interface Claim {
  id: Id;
  statement: string;
  contextIds: Id[];
  relationKind: 'causal' | 'associative' | 'descriptive';
  support: Support;
  contextDependent: boolean;
  basis: Basis[];
  applicability: string;
  limitations: string[];
  references: Array<{
    referenceId: Id;
    locator: string;
    stance: 'supports' | 'challenges' | 'context';
    note: string;
  }>;
  status: ReviewStatus;
}

export interface Anatomy {
  id: Id;
  label: string;
  aliases: string[];
  parentId?: Id;
  view: 'body' | 'brain' | 'inset' | 'distributed';
  laterality: 'left' | 'right' | 'midline' | 'bilateral' | 'not-applicable';
  description: DepthText;
  anchorId: Id; // Semantic anchor, independent of GLB mesh names
  claimIds: Id[];
}

export type ComparisonDimension = 'type' | 'sources' | 'transport' | 'targets'
  | 'effects' | 'timing' | 'regulation' | 'misconception';
export interface ComparisonCell {
  dimension: ComparisonDimension;
  contextIds: Id[];
  text: DepthText;
  applicability: 'applicable' | 'not-comparable';
  claimIds: Id[];
}

export interface Signal {
  id: Id;
  label: string;
  aliases: string[];
  description: DepthText;
  roles: Array<{
    kind: 'hormone' | 'neurotransmitter' | 'other-signal';
    contextIds: Id[];
    sourceAnatomyIds: Id[];
    claimIds: Id[];
  }>;
  misconception: DepthText;
  claimIds: Id[];
  comparison: ComparisonCell[];
  journeyIds: Id[];
}

export interface Concept {
  id: Id;
  label: string;
  aliases: string[];
  definition: DepthText;
  relatedConceptIds: Id[];
  claimIds: Id[];
}

export interface Relationship {
  id: Id;
  source: NodeRef;
  target: NodeRef;
  label: string;
  kind: 'causal' | 'associative' | 'descriptive';
  effect: 'stimulates' | 'inhibits' | 'modulates' | 'transports' | 'associated-with' | 'describes';
  transport: 'circulation' | 'portal' | 'synaptic' | 'local' | 'schematic' | 'not-applicable';
  feedback: boolean;
  contextIds: Id[];
  mechanism: DepthText;
  claimIds: Id[];
  whyRootId: Id;
  routeId?: Id;
}

export interface Explanation {
  id: Id;
  question: string;
  answer: DepthText;
  contextIds: Id[];
  claimIds: Id[];
  deeperIds: Id[]; // Directed acyclic graph, at most 3 outgoing links
  relatedConceptIds: Id[];
}

export interface Objective {
  id: Id;
  statement: string;
  pattern: 'sequence' | 'feedback' | 'parallel-timing' | 'context' | 'transport';
  prerequisiteConceptIds: Id[];
}

export interface TimingBand {
  id: Id;
  label: string; // A sourced qualitative biological label, not a playback timestamp
  note: string;
  claimIds: Id[];
}

export interface Track {
  id: Id;
  label: string;
  order: number;
  contextIds: Id[];
}

export interface Step {
  id: Id;
  atMs: number;
  trackId: Id;
  stage: 'trigger' | 'source' | 'signal' | 'target' | 'effect' | 'feedback' | 'regulation';
  label: string;
  caption: DepthText;
  relationIds: Id[];
  claimIds: Id[];
  timingBandId: Id;
}

export type Trend = 'baseline' | 'increasing' | 'decreasing' | 'sustained' | 'variable' | 'not-shown';
export type VisualCommand =
  | { type: 'set-highlight'; anatomyId: Id; value: 'none' | 'source' | 'target' | 'active' }
  | { type: 'set-relation'; relationshipId: Id; visible: boolean }
  | { type: 'set-trend'; signalId: Id; value: Trend };

export interface TimelineEvent {
  id: Id;
  atMs: number;
  order: number; // Unique within a timeline; breaks ties at identical timestamps
  trackId: Id;
  command: VisualCommand;
  claimIds: Id[];
}

export interface PredictionOption {
  id: Id;
  text: DepthText;
  feedback: DepthText;
  claimIds: Id[];
}

export interface Prediction {
  id: Id;
  timelineId: Id;
  objectiveId: Id;
  atMs: number;
  revealAtMs: number;
  kind: 'recall' | 'mechanism' | 'transfer';
  prompt: DepthText;
  assumptions: string[];
  contextIds: Id[];
  options: PredictionOption[];
  correctOptionId: Id;
  explanation: DepthText;
  claimIds: Id[];
  explanationIds: Id[];
  revealsStepIds: Id[];
  familyId: Id; // Related answer forms share an exposure family
  exposureTimelineIds: Id[]; // Opening source lessons marks this answer family exposed
  exposureRelationshipIds: Id[]; // Inspecting these relationships reveals the assessed answer
  exposureExplanationIds: Id[]; // Opening these explanations is answer exposure
}

export interface Timeline {
  id: Id;
  kind: 'journey' | 'state' | 'exercise';
  label: string;
  description: DepthText;
  objectiveIds: Id[];
  contextIds: Id[];
  overviewClaimIds: Id[];
  prerequisiteConceptIds: Id[];
  durationMs: number;
  tracks: Track[];
  timingBands: TimingBand[];
  steps: Step[];
  events: TimelineEvent[];
  predictionIds: Id[];
  relatedTimelineIds: Id[];
  feedbackCoverage: { kind: 'depicted'; relationshipIds: Id[] }
    | { kind: 'not-depicted'; reason: DepthText; claimIds: Id[] };
  limitations: DepthText;
  summary: DepthText;
  summaryClaimIds: Id[];
}

export interface CuratedComparison {
  id: Id;
  signalIds: [Id, Id];
  title: string;
  explanation: DepthText;
  claimIds: Id[];
}

export interface Anchor {
  id: Id;
  view: Anatomy['view'];
  position: [number, number, number]; // Normalized model coordinates
  diagramPosition: [number, number]; // 0..1 in the view's 2D diagram
  meshNames: string[];
  representation: 'anatomical-region' | 'schematic-inset' | 'distributed-overlay';
}

export interface Route {
  id: Id;
  fromAnchorId: Id;
  toAnchorId: Id;
  controlPoints: Array<[number, number, number]>;
  fidelity: 'schematic'; // All R1 signal paths are schematic
  view: Anatomy['view'];
  claimIds: Id[];
}

export interface Asset {
  id: Id;
  path: string; // Same-origin relative build path, no traversal
  sha256: string;
  bytes: number;
  kind: 'body-model' | 'brain-model' | 'texture' | 'font' | 'diagram';
  source: string; // Origin URL or project-authored provenance
  sourceRevision: string; // Immutable upstream commit, release or project revision
  license: string;
  licenseUrl: string; // HTTPS licence text or canonical deed
  attribution: string;
  modified: boolean;
  modificationNote: string; // What the build/import changed, even for a no-op export
}

export interface Review {
  id: Id;
  bundleSha256: string;
  reviewerId: Id;
  reviewerRole: string;
  qualification: string;
  reviewedOn: string;
  disposition: 'approved' | 'changes-required';
  visualReviewBuildId: string;
  notes: string;
}

export interface ContentBundle {
  schemaVersion: 1;
  contentVersion: string; // Semantic version, unique per immutable content release
  fixture: boolean;
  contexts: Context[];
  references: Reference[];
  claims: Claim[];
  anatomy: Anatomy[];
  signals: Signal[];
  concepts: Concept[];
  relationships: Relationship[];
  explanations: Explanation[];
  objectives: Objective[];
  timelines: Timeline[];
  predictions: Prediction[];
  comparisons: CuratedComparison[];
  anchors: Anchor[];
  routes: Route[];
  assets: Asset[];
  reviews: Review[];
}

export interface ContentManifest {
  schemaVersion: 1;
  contentVersion: string;
  bundlePath: string;
  bundleSha256: string; // Hash of actual delivered bundle bytes
  scientificSha256: string; // Canonical approval scope; excludes reviews
  buildId: string;
  catalog: Array<{
    id: Id;
    kind: 'signal' | 'journey' | 'state' | 'exercise' | 'anatomy' | 'concept';
    label: string;
    aliases: string[];
  }>;
  retired: Array<{ id: Id; reason: string; replacementId?: Id }>;
}
