/**
 * The Git graph panel: a read-only commit list with lane topology, ref
 * labels, and paging (git log --branches --tags --remotes --topo-order).
 * @module dsh-git-graph/client/graph/GraphDialog
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import { computeLanes, type LaneGlyph } from '../../core/types.ts'
import type { GraphView } from '../../core/types.ts'
import type { GitGraphKey } from '../locales.ts'
import { Backdrop, cx } from '../chips/Chip.tsx'
import css from '../chips/context.module.css'

/** Initial page size of the graph fetch. */
const INITIAL_LIMIT = 200
/** Page size of one "load more" step. */
const PAGE_STEP = 100

/** Lane glyph → the rendered monospace character. */
function glyphChar(glyph: LaneGlyph): string {
  switch (glyph) {
    case 'node': return 'o'
    case 'merge': return '*'
    case 'pass': return '│'
    case 'gap': return ' '
  }
}

/** Props of the Git graph dialog. */
export interface GraphDialogProps {
  /** The graph verb (host-side read-only log). */
  graph: (limit?: number) => Promise<GraphView | null>
  onClose: () => void
  t: Translate<GitGraphKey>
}

/**
 * The Git graph panel.
 * @param props - see {@link GraphDialogProps}.
 */
export function GraphDialog({ graph, onClose, t }: GraphDialogProps) {
  const [view, setView] = useState<GraphView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback((limit: number): void => {
    setLoading(true)
    void graph(limit).then((next) => {
      setView(next)
      setError(next === null ? t('error.internal') : null)
    }).catch(() => {
      setError(t('error.internal'))
    }).finally(() => { setLoading(false) })
  }, [graph, t])

  useEffect(() => { load(INITIAL_LIMIT) }, [load])

  const lanes = useMemo(() => {
    if (view === null) return []
    return computeLanes(view.commits)
  }, [view])

  const laneCount = useMemo(() => {
    let count = 0
    for (const row of lanes) count = Math.max(count, row.columns.length)
    return count
  }, [lanes])

  const formatDate = (epochSeconds: number): string =>
    new Date(epochSeconds * 1000).toLocaleString()

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className={css.dialog} role="dialog" aria-label={t('graph.title')}>
        <h3 className={css.dialogTitle}>{t('graph.title')}</h3>
        <div className={css.graphSubtitle}>
          {t('graph.subtitle', {
            count: view === null ? 0 : view.commits.length,
            lanes: laneCount,
          })}
        </div>
        <div className={css.graphBody}>
          {loading && view === null
            ? <div className={css.graphEmpty}>{t('error.internal')}</div>
            : error !== null
              ? <div className={css.graphEmpty}>{error}</div>
              : view === null || view.commits.length === 0
                ? <div className={css.graphEmpty}>{t('graph.empty')}</div>
                : view.commits.map((commit, index) => {
                  const row = lanes[index]
                  if (row === undefined) return null
                  return (
                    <div className={css.graphRow} key={commit.oid}>
                      <span className={css.graphLanes} aria-hidden="true">
                        {row.columns.map((glyph, column) => (
                          <span
                            key={column}
                            className={cx(glyph !== 'pass' && glyph !== 'gap' && css.graphLaneNode)}
                          >
                            {glyphChar(glyph)}
                          </span>
                        ))}
                      </span>
                      <span className={css.graphOid}>{commit.oid.slice(0, 7)}</span>
                      <span className={css.graphMain}>
                        <span className={css.graphSubject}>{commit.subject}</span>
                        <span className={css.graphMeta}>
                          {commit.refs.map(ref => (
                            <span
                              key={ref}
                              className={cx(css.graphRef, ref === view.branch && css.graphRefCurrent)}
                            >
                              {ref}
                            </span>
                          ))}
                          <span>{commit.author}</span>
                          <span>{formatDate(commit.authorTime)}</span>
                        </span>
                      </span>
                    </div>
                  )
                })}
        </div>
        {view !== null && view.hasMore && (
          <button
            type="button"
            className={css.graphMore}
            onClick={() => { load(view.commits.length + PAGE_STEP) }}
          >
            {t('graph.loadMore')}
          </button>
        )}
        <div className={css.dialogActions}>
          <button type="button" className={css.dialogButton} onClick={onClose}>
            {t('graph.close')}
          </button>
        </div>
      </div>
    </>
  )
}
