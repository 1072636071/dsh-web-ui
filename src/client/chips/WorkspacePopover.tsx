/**
 * The project (workspace) picker popover: searchable workspace list with the
 * current workspace checked, plus the footer flows (open folder / remote
 * connect placeholder / work outside a project).
 * @module dsh-git-graph/client/chips/WorkspacePopover
 */

import { useMemo, useState } from 'react'
import {
  IconCheckOutline14, IconFolderOpen16, IconSearchOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { GitGraphKey } from '../locales.ts'
import type { OpenFolderResult } from '../index.ts'
import { cx, Backdrop } from './Chip.tsx'
import css from './context.module.css'

/** One workspace row the picker renders (structural subset of WorkspaceView). */
export interface WorkspaceRow {
  workspaceId: WorkspaceId
  title: string
  path: string
}

/** Props of the workspace picker popover. */
export interface WorkspacePopoverProps {
  workspaces: readonly WorkspaceRow[]
  /** Currently selected workspace (renders the trailing check). */
  selectedId?: WorkspaceId | undefined
  /** Activate the picked workspace and open its (new) session. */
  onPick: (workspaceId: WorkspaceId) => void
  /** Directory picker → create/connect workspace → open its session. */
  onOpenFolder: () => Promise<OpenFolderResult>
  /** Clear the workspace selection into the New Session view state. */
  onClearWorkspace: () => void
  onClose: () => void
  t: Translate<GitGraphKey>
}

/**
 * The project picker popover.
 * @param props - see {@link WorkspacePopoverProps}.
 */
export function WorkspacePopover({
  workspaces, selectedId, onPick, onOpenFolder, onClearWorkspace, onClose, t,
}: WorkspacePopoverProps) {
  const [query, setQuery] = useState('')
  const [openError, setOpenError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle === '') return workspaces
    return workspaces.filter(workspace =>
      workspace.title.toLowerCase().includes(needle) || workspace.path.toLowerCase().includes(needle))
  }, [workspaces, query])

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className={css.popover} role="listbox" aria-label={t('project.search')}>
        <div className={css.searchBox}>
          <IconSearchOutline16 size={14} />
          <input
            className={css.searchInput}
            value={query}
            onChange={(event) => { setQuery(event.target.value) }}
            placeholder={t('project.search')}
            autoFocus
          />
        </div>
        <div className={css.list}>
          {filtered.length === 0
            ? <div className={css.empty}>{t('project.empty')}</div>
            : filtered.map(workspace => (
              <button
                type="button"
                key={workspace.workspaceId}
                className={cx(css.item, workspace.workspaceId === selectedId && css.itemActive)}
                onClick={() => { onPick(workspace.workspaceId) }}
                role="option"
                aria-selected={workspace.workspaceId === selectedId}
              >
                <span className={css.itemText}>
                  <span className={css.itemName}>{workspace.title}</span>
                  <span className={css.itemPath}>{workspace.path}</span>
                </span>
                {workspace.workspaceId === selectedId
                  && <IconCheckOutline14 className={css.check} size={14} />}
              </button>
            ))}
        </div>
        {openError !== null && <div className={css.notice}>{openError}</div>}
        <div className={css.footer}>
          <button
            type="button"
            className={css.footerItem}
            onClick={() => {
              void onOpenFolder().then((result) => {
                if (result.ok || 'cancelled' in result) return
                setOpenError(result.error)
              })
            }}          >
            <IconFolderOpen16 size={14} />
            {t('project.openFolder')}
          </button>
          <button type="button" className={cx(css.footerItem, css.footerItemDisabled)} disabled>
            <IconFolderOpen16 size={14} />
            {t('project.remoteConnect')}
            <span className={css.footerHint}>{t('project.remoteConnectSoon')}</span>
          </button>
          <button type="button" className={css.footerItem} onClick={onClearWorkspace}>
            {t('project.workOutside')}
          </button>
        </div>
      </div>
    </>
  )
}
