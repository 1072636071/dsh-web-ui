/**
 * The dock entry above the composer: the persistent project (workspace) chip
 * and git branch chip row. The row hides itself for blank sessions (the hero
 * phase): ConversationRoot renders the dock in every session phase, and the
 * hero's own workspace row is the project selector there — the two surfaces
 * must never duplicate (the sibling-checkout divergence this guards: the
 * dock's render condition varies across harness snapshots).
 * @module dsh-git-graph/client/chips/ContextChipsRow
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  IconBranchOutline16, IconFolderOpen16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { BranchesView, RepoStatus } from '../../core/types.ts'
import type { GitGraphInjected } from '../index.ts'
import { Chip } from './Chip.tsx'
import { WorkspacePopover, type WorkspaceRow } from './WorkspacePopover.tsx'
import { BranchPopover } from './BranchPopover.tsx'
import { CreateBranchDialog } from './CreateBranchDialog.tsx'
import { GraphDialog } from '../graph/GraphDialog.tsx'
import css from './context.module.css'

/** Full props of the chip row: the dock slot's runtime share + the git-graph inject face + the locale seat. */
export type ContextChipsRowProps =
  PropsRuntime<'conversation.input.dock'>
  & GitGraphInjected
  & PropsLocale<'git-graph'>

/** The last path segment (folder name) of a workspace root. */
function folderName(path: string): string {
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1] ?? path
}

/**
 * The project + branch chip row.
 * @param props - the composed dock-entry props.
 */
export function ContextChipsRow(props: ContextChipsRowProps) {
  const { sessionId, useSessions, useWorkspaces, t } = props
  const cwd = useSessions(s => sessionId === undefined ? undefined : s.byId[sessionId]?.cwd)
  // Hero dedup: a blank session is the hero phase, whose own workspace row is
  // the project selector — hide the whole chip row there.
  const blank = useSessions(s => sessionId === undefined ? undefined : s.byId[sessionId]?.blank === true)
  const workspaces = useWorkspaces(s => s)

  const sessionWorkspace = useMemo(() => {
    if (sessionId === undefined) return undefined
    return workspaces.items.find(workspace => workspace.sessionIds.includes(sessionId))
  }, [workspaces.items, sessionId])

  /** Repository state: undefined = loading, null = not a repository, else the snapshot. */
  const [repo, setRepo] = useState<RepoStatus | null | undefined>(undefined)
  /** Fresh branch list, fetched when the branch popover opens. */
  const [branchesView, setBranchesView] = useState<BranchesView | null>(null)
  const [projectOpen, setProjectOpen] = useState(false)
  const [branchOpen, setBranchOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [graphOpen, setGraphOpen] = useState(false)

  const refetch = useCallback(() => {
    let live = true
    props.repoStatus()
      .then((status) => { if (live) setRepo(status) })
      .catch(() => { if (live) setRepo(null) })
    return () => { live = false }
  }, [props.repoStatus])

  // Initial load + host-pushed external changes + focus refresh.
  useEffect(() => refetch(), [refetch])
  useEffect(() => {
    const unsubscribe = props.subscribeChanges(() => { refetch() })
    const onFocus = (): void => { refetch() }
    window.addEventListener('focus', onFocus)
    return () => {
      unsubscribe()
      window.removeEventListener('focus', onFocus)
    }
  }, [props.subscribeChanges, refetch])

  const projectLabel = sessionWorkspace?.title
    ?? (cwd !== undefined && cwd !== '' ? folderName(cwd) : t('project.placeholder'))

  const workspaceRows: WorkspaceRow[] = workspaces.items.map(workspace => ({
    workspaceId: workspace.workspaceId,
    title: workspace.title,
    path: workspace.path,
  }))

  const closeCreate = (): void => {
    setCreateOpen(false)
    refetch()
  }

  if (blank === true) return null

  const openBranchPopover = (): void => {
    setProjectOpen(false)
    setBranchOpen(open => !open)
  }

  // Fetch the fresh branch list each time the popover opens.
  useEffect(() => {
    if (!branchOpen) return
    let live = true
    setBranchesView(null)
    props.branches().then((view) => { if (live) setBranchesView(view) })
    return () => { live = false }
  }, [branchOpen, props.branches])

  return (
    <div className={css.chipsRow}>
      <div className={css.anchor}>
        <Chip
          icon={<IconFolderOpen16 size={14} />}
          label={projectLabel}
          ariaLabel={t('chip.aria.project')}
          open={projectOpen}
          onClick={() => { setProjectOpen(open => !open) }}
        />
        {projectOpen && (
          <WorkspacePopover
            workspaces={workspaceRows}
            selectedId={sessionWorkspace?.workspaceId}
            onPick={(workspaceId) => {
              setProjectOpen(false)
              void props.selectWorkspace(workspaceId)
            }}
            onOpenFolder={() => props.openFolder()}
            onClearWorkspace={() => {
              setProjectOpen(false)
              props.clearWorkspace()
            }}
            onClose={() => { setProjectOpen(false) }}
            t={t}
          />
        )}
      </div>
      {repo !== undefined && repo !== null && (
        <div className={css.anchor}>
          <Chip
            icon={<IconBranchOutline16 size={14} />}
            label={repo.branch === '' ? t('branch.detached') : repo.branch}
            ariaLabel={t('chip.aria.branch')}
            open={branchOpen}
            onClick={openBranchPopover}
          />
          {branchOpen && branchesView !== null && (
            <BranchPopover
              view={branchesView}
              onSwitch={props.switchBranch}
              onSwitched={refetch}
              onCreate={() => {
                setBranchOpen(false)
                setCreateOpen(true)
              }}
              onGraph={() => {
                setBranchOpen(false)
                setGraphOpen(true)
              }}
              onClose={() => { setBranchOpen(false) }}
              t={t}
            />
          )}
        </div>
      )}
      {createOpen && (
        <CreateBranchDialog
          onCreate={props.createBranch}
          onClose={closeCreate}
          t={t}
        />
      )}
      {graphOpen && (
        <GraphDialog
          graph={props.graph}
          onClose={() => { setGraphOpen(false) }}
          t={t}
        />
      )}
    </div>
  )
}
