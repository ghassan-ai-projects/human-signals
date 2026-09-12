/**
 * The 2D renderer.
 *
 * Document 07: this is not a screenshot of the 3D canvas. It draws the same semantic frame from
 * the authored `diagramPosition` anchors, and it stays fully usable when WebGL is unavailable.
 * The drawing itself is exposed as one image with a description; the adjacent HTML lists carry
 * the interaction, so assistive technology gets one set of controls rather than two.
 */
import { useMemo } from 'react';
import type { Anatomy, Highlight, Relationship } from '../../content/schema.ts';
import type { Frame } from '../../engine/frame.ts';
import type { ContentRepository } from '../../content/repository.ts';
import { presentEdge, pulseProgress } from '../shared/edge-presentation.ts';
import { cx } from '../../styles/cx.ts';
import styles from './Diagram2D.module.css';

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 150;

export interface Diagram2DProps {
  repository: ContentRepository;
  frame: Frame;
  view: 'body' | 'brain';
  selectedId: string | null;
  reducedMotion: boolean;
  onSelect: (anatomyId: string) => void;
  onOpenRelationship: (relationshipId: string) => void;
}

interface Point {
  x: number;
  y: number;
}

interface PlacedEdge {
  relationship: Relationship;
  from: Point;
  to: Point;
}

interface PlacedRegion {
  record: Anatomy;
  x: number;
  y: number;
  highlight: Highlight;
}

function highlightClass(highlight: Highlight): string {
  switch (highlight) {
    case 'source':
      return cx(styles.nodeSource);
    case 'target':
      return cx(styles.nodeTarget);
    case 'active':
      return cx(styles.nodeActive);
    default:
      return cx(styles.nodeIdle);
  }
}

export function Diagram2D({
  repository,
  frame,
  view,
  selectedId,
  reducedMotion,
  onSelect,
  onOpenRelationship,
}: Diagram2DProps): React.JSX.Element {
  const regions = useMemo<PlacedRegion[]>(() => {
    return repository.bundle.anatomy
      .filter((record) => record.view === view)
      .map((record) => {
        const anchor = repository.getAnchor(record.anchorId);
        return {
          record,
          x: (anchor?.diagramPosition[0] ?? 0.5) * VIEW_WIDTH,
          y: (anchor?.diagramPosition[1] ?? 0.5) * VIEW_HEIGHT,
          highlight: frame.highlights[record.id] ?? 'none',
        };
      });
  }, [repository, view, frame.highlights]);

  const positionOf = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const region of regions) map.set(region.record.id, { x: region.x, y: region.y });
    return map;
  }, [regions]);

  const edges = useMemo<PlacedEdge[]>(() => {
    const placed: PlacedEdge[] = [];
    for (const id of frame.visibleRelationshipIds) {
      const relationship: Relationship | undefined = repository.getRelationship(id);
      if (!relationship) continue;
      const from = positionOf.get(relationship.source.id);
      const to = positionOf.get(relationship.target.id);
      // An endpoint outside this view has nothing to draw between; the lists still name it.
      if (!from || !to) continue;
      placed.push({ relationship, from, to });
    }
    return placed;
  }, [frame.visibleRelationshipIds, positionOf, repository]);

  const description = useMemo(() => {
    const active = regions
      .filter((region) => region.highlight !== 'none')
      .map((region) => `${region.record.label} as ${region.highlight}`);
    const shown = edges.map((edge) => {
      const presentation = presentEdge(edge.relationship);
      return `${edge.relationship.label} (${presentation.effectLabel}, ${presentation.transportLabel})`;
    });
    return [
      `Schematic ${view} diagram.`,
      active.length > 0 ? `Highlighted: ${active.join('; ')}.` : 'Nothing is highlighted yet.',
      shown.length > 0 ? `Connections shown: ${shown.join('; ')}.` : 'No connection is shown yet.',
      'The list below this diagram offers the same selections.',
    ].join(' ');
  }, [regions, edges, view]);

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.canvas}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={description}
        data-testid="diagram-2d"
      >
        <defs>
          <marker id="hs-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L8,4 L0,8 z" className={styles.markerShape} />
          </marker>
          <marker id="hs-bar" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M5,0 L5,8 L7,8 L7,0 z" className={styles.markerShapeInhibit} />
          </marker>
          <marker id="hs-diamond" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,4 L4,0 L8,4 L4,8 z" className={styles.markerShape} />
          </marker>
        </defs>

        {/* Body outline: a deliberately plain schematic silhouette, never a literal anatomy. */}
        {view === 'body' && (
          <g className={styles.silhouette} aria-hidden="true">
            <ellipse cx="50" cy="18" rx="11" ry="13" />
            <rect x="36" y="31" width="28" height="52" rx="12" />
            <rect x="24" y="34" width="10" height="42" rx="5" />
            <rect x="66" y="34" width="10" height="42" rx="5" />
            <rect x="39" y="83" width="10" height="52" rx="5" />
            <rect x="51" y="83" width="10" height="52" rx="5" />
          </g>
        )}
        {view === 'brain' && (
          <g className={styles.silhouette} aria-hidden="true">
            <ellipse cx="50" cy="60" rx="38" ry="32" />
            <rect x="44" y="88" width="12" height="26" rx="6" />
          </g>
        )}

        {edges.map(({ relationship, from, to }) => {
          const presentation = presentEdge(relationship);
          const marker =
            presentation.terminal === 'arrow'
              ? 'url(#hs-arrow)'
              : presentation.terminal === 'bar'
                ? 'url(#hs-bar)'
                : presentation.terminal === 'diamond'
                  ? 'url(#hs-diamond)'
                  : undefined;
          const midX = (from.x + to.x) / 2 + (to.y - from.y) * 0.12;
          const midY = (from.y + to.y) / 2 + (from.x - to.x) * 0.12;
          const path = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
          const pulse =
            !reducedMotion && presentation.allowsPulse
              ? pulseProgress(relationship.routeId ?? relationship.id, frame.cursorMs)
              : null;
          return (
            <g key={relationship.id} data-edge={relationship.id} data-role={presentation.roleToken}>
              <path
                d={path}
                className={cx(styles[`edge-${presentation.roleToken}`])}
                strokeDasharray={presentation.dash === '' ? undefined : presentation.dash}
                markerEnd={marker}
                fill="none"
              />
              {pulse !== null && (
                <circle className={styles.pulse} r="1.6">
                  <animateMotion dur="2.2s" repeatCount="indefinite" path={path} />
                </circle>
              )}
            </g>
          );
        })}

        {regions.map((region) => (
          <g
            key={region.record.id}
            data-region={region.record.id}
            data-highlight={region.highlight}
            role="button"
            tabIndex={0}
            aria-label={`${region.record.label}. ${region.record.description.intro}`}
            aria-pressed={selectedId === region.record.id}
            className={
              selectedId === region.record.id ? styles.nodeGroupSelected : styles.nodeGroup
            }
            onClick={() => {
              onSelect(region.record.id);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              onSelect(region.record.id);
            }}
          >
            <circle
              cx={region.x}
              cy={region.y}
              r={selectedId === region.record.id ? 4.6 : 3.6}
              className={highlightClass(region.highlight)}
            />
            {region.highlight === 'source' && (
              <text x={region.x} y={region.y + 1.4} className={styles.roleGlyph}>
                S
              </text>
            )}
            {region.highlight === 'target' && (
              <text x={region.x} y={region.y + 1.4} className={styles.roleGlyph}>
                T
              </text>
            )}
            <text
              x={region.x > 60 ? 96 : region.x < 40 ? 4 : 50}
              y={region.y + 1.6}
              textAnchor={region.x > 60 ? 'end' : region.x < 40 ? 'start' : 'middle'}
              className={styles.nodeLabel}
            >
              {region.record.label}
            </text>
          </g>
        ))}
      </svg>

      <div className={styles.legend}>
        <h3 className={styles.legendHeading}>What the marks mean</h3>
        <ul>
          <li>
            <span aria-hidden="true">&#8594;</span> arrowhead and the word <strong>stimulates</strong>:
            increases activity
          </li>
          <li>
            <span aria-hidden="true">&#8866;</span> terminal bar and the word <strong>inhibits</strong>:
            reduces activity
          </li>
          <li>
            <span aria-hidden="true">&#9671;</span> diamond and the word <strong>modulates</strong>:
            a scoped change described in the caption
          </li>
          <li>
            <span aria-hidden="true">&#8943;</span> dashed connector with no arrow: an association,
            not a cause
          </li>
          <li>
            <strong>S</strong> marks a source and <strong>T</strong> a target, so the roles read
            without colour
          </li>
        </ul>
        {edges.length > 0 && (
          <ul className={styles.edgeActions}>
            {edges.map(({ relationship }) => {
              const presentation = presentEdge(relationship);
              return (
                <li key={relationship.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenRelationship(relationship.id);
                    }}
                  >
                    Why: {relationship.label}
                  </button>
                  <span className={styles.edgeMeta}>
                    {presentation.effectLabel} &middot; {presentation.transportLabel}
                    {presentation.feedbackLabel === null ? '' : ` · ${presentation.feedbackLabel}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <div className={styles.anatomyActions} role="group" aria-labelledby="diagram-anatomy-actions-title">
          <h3 id="diagram-anatomy-actions-title">Select a structure</h3>
          <ul>
            {regions.map((region) => (
              <li key={region.record.id}>
                <button
                  type="button"
                  aria-pressed={selectedId === region.record.id}
                  onClick={() => {
                    onSelect(region.record.id);
                  }}
                >
                  {region.record.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
