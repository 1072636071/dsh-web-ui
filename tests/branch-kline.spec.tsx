// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { WorkspaceKlineBranch } from '../src/client/WorkspaceKlineBranch.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate(zh, zh as never) as never
const wid = (id: string) => id as WorkspaceId

/** Render the branch against a state stub. */
function renderBranch(state: { entries: Record<string, unknown>; expanded: string[] }, ensure = vi.fn()) {
  const seeded = {
    getSnapshot: () => state,
    subscribe: () => () => {},
  }
  const useStore = ((selector: (s: { entries: Record<string, unknown>; expanded: string[] }) => unknown) =>
    selector(seeded.getSnapshot())) as never
  return render(
    <WorkspaceKlineBranch
      workspaceId={wid('ws-1')}
      useStore={useStore}
      actions={{} as never}
      ensure={ensure}
      useSessions={(() => undefined) as never}
      useWorkspaces={(() => undefined) as never}
      t={t}
    />,
  )
}

const candles = [
  { date: '2026-08-06', open: 0, close: 38, high: 38, low: 0, addLines: 65, delLines: 27, commits: 2 },
  { date: '2026-08-07', open: 38, close: 68, high: 68, low: 38, addLines: 30, delLines: 0, commits: 1 },
]

describe('WorkspaceKlineBranch', () => {
  it('renders nothing while the branch is collapsed', () => {
    const view = renderBranch({ entries: {}, expanded: [] })
    expect(view.container.textContent).toBe('')
  })

  it('renders the full chart when expanded and ready', () => {
    const view = renderBranch({
      entries: { 'ws-1': { workspaceId: 'ws-1', candles, state: 'ready', error: null } },
      expanded: ['ws-1'],
    })
    expect(view.container.querySelectorAll('[data-testid="code-kline-candle"]')).toHaveLength(2)
    // The branch shows the volume sub-chart.
    expect(view.container.querySelectorAll('[data-testid="code-kline-volume"]')).toHaveLength(2)
  })

  it('requests the K-line when expanded with no entry yet', () => {
    const ensure = vi.fn()
    const view = renderBranch({ entries: {}, expanded: ['ws-1'] }, ensure)
    expect(ensure).toHaveBeenCalledWith(wid('ws-1'))
    expect(view.container.textContent).toContain('加载中')
  })

  it('shows the absence reason when expanded without candles', () => {
    const view = renderBranch({
      entries: {
        'ws-1': { workspaceId: 'ws-1', candles: [], reason: 'not-a-git-repository', state: 'ready', error: null },
      },
      expanded: ['ws-1'],
    })
    expect(view.container.textContent).toContain('非 git 仓库')
  })
})
