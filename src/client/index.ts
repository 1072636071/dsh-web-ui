/**
 * Task-board client plugin: wires the framework-free core (controller,
 * execution service, store) to the real client runtime and mounts the two
 * DOM surfaces — the sidebar entry row and the board view in the center
 * column.
 *
 * Failure policy: DOM mounting problems are logged, never thrown — the web
 * shell fails the whole boot when a plugin apply throws, and an external
 * plugin must not take the GUI down.
 */
import type { ClientContext, SessionId, WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import { BoardController } from '../core/controller.ts'
import { ExecutionService } from '../core/execution.ts'
import { LocalStorageTaskStore } from '../core/store.ts'
import { mountBoard } from './board-mount.tsx'
import { mountSidebarEntry } from './sidebar-entry.ts'

/** Required services (fiber inject waiting — the runtime must be up first). */
export const inject = ['sessions', 'workspaces']

/**
 * Mount the task board.
 * @param ctx - client root context (services: sessions, workspaces).
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    const sessions = ctx.sessions
    const workspaces = ctx.workspaces

    // Core wiring: real runtime faces into the framework-free services.
    const store = new LocalStorageTaskStore()
    const exec = new ExecutionService({
      sessions: {
        list: sessions.list,
        binding: id => sessions.binding(id as SessionId),
      },
      workspaces: {
        list: workspaces.list,
        connectWorkspace: id => workspaces.connectWorkspace(id as WorkspaceId),
      },
      history: {
        source: id => ctx.sessionHistory.source(id as SessionId),
      },
    })
    const controller = new BoardController({
      store,
      exec,
      sessions: {
        list: sessions.list,
        open: id => sessions.open(id as SessionId),
      },
    })
    controller.start()

    const disposers: Array<() => void> = []
    try {
      disposers.push(mountSidebarEntry(controller))
      disposers.push(mountBoard(controller))
    } catch (error) {
      // DOM failures degrade the board, never the GUI.
      console.error('[dsh-task-board] mount failed:', error)
    }

    return () => {
      for (const dispose of disposers.splice(0)) dispose()
      controller.dispose()
    }
  }, 'ui-task-board: controller + mounts')
}
