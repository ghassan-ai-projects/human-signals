/**
 * The keyboard anatomy tree.
 *
 * Document 02: the tree is the primary accessible navigation equivalent of the scene. Enter
 * selects; up and down move through visible items; left collapses or returns to the parent;
 * right expands. It uses one tab stop with roving focus, so it never becomes a keyboard trap.
 */
import { useMemo, useRef, useState } from 'react';
import type { Anatomy } from '../../content/schema.ts';
import type { ContentRepository } from '../../content/repository.ts';
import styles from './AnatomyTree.module.css';

export interface AnatomyTreeProps {
  repository: ContentRepository;
  selectedId: string | null;
  onSelect: (anatomyId: string) => void;
  /** Highlight roles from the current frame, so the tree mirrors the scene. */
  highlights?: Record<string, string>;
}

interface FlatNode {
  record: Anatomy;
  level: number;
  hasChildren: boolean;
  expanded: boolean;
}

const HANDLED_KEYS = new Set([
  'ArrowDown',
  'ArrowUp',
  'ArrowRight',
  'ArrowLeft',
  'Enter',
  ' ',
  'Home',
  'End',
]);

const VIEW_GROUPS: Array<{ view: Anatomy['view']; label: string }> = [
  { view: 'body', label: 'Body regions' },
  { view: 'brain', label: 'Brain structures' },
  { view: 'inset', label: 'Detail insets' },
  { view: 'distributed', label: 'Distributed systems' },
];

export function AnatomyTree({
  repository,
  selectedId,
  onSelect,
  highlights = {},
}: AnatomyTreeProps): React.JSX.Element {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  const groups = useMemo(() => {
    return VIEW_GROUPS.map((group) => {
      const roots = repository.bundle.anatomy.filter(
        (record) =>
          record.view === group.view &&
          (record.parentId === undefined ||
            repository.getAnatomy(record.parentId)?.view !== group.view),
      );
      return { ...group, roots };
    }).filter((group) => group.roots.length > 0);
  }, [repository]);

  /** The items a keyboard user can currently reach, in visual order. */
  const visible = useMemo(() => {
    const flatten = (records: Anatomy[], level: number): FlatNode[] =>
      records.flatMap((record) => {
        const children = repository.childrenOf(record.id);
        const isExpanded = expanded.has(record.id);
        const node: FlatNode = {
          record,
          level,
          hasChildren: children.length > 0,
          expanded: isExpanded,
        };
        return isExpanded ? [node, ...flatten(children, level + 1)] : [node];
      });
    return groups.flatMap((group) => flatten(group.roots, 1));
  }, [groups, expanded, repository]);

  // The roving tab stop is derived, never stored twice: if the focused item is no longer
  // visible (its parent collapsed), the first visible item carries the tab stop instead.
  const effectiveFocusId =
    focusId !== null && visible.some((node) => node.record.id === focusId)
      ? focusId
      : (visible[0]?.record.id ?? null);

  const move = (delta: number): void => {
    const index = visible.findIndex((node) => node.record.id === effectiveFocusId);
    const next = visible[Math.min(Math.max(index + delta, 0), visible.length - 1)];
    if (next) {
      setFocusId(next.record.id);
      itemRefs.current.get(next.record.id)?.focus();
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLLIElement>, node: FlatNode): void => {
    // Tree items nest, so a child's key event would otherwise also reach its ancestors.
    if (HANDLED_KEYS.has(event.key)) event.stopPropagation();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (node.hasChildren && !node.expanded) {
          setExpanded(new Set([...expanded, node.record.id]));
        } else if (node.hasChildren) {
          move(1);
        }
        break;
      case 'ArrowLeft': {
        event.preventDefault();
        if (node.expanded) {
          const next = new Set(expanded);
          next.delete(node.record.id);
          setExpanded(next);
        } else if (node.record.parentId !== undefined) {
          setFocusId(node.record.parentId);
          itemRefs.current.get(node.record.parentId)?.focus();
        }
        break;
      }
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(node.record.id);
        break;
      case 'Home':
        event.preventDefault();
        move(-visible.length);
        break;
      case 'End':
        event.preventDefault();
        move(visible.length);
        break;
      default:
        break;
    }
  };

  const renderNodes = (records: Anatomy[], level: number): React.JSX.Element => (
    <ul role={level === 1 ? undefined : 'group'} className={styles.list}>
      {records.map((record) => {
        const children = repository.childrenOf(record.id);
        const isExpanded = expanded.has(record.id);
        const node: FlatNode = {
          record,
          level,
          hasChildren: children.length > 0,
          expanded: isExpanded,
        };
        const highlight = highlights[record.id];
        return (
          <li
            key={record.id}
            role="treeitem"
            aria-selected={selectedId === record.id}
            aria-expanded={children.length > 0 ? isExpanded : undefined}
            aria-level={level}
            tabIndex={effectiveFocusId === record.id ? 0 : -1}
            ref={(element) => {
              if (element) itemRefs.current.set(record.id, element);
              else itemRefs.current.delete(record.id);
            }}
            onKeyDown={(event) => {
              onKeyDown(event, node);
            }}
            onFocus={() => {
              setFocusId(record.id);
            }}
            className={selectedId === record.id ? styles.itemSelected : styles.item}
          >
            <span className={styles.itemRow}>
              {children.length > 0 && (
                <span aria-hidden="true" className={styles.twisty}>
                  {isExpanded ? '▾' : '▸'}
                </span>
              )}
              <button
                type="button"
                className={styles.itemButton}
                tabIndex={-1}
                onClick={() => {
                  onSelect(record.id);
                }}
              >
                {record.label}
              </button>
              {highlight !== undefined && highlight !== 'none' && (
                <span className={styles.roleTag}>{highlight}</span>
              )}
              {record.laterality === 'left' || record.laterality === 'right' ? (
                <span className={styles.laterality}>
                  anatomical {record.laterality}
                </span>
              ) : null}
            </span>
            {children.length > 0 && isExpanded && renderNodes(children, level + 1)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav aria-label="Anatomy" className={styles.tree}>
      {groups.map((group) => (
        <section key={group.view}>
          <h3 className={styles.groupHeading}>{group.label}</h3>
          <div role="tree" aria-label={group.label}>
            {renderNodes(group.roots, 1)}
          </div>
        </section>
      ))}
      <p className={styles.hint}>
        Left and right are the body&rsquo;s own left and right, not the side of the screen.
      </p>
    </nav>
  );
}
