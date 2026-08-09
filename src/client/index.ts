/**
 * Git-graph surface plugin, browser half: the persistent project + branch
 * chip row in the `conversation.input.dock` strip. All git facts arrive
 * through the host /git routes (this package's own host half); the inject
 * face carries the business verbs, the components stay pure props.
 *
 * Hero dedup: the dock slot is rendered only in the active (non-hero) phase
 * by ConversationRoot, where the hero workspace row is absent — the two
 * surfaces can never coexist.
 * @module dsh-git-graph/client
 */

import type { ClientContext, SessionId, WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the ui-conversation SlotMap merge (the input.dock entry).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {
  BranchesView, GitError, GraphView, RepoStatus, SwitchResult,
} from '../core/types.ts'
import { GitApi, subscribeChanges } from './api.ts'
import { ContextChipsRow } from './chips/ContextChipsRow.tsx'
import { en, zh, type GitGraphKey } from './locales.ts'

export type { GitGraphKey } from './locales.ts'
export { ContextChipsRow } from './chips/ContextChipsRow.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The git-graph chip strip's copy. */
    'git-graph': GitGraphKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'git-graph'

/** Required services: slots for the dock entry, sessions/workspaces for the workspace flows, locale for the copy. */
export const inject = ['slots', 'sessions', 'workspaces', 'connection', 'locale']

/** One workspace-flow outcome (open folder). */
export type OpenFolderResult =
  | { ok: true }
  | { ok: false; cancelled: true }
  | { ok: false; error: string }

/** Injected business face of the chip row: git verbs and workspace flows. */
export interface GitGraphInjected {
  /** The workspace repository snapshot; null when not a repository. */
  repoStatus: () => Promise<RepoStatus | null>
  /** Local branch list with the current branch marked. */
  branches: () => Promise<BranchesView | null>
  /** Workspace-level `git switch --no-guess <branch>`. */
  switchBranch: (branch: string) => Promise<SwitchResult>
  /** `git switch --no-guess -c <name>` from the current HEAD. */
  createBranch: (name: string) => Promise<SwitchResult>
  /** Topo-ordered commit graph. */
  graph: (limit?: number) => Promise<GraphView | null>
  /** Host-pushed branch-state changes for the session's workspace. */
  subscribeChanges: (onChange: () => void) => () => void
  /** Activate the picked workspace and open its reusable/new session. */
  selectWorkspace: (workspaceId: WorkspaceId) => Promise<void>
  /** Directory picker → create/connect workspace → open its session. */
  openFolder: () => Promise<OpenFolderResult>
  /** Clear the workspace selection into the New Session view state. */
  clearWorkspace: () => void
}

/** The session-cwd lookup failure shared by the injected verbs. */
const NO_WORKSPACE: GitError = { code: 'workspace-unknown', message: 'session has no workspace' }

/**
 * Client plugin body: the chip row dock entry with its git verbs.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-git-graph: dictionaries')

  const git = new GitApi()

  // Conditional mount: 'conversation.input.dock' is declared by the
  // conversation entry; the conversation service being up is the
  // registration-safe signal (the GoalDock/QueueDock seam).
  ctx.inject(['slots', 'conversation', 'sessions', 'workspaces'], (scope: ClientContext) => {
    const sessions = scope.sessions
    const workspaces = scope.workspaces

    /** The session's workspace root, resolved at call time from the sessions baseline. */
    const cwdOf = (sessionId: SessionId): string | undefined =>
      sessions.list.getSnapshot().byId[sessionId]?.cwd

    scope.effect(() => scope.slots.register({
      name: 'conversation.input.dock',
      id: 'git-graph',
      order: 100,
      locale: NS,
      inject: (sessionId: SessionId): GitGraphInjected => {
        /** Resolve the workspace root for one git call. */
        const pathOf = (): { ok: true; path: string } | { ok: false; error: GitError } => {
          const cwd = cwdOf(sessionId)
          if (cwd === undefined || cwd === '') return { ok: false, error: NO_WORKSPACE }
          return { ok: true, path: cwd }
        }
        return {
          repoStatus: async () => {
            const resolved = pathOf()
            if (!resolved.ok) return null
            const result = await git.status(resolved.path)
            return result.ok ? result.value : null
          },
          branches: async () => {
            const resolved = pathOf()
            if (!resolved.ok) return null
            const result = await git.branches(resolved.path)
            return result.ok ? result.value : null
          },
          switchBranch: async (branch) => {
            const resolved = pathOf()
            if (!resolved.ok) return { ok: false, error: resolved.error }
            const result = await git.switchBranch(resolved.path, branch)
            return result.ok ? { ok: true, branch: result.value.branch } : result
          },
          createBranch: async (name) => {
            const resolved = pathOf()
            if (!resolved.ok) return { ok: false, error: resolved.error }
            const result = await git.createBranch(resolved.path, name)
            return result.ok ? { ok: true, branch: result.value.branch } : result
          },
          graph: async (limit) => {
            const resolved = pathOf()
            if (!resolved.ok) return null
            const result = await git.graph(resolved.path, limit)
            return result.ok ? result.value : null
          },
          subscribeChanges: (onChange) => {
            const resolved = pathOf()
            if (!resolved.ok) return () => {}
            return subscribeChanges(resolved.path, onChange)
          },
          selectWorkspace: async (workspaceId) => {
            const next = await workspaces.connectWorkspace(workspaceId)
            sessions.open(next)
          },
          openFolder: async () => {
            let picked: string | null
            try {
              picked = await workspaces.pickDirectory()
            } catch (error) {
              return { ok: false, error: error instanceof Error ? error.message : String(error) }
            }
            if (picked === null) return { ok: false, cancelled: true }
            try {
              const workspace = await workspaces.create({ path: picked })
              const next = await workspaces.connectWorkspace(workspace.workspaceId)
              sessions.open(next)
              return { ok: true }
            } catch (error) {
              return { ok: false, error: error instanceof Error ? error.message : String(error) }
            }
          },
          clearWorkspace: () => { sessions.clear() },
        }
      },
    }, ContextChipsRow), 'dsh-git-graph: chip row registration')
  })
}
