/**
 * The header context-chip entry: the git branch selector chip, mounted in
 * the resident conversation header's context hole (`conversation.session
 * .header.context`) right beside the official workspace selector. The
 * session-maybe seat keeps the chip mounted in every phase — hero (blank
 * session) included — and the chip hides itself only when its data source
 * is absent (no session cwd, or not a git repository).
 * @module dsh-git-graph/client/chips/BranchChip
 */

import { useCallback, useEffect, useState } from 'react'
import { IconBranchOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { BranchesView, RepoStatus } from '../../core/types.ts'
import type { GitGraphInjected } from '../index.ts'
import { Chip } from './Chip.tsx'
import { BranchPopover } from './BranchPopover.tsx'
import { CreateBranchDialog } from './CreateBranchDialog.tsx'
import { GraphDialog } from '../graph/GraphDialog.tsx'
import css from './context.module.css'

/** Full props of the branch chip: the context hole's runtime share + the git-graph inject face + the locale seat. */
export type BranchChipProps =
  PropsRuntime<'conversation.session.header.context'>
  & GitGraphInjected
  & PropsLocale<'git-graph'>

/**
 * The git branch selector chip.
 * @param props - the composed context-hole entry props.
 */
export function BranchChip(props: BranchChipProps) {
  /** Repository state: undefined = loading, null = not a repository, else the snapshot. */
  const [repo, setRepo] = useState<RepoStatus | null | undefined>(undefined)
  /** Fresh branch list, fetched when the branch popover opens. */
  const [branchesView, setBranchesView] = useState<BranchesView | null>(null)
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

  // Initial load + host-pushed external changes + focus refresh. The inject
  // face is re-derived per session (adoption), so a session switch re-fetches
  // through the new repoStatus identity.
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

  const closeCreate = (): void => {
    setCreateOpen(false)
    refetch()
  }

  // Fetch the fresh branch list each time the popover opens. All hooks stay
  // above the data-gated returns so the hook order is stable while `repo`
  // settles from undefined (loading) to a snapshot.
  useEffect(() => {
    if (!branchOpen) return
    let live = true
    setBranchesView(null)
    props.branches().then((view) => { if (live) setBranchesView(view) })
    return () => { live = false }
  }, [branchOpen, props.branches])

  // Loading or not a repository: no chip (no dead control). A workspace that
  // becomes a repository appears on the next refresh.
  if (repo === undefined || repo === null) return null

  const openBranchPopover = (): void => {
    setBranchOpen(open => !open)
  }

  return (
    <div className={css.anchor}>
      <Chip
        icon={<IconBranchOutline16 size={14} />}
        label={repo.branch === '' ? props.t('branch.detached') : repo.branch}
        ariaLabel={props.t('chip.aria.branch')}
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
          t={props.t}
        />
      )}
      {createOpen && (
        <CreateBranchDialog
          onCreate={props.createBranch}
          onClose={closeCreate}
          t={props.t}
        />
      )}
      {graphOpen && (
        <GraphDialog
          graph={props.graph}
          onClose={() => { setGraphOpen(false) }}
          t={props.t}
        />
      )}
    </div>
  )
}
