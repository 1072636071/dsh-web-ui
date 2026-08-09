// @vitest-environment jsdom
/**
 * Chip-row behavior tests: the dock entry renders the project/branch chips
 * from the workspace/session baselines, non-repository workspaces hide the
 * branch chip, both popovers search/filter and mark the current item, the
 * footer flows fire the right verbs, switch rejections surface readable
 * copy, and the create/graph dialogs behave (validation, duplicate copy,
 * lane rendering).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessionId, WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import type { BranchesView, GitError, GraphView, RepoStatus, SwitchResult } from '../src/core/types.ts'
import type { GitGraphInjected, OpenFolderResult } from '../src/client/index.ts'
import type { ContextChipsRowProps } from '../src/client/chips/ContextChipsRow.tsx'
import { ContextChipsRow } from '../src/client/chips/ContextChipsRow.tsx'
import { zh, type GitGraphKey } from '../src/client/locales.ts'

afterEach(cleanup)

const sid = (value: string): SessionId => value as SessionId
const wid = (value: string): WorkspaceId => value as WorkspaceId

/** Minimal translate over the zh dictionary (template params included). */
function makeTranslate(): ContextChipsRowProps['t'] {
  return (key, params) => {
    let text = zh[key as GitGraphKey] ?? key
    if (params !== undefined) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value))
      }
    }
    return text
  }
}

const OK = <T,>(value: T): { ok: true; value: T } => ({ ok: true, value })
const FAIL = (error: GitError): { ok: false; error: GitError } => ({ ok: false, error })

interface BenchOptions {
  cwd?: string
  workspaceId?: string
  workspaceTitle?: string
  blank?: boolean
  repoStatus?: RepoStatus | null
  branchesView?: BranchesView | null
  switchResult?: SwitchResult
  createResult?: SwitchResult
  graphView?: GraphView | null
}

/** Render the chip row with stub framework hooks and a scripted inject face. */
function bench(options: BenchOptions = {}) {
  const sessionId = sid('sess-1')
  const cwd = options.cwd ?? '/ws/proj'
  const workspaceId = options.workspaceId === undefined ? undefined : wid(options.workspaceId)
  const repoStatus = options.repoStatus === undefined
    ? { root: '/ws/proj', branch: 'main', head: 'abc1234', dirtyFiles: 0, untrackedFiles: 0, conflicts: 0, operationInProgress: false }
    : options.repoStatus
  const branchesView = options.branchesView === undefined
    ? {
      root: '/ws/proj', branch: 'main',
      branches: [
        { name: 'feature/x', current: false },
        { name: 'main', current: true },
      ],
      dirtyFiles: 0, untrackedFiles: 0, conflicts: 0, operationInProgress: false,
    }
    : options.branchesView

  const calls: Record<string, unknown[]> = {
    repoStatus: [], branches: [], switchBranch: [], createBranch: [], graph: [],
    openFolder: [], clearWorkspace: [], selectWorkspace: [], subscribeChanges: [],
  }
  const record = <K extends keyof typeof calls>(key: K, ...args: unknown[]): void => {
    calls[key].push(args)
  }

  const injected: GitGraphInjected = {
    repoStatus: vi.fn(async () => { record('repoStatus'); return repoStatus }),
    branches: vi.fn(async () => { record('branches'); return branchesView }),
    switchBranch: vi.fn(async (branch: string) => {
      record('switchBranch', branch)
      return options.switchResult ?? { ok: true, branch }
    }),
    createBranch: vi.fn(async (name: string) => {
      record('createBranch', name)
      return options.createResult ?? { ok: true, branch: name }
    }),
    graph: vi.fn(async (limit?: number) => {
      record('graph', limit)
      return options.graphView ?? null
    }),
    subscribeChanges: vi.fn((_onChange: () => void) => { record('subscribeChanges'); return () => {} }),
    selectWorkspace: vi.fn(async (id: WorkspaceId) => { record('selectWorkspace', id) }),
    openFolder: vi.fn(async (): Promise<OpenFolderResult> => { record('openFolder'); return { ok: true } }),
    clearWorkspace: vi.fn(() => { record('clearWorkspace') }),
  }

  const props: ContextChipsRowProps = {
    sessionId,
    useSession: (() => undefined) as never,
    useSessions: ((selector: (state: { byId: Record<string, { cwd?: string; blank?: boolean }> }) => unknown) =>
      selector({ byId: { [sessionId]: { cwd, blank: options.blank === true } } })) as never,
    useWorkspaces: ((selector: (state: unknown) => unknown) => selector({
      items: workspaceId === undefined ? [] : [{
        workspaceId, title: options.workspaceTitle ?? 'My Project', path: cwd,
        sessionIds: [sessionId], createdAt: 0, updatedAt: 0,
      }],
      archivedSessionIds: [], state: 'idle', phase: 'ready', error: null,
      baselinesReady: true, recentWorkspaceId: workspaceId,
    })) as never,
    t: makeTranslate(),
    ...injected,
  }

  const view = render(<ContextChipsRow {...props} />)
  return { view, injected, calls, props }
}

describe('ContextChipsRow', () => {
  it('shows the project chip with the workspace title', async () => {
    bench({ workspaceId: 'w1', workspaceTitle: 'My Project' })
    expect(await screen.findByRole('button', { name: '项目' })).toBeTruthy()
    expect(screen.getByText('My Project')).toBeTruthy()
  })

  it('hides the whole chip row for blank sessions (hero dedup)', async () => {
    bench({ workspaceId: 'w1', blank: true })
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(screen.queryByRole('button', { name: '项目' })).toBeNull()
    expect(screen.queryByRole('button', { name: '分支' })).toBeNull()
  })

  it('hides the branch chip when the workspace is not a git repository', async () => {
    bench({ workspaceId: 'w1', repoStatus: null })
    await screen.findByRole('button', { name: '项目' })
    expect(screen.queryByRole('button', { name: '分支' })).toBeNull()
  })

  it('shows the branch chip with the current branch name', async () => {
    bench({ workspaceId: 'w1' })
    const branchChip = await screen.findByRole('button', { name: '分支' })
    expect(branchChip.textContent).toContain('main')
  })

  it('lists workspaces with the current one checked and filters by search', async () => {
    const { injected } = bench({ workspaceId: 'w1' })
    fireEvent.click(await screen.findByRole('button', { name: '项目' }))
    const listbox = await screen.findByRole('listbox', { name: '搜索工作区' })
    expect(listbox.textContent).toContain('My Project')
    const input = screen.getByPlaceholderText('搜索工作区')
    fireEvent.change(input, { target: { value: 'zzz' } })
    expect(screen.getByText('没有匹配的工作区')).toBeTruthy()
    fireEvent.change(input, { target: { value: 'proj' } })
    expect(screen.getByRole('option', { name: /My Project/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('option', { name: /My Project/ }))
    expect(injected.selectWorkspace).toHaveBeenCalledWith(wid('w1'))
  })

  it('fires the open-folder and clear-workspace flows from the footer', async () => {
    const { injected } = bench({ workspaceId: 'w1' })
    fireEvent.click(await screen.findByRole('button', { name: '项目' }))
    fireEvent.click(await screen.findByRole('button', { name: '打开文件夹' }))
    expect(injected.openFolder).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '不在项目中工作' }))
    expect(injected.clearWorkspace).toHaveBeenCalled()
  })

  it('keeps the remote-connect entry disabled', async () => {
    bench({ workspaceId: 'w1' })
    fireEvent.click(await screen.findByRole('button', { name: '项目' }))
    const remote = await screen.findByRole('button', { name: /远程连接/ })
    expect((remote as HTMLButtonElement).disabled).toBe(true)
  })

  it('switches a branch from the list and closes on success', async () => {
    const { injected, calls } = bench({ workspaceId: 'w1' })
    fireEvent.click(await screen.findByRole('button', { name: '分支' }))
    fireEvent.click(await screen.findByRole('option', { name: 'feature/x' }))
    expect(calls.switchBranch).toEqual([['feature/x']])
    expect(await screen.findByText('已切换到分支 feature/x')).toBeTruthy()
    expect(injected.switchBranch).toHaveBeenCalled()
  })

  it('shows readable copy when a switch is rejected', async () => {
    bench({
      workspaceId: 'w1',
      switchResult: { ok: false, error: { code: 'conflicts-present', message: 'conflicts' } },
    })
    fireEvent.click(await screen.findByRole('button', { name: '分支' }))
    fireEvent.click(await screen.findByRole('option', { name: 'feature/x' }))
    expect(await screen.findByText('当前仓库还有未解决的冲突，先处理完再切换分支。')).toBeTruthy()
  })

  it('shows the overwrite copy with blocked paths', async () => {
    bench({
      workspaceId: 'w1',
      switchResult: {
        ok: false,
        error: { code: 'untracked-changes-would-be-overwritten', message: 'blocked', paths: ['a.txt'], moreFiles: 2 },
      },
    })
    fireEvent.click(await screen.findByRole('button', { name: '分支' }))
    fireEvent.click(await screen.findByRole('option', { name: 'feature/x' }))
    expect(await screen.findByText(/未跟踪文件会被目标分支覆盖："a.txt" 等另外 2 个文件/)).toBeTruthy()
  })

  it('creates a branch through the dialog with validation copy', async () => {
    const { injected } = bench({ workspaceId: 'w1' })
    fireEvent.click(await screen.findByRole('button', { name: '分支' }))
    fireEvent.click(await screen.findByRole('button', { name: /创建并检出新分支/ }))
    const input = screen.getByLabelText('分支名')
    fireEvent.change(input, { target: { value: 'bad name' } })
    fireEvent.click(screen.getByRole('button', { name: '创建并切换' }))
    expect(await screen.findByText('分支名无效，请重新输入。')).toBeTruthy()
    expect(injected.createBranch).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: 'feature/good' } })
    fireEvent.click(screen.getByRole('button', { name: '创建并切换' }))
    expect(injected.createBranch).toHaveBeenCalledWith('feature/good')
  })

  it('shows duplicate-name copy from the host', async () => {
    bench({
      workspaceId: 'w1',
      createResult: { ok: false, error: { code: 'branch-already-exists', message: 'dup' } },
    })
    fireEvent.click(await screen.findByRole('button', { name: '分支' }))
    fireEvent.click(await screen.findByRole('button', { name: /创建并检出新分支/ }))
    fireEvent.change(screen.getByLabelText('分支名'), { target: { value: 'feature/x' } })
    fireEvent.click(screen.getByRole('button', { name: '创建并切换' }))
    expect(await screen.findByText('分支已存在，请换一个名称。')).toBeTruthy()
  })

  it('renders the Git graph with lanes, refs, and load-more', async () => {
    const graphView: GraphView = {
      root: '/ws/proj', branch: 'main',
      commits: [
        { oid: 'aabbcc', parents: ['ddeeff'], subject: 'merge work', author: 'Alice', authorTime: 1700000000, refs: ['main', 'v1'] },
        { oid: 'ddeeff', parents: [], subject: 'root commit', author: 'Bob', authorTime: 1690000000, refs: [] },
      ],
      hasMore: true,
    }
    const { calls } = bench({ workspaceId: 'w1', graphView })
    fireEvent.click(await screen.findByRole('button', { name: '分支' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Git 图谱' }))
    const dialog = await screen.findByRole('dialog', { name: 'Git 图谱' })
    expect(dialog.textContent).toContain('merge work')
    expect(dialog.textContent).toContain('2 个提交')
    expect(calls.graph).toEqual([[200]])
    fireEvent.click(screen.getByRole('button', { name: '加载更多' }))
    expect(calls.graph).toEqual([[200], [102]])
  })
})
