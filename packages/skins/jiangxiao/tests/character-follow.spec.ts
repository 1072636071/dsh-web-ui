// @vitest-environment jsdom
/**
 * 工单 06：DSH 状态自动跟随单测。
 *
 * diffEvents：纯函数表驱动测试，覆盖快照差分->事件映射优先级判定。
 * extractCore：从 ConversationSnapshot 提取核心字段。
 * attachSessionFollow：订阅释放、current 切换、无会话->idle、welcome 驻留。
 *
 * 只测外部行为，不测实现细节。
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  diffEvents,
  extractCore,
  EMPTY_CORE,
  hasVisiblePartialChunk,
  attachSessionFollow,
  type SnapshotCore,
} from '../src/client/character-follow.ts'
import type { CharacterEvent, CharacterState } from '../src/client/character-state.ts'
import type { CharacterOverlay } from '../src/client/character-overlay.ts'
import type {
  ConversationSnapshot,
  ISessions,
  SessionId,
  SessionListState,
} from '@deepseek-ai/dsh-client-runtime/client'

/** 辅助构造核心快照（覆盖 EMPTY_CORE）。 */
function core(overrides: Partial<SnapshotCore> = {}): SnapshotCore {
  return { ...EMPTY_CORE, ...overrides }
}

/** 辅助：pending kind 集合。 */
function kinds(...ks: Array<'approval' | 'question'>): ReadonlySet<'approval' | 'question'> {
  return new Set(ks)
}

// --- diffEvents：纯函数表驱动测试 -------------------------------------------

describe('diffEvents - error highest priority', () => {
  it('error appears -> [session_error]', () => {
    expect(diffEvents(core(), core({ hasError: true }))).toEqual([{ type: 'session_error' }])
  })

  it('error + permission simultaneously -> [session_error] (error wins)', () => {
    const curr = core({ hasError: true, pendingKinds: kinds('approval') })
    expect(diffEvents(core(), curr)).toEqual([{ type: 'session_error' }])
  })

  it('error + working simultaneously -> [session_error] (error wins)', () => {
    const curr = core({ hasError: true, runningCallsCount: 2 })
    expect(diffEvents(core(), curr)).toEqual([{ type: 'session_error' }])
  })

  it('error persists -> no event', () => {
    expect(diffEvents(core({ hasError: true }), core({ hasError: true }))).toEqual([])
  })

  it('first snapshot with error -> [session_error]', () => {
    expect(diffEvents(null, core({ hasError: true }))).toEqual([{ type: 'session_error' }])
  })
})

describe('diffEvents - permission', () => {
  it('permission appears -> [permission_asked]', () => {
    expect(diffEvents(core(), core({ pendingKinds: kinds('approval') }))).toEqual([
      { type: 'permission_asked' },
    ])
  })

  it('permission disappears -> [permission_replied]', () => {
    expect(diffEvents(core({ pendingKinds: kinds('question') }), core())).toEqual([
      { type: 'permission_replied' },
    ])
  })

  it('permission kind changes (approval -> question) -> [permission_replied, permission_asked]', () => {
    const prev = core({ pendingKinds: kinds('approval') })
    const curr = core({ pendingKinds: kinds('question') })
    // approval 消失 + question 出现：但 prev 有 pending 且 curr 有 pending
    // permission 退出条件：prev 有 pending && curr 无 pending -> 不满足
    // permission 进入条件：curr 有 pending && prev 无 pending -> 不满足
    // 所以不发 permission 事件
    expect(diffEvents(prev, curr)).toEqual([])
  })
})

describe('diffEvents - working', () => {
  it('working appears -> [tool_called]', () => {
    expect(diffEvents(core(), core({ runningCallsCount: 2 }))).toEqual([{ type: 'tool_called' }])
  })

  it('working disappears -> [tool_finished]', () => {
    expect(diffEvents(core({ runningCallsCount: 1 }), core())).toEqual([
      { type: 'tool_finished' },
    ])
  })

  it('working count changes (1 -> 2) -> no event (still working)', () => {
    expect(diffEvents(core({ runningCallsCount: 1 }), core({ runningCallsCount: 2 }))).toEqual([])
  })
})

describe('diffEvents - replying', () => {
  it('visible chunk appears -> [text_delta]', () => {
    const prev = core({ running: true })
    const curr = core({ running: true, hasVisibleChunk: true })
    expect(diffEvents(prev, curr)).toEqual([{ type: 'text_delta' }])
  })

  it('chunk persists -> no event', () => {
    const prev = core({ running: true, hasVisibleChunk: true })
    const curr = core({ running: true, hasVisibleChunk: true })
    expect(diffEvents(prev, curr)).toEqual([])
  })
})

describe('diffEvents - thinking', () => {
  it('running starts without chunk -> [prompt_admitted]', () => {
    expect(diffEvents(core(), core({ running: true }))).toEqual([{ type: 'prompt_admitted' }])
  })

  it('thinking persists -> no event', () => {
    expect(diffEvents(core({ running: true }), core({ running: true }))).toEqual([])
  })

  it('first snapshot running -> [prompt_admitted]', () => {
    expect(diffEvents(null, core({ running: true }))).toEqual([{ type: 'prompt_admitted' }])
  })
})

describe('diffEvents - done edge', () => {
  it('running true->false without error/pending -> [execution_finished pendingTools=false]', () => {
    const prev = core({ running: true, hasVisibleChunk: true })
    const curr = core()
    const events = diffEvents(prev, curr)
    expect(events).toContainEqual({ type: 'execution_finished', pendingTools: false })
  })

  it('running true->false with runningCalls -> execution_finished pendingTools=true', () => {
    const prev = core({ running: true, runningCallsCount: 1 })
    const curr = core({ runningCallsCount: 1 })
    const events = diffEvents(prev, curr)
    expect(events).toContainEqual({ type: 'execution_finished', pendingTools: true })
  })

  it('running true->false with error -> no execution_finished', () => {
    const prev = core({ running: true })
    const curr = core({ hasError: true })
    // error 出现 -> [session_error]（立即返回）
    expect(diffEvents(prev, curr)).toEqual([{ type: 'session_error' }])
  })

  it('running true->false with pending -> no execution_finished', () => {
    const prev = core({ running: true })
    const curr = core({ pendingKinds: kinds('approval') })
    const events = diffEvents(prev, curr)
    // permission 进入，但 done 边沿条件 !hasPendingCore(curr) 不满足
    expect(events).not.toContainEqual(expect.objectContaining({ type: 'execution_finished' }))
  })
})

describe('diffEvents - idle fallback', () => {
  it('initial idle snapshot -> [session_idle]', () => {
    expect(diffEvents(null, core())).toEqual([{ type: 'session_idle' }])
  })

  it('idle persists -> no event', () => {
    expect(diffEvents(core(), core())).toEqual([])
  })

  it('running->idle -> [session_idle] (via done edge or idle fallback)', () => {
    // running true->false 无 error/pending -> execution_finished
    // reducer 处理后进 done，不直接进 idle
    // 这里只测 diffEvents 输出
    const prev = core({ running: true })
    const curr = core()
    const events = diffEvents(prev, curr)
    // 有 execution_finished，不再发 session_idle（events 非空）
    expect(events).toContainEqual({ type: 'execution_finished', pendingTools: false })
    expect(events).not.toContainEqual({ type: 'session_idle' })
  })
})

describe('diffEvents - combined events (ordering)', () => {
  it('working exits + done edge -> [tool_finished, execution_finished]', () => {
    const prev = core({ running: true, runningCallsCount: 1 })
    const curr = core()
    expect(diffEvents(prev, curr)).toEqual([
      { type: 'tool_finished' },
      { type: 'execution_finished', pendingTools: false },
    ])
  })

  it('permission exits + working exits + done edge -> [permission_replied, tool_finished, execution_finished]', () => {
    const prev = core({ running: true, runningCallsCount: 1, pendingKinds: kinds('approval') })
    const curr = core()
    expect(diffEvents(prev, curr)).toEqual([
      { type: 'permission_replied' },
      { type: 'tool_finished' },
      { type: 'execution_finished', pendingTools: false },
    ])
  })

  it('working enters during running -> [tool_called] (no prompt_admitted)', () => {
    const prev = core({ running: true })
    const curr = core({ running: true, runningCallsCount: 1 })
    expect(diffEvents(prev, curr)).toEqual([{ type: 'tool_called' }])
  })
})

// --- extractCore + hasVisiblePartialChunk -----------------------------------

describe('hasVisiblePartialChunk', () => {
  it('text block with content -> true', () => {
    const partial = { turn: 0, step: 0, blocks: [{ kind: 'text', text: 'hello' }] }
    expect(hasVisiblePartialChunk(partial as never)).toBe(true)
  })

  it('reasoning block with content -> true', () => {
    const partial = { turn: 0, step: 0, blocks: [{ kind: 'reasoning', text: 'thinking...' }] }
    expect(hasVisiblePartialChunk(partial as never)).toBe(true)
  })

  it('empty text block -> false', () => {
    const partial = { turn: 0, step: 0, blocks: [{ kind: 'text', text: '' }] }
    expect(hasVisiblePartialChunk(partial as never)).toBe(false)
  })

  it('tool-call block only -> false', () => {
    const partial = { turn: 0, step: 0, blocks: [{ kind: 'tool-call', callId: 'c1', name: 'bash', argsRaw: '' }] }
    expect(hasVisiblePartialChunk(partial as never)).toBe(false)
  })

  it('empty blocks -> false', () => {
    const partial = { turn: 0, step: 0, blocks: [] }
    expect(hasVisiblePartialChunk(partial as never)).toBe(false)
  })
})

/** 构造 mock ConversationSnapshot（只填核心字段，其余省略）。 */
function mockSnapshot(overrides: {
  running?: boolean
  partial?: { blocks: Array<{ kind: string; text: string }> } | null
  runningCalls?: unknown[]
  pending?: Array<{ kind: 'approval' | 'question' }>
  promptError?: unknown
  lastAgentError?: string | null
  openError?: unknown
} = {}): ConversationSnapshot {
  return {
    running: overrides.running ?? false,
    partial: overrides.partial ?? null,
    runningCalls: overrides.runningCalls ?? [],
    pending: overrides.pending ?? [],
    promptError: overrides.promptError ?? null,
    lastAgentError: overrides.lastAgentError ?? null,
    openError: overrides.openError ?? null,
  } as unknown as ConversationSnapshot
}

describe('extractCore', () => {
  it('idle snapshot -> EMPTY_CORE', () => {
    expect(extractCore(mockSnapshot())).toEqual(EMPTY_CORE)
  })

  it('running snapshot -> running=true', () => {
    expect(extractCore(mockSnapshot({ running: true })).running).toBe(true)
  })

  it('partial with text -> hasVisibleChunk=true', () => {
    const snap = mockSnapshot({ partial: { blocks: [{ kind: 'text', text: 'hi' }] } })
    expect(extractCore(snap).hasVisibleChunk).toBe(true)
  })

  it('runningCalls -> runningCallsCount', () => {
    const snap = mockSnapshot({ runningCalls: [{}, {}] })
    expect(extractCore(snap).runningCallsCount).toBe(2)
  })

  it('pending approval -> pendingKinds has approval', () => {
    const snap = mockSnapshot({ pending: [{ kind: 'approval' }] })
    expect(extractCore(snap).pendingKinds.has('approval')).toBe(true)
    expect(extractCore(snap).pendingKinds.has('question')).toBe(false)
  })

  it('promptError non-null -> hasError=true', () => {
    expect(extractCore(mockSnapshot({ promptError: { op: 'send' } })).hasError).toBe(true)
  })

  it('lastAgentError non-null -> hasError=true', () => {
    expect(extractCore(mockSnapshot({ lastAgentError: 'boom' })).hasError).toBe(true)
  })

  it('openError non-null -> hasError=true', () => {
    expect(extractCore(mockSnapshot({ openError: { code: 'X' } })).hasError).toBe(true)
  })

  it('all errors null -> hasError=false', () => {
    expect(extractCore(mockSnapshot()).hasError).toBe(false)
  })
})

// --- attachSessionFollow：订阅链集成测试 -------------------------------------

/** mock 浮层控制器：记录 setState 调用。 */
function mockController(): CharacterOverlay & { calls: Array<{ state: CharacterState; line?: string }> } {
  const calls: Array<{ state: CharacterState; line?: string }> = []
  return {
    calls,
    setState(state: CharacterState, line?: string): void {
      calls.push({ state, line })
    },
    dispose(): void {},
  }
}

/** mock sessions 服务：最小可订阅 list + binding。 */
function mockSessions(): {
  sessions: ISessions
  setListCurrent: (id: string | undefined) => void
  setSnapshot: (id: string, snap: ConversationSnapshot) => void
  notifySession: (id: string) => void
  listSubscribers: number
  sessionSubscribers: (id: string) => number
} {
  let listState: SessionListState = {
    ids: [],
    byId: {},
    current: undefined,
    phase: 'ready',
    subagentsByParent: {},
    jobsBySession: {},
    currentAddress: undefined,
  } as SessionListState
  const listSubs: Array<() => void> = []
  const sessionSnaps: Map<string, ConversationSnapshot> = new Map()
  const sessionSubs: Map<string, Array<() => void>> = new Map()

  const sessions = {
    list: {
      getSnapshot: () => listState,
      subscribe: (fn: () => void) => {
        listSubs.push(fn)
        return () => {
          const i = listSubs.indexOf(fn)
          if (i >= 0) listSubs.splice(i, 1)
        }
      },
    },
    binding: (id: string) => {
      const subs = sessionSubs.get(id) ?? []
      return {
        sessionId: id,
        session: {
          sessionId: id,
          getSnapshot: () => sessionSnaps.get(id) ?? mockSnapshot(),
          subscribe: (fn: () => void) => {
            subs.push(fn)
            sessionSubs.set(id, subs)
            return () => {
              const i = subs.indexOf(fn)
              if (i >= 0) subs.splice(i, 1)
            }
          },
        },
      }
    },
  } as unknown as ISessions

  return {
    sessions,
    setListCurrent(id) {
      listState = { ...listState, current: id as unknown as SessionId }
      for (const fn of listSubs) fn()
    },
    setSnapshot(id, snap) {
      sessionSnaps.set(id, snap)
      const subs = sessionSubs.get(id) ?? []
      for (const fn of subs) fn()
    },
    notifySession(id) {
      const subs = sessionSubs.get(id) ?? []
      for (const fn of subs) fn()
    },
    get listSubscribers() { return listSubs.length },
    sessionSubscribers: (id) => (sessionSubs.get(id) ?? []).length,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('attachSessionFollow - dispose releases all subscriptions', () => {
  it('dispose stops list subscription (no further setState)', () => {
    const { sessions, setListCurrent } = mockSessions()
    const ctrl = mockController()
    const dispose = attachSessionFollow(sessions, ctrl, { now: () => 0, tickMs: 999999 })
    const callsBefore = ctrl.calls.length
    dispose()
    setListCurrent('s1')
    expect(ctrl.calls.length).toBe(callsBefore)
  })

  it('dispose stops session subscription (no further setState)', () => {
    const { sessions, setListCurrent, setSnapshot } = mockSessions()
    const ctrl = mockController()
    const dispose = attachSessionFollow(sessions, ctrl, { now: () => 0, tickMs: 999999 })
    setListCurrent('s1')
    const callsBefore = ctrl.calls.length
    dispose()
    setSnapshot('s1', mockSnapshot({ running: true }))
    expect(ctrl.calls.length).toBe(callsBefore)
  })

  it('dispose clears tick timer', () => {
    vi.useFakeTimers()
    const { sessions } = mockSessions()
    const ctrl = mockController()
    const dispose = attachSessionFollow(sessions, ctrl, { now: () => 0, tickMs: 100 })
    dispose()
    // 推进时间，不应有 setState 调用
    vi.advanceTimersByTime(1000)
    expect(ctrl.calls.length).toBe(0)
    vi.useRealTimers()
  })
})

describe('attachSessionFollow - current switch', () => {
  it('switching current re-attaches to new session', () => {
    const { sessions, setListCurrent, setSnapshot } = mockSessions()
    const ctrl = mockController()
    const dispose = attachSessionFollow(sessions, ctrl, { now: () => 0, tickMs: 999999 })
    setListCurrent('s1')
    setSnapshot('s1', mockSnapshot({ running: true }))
    setListCurrent('s2')
    setSnapshot('s2', mockSnapshot({ running: true, partial: { blocks: [{ kind: 'text', text: 'hi' }] } }))
    // s2 的快照应触发 setState（thinking -> replying 或类似）
    const states = ctrl.calls.map(c => c.state)
    expect(states).toContain('replying')
    dispose()
  })

  it('switching to undefined current -> idle', () => {
    const { sessions, setListCurrent, setSnapshot } = mockSessions()
    const ctrl = mockController()
    const dispose = attachSessionFollow(sessions, ctrl, { now: () => 0, tickMs: 999999 })
    setListCurrent('s1')
    setSnapshot('s1', mockSnapshot({ running: true }))
    setListCurrent(undefined)
    const states = ctrl.calls.map(c => c.state)
    expect(states[states.length - 1]).toBe('idle')
    dispose()
  })
})

describe('attachSessionFollow - no session -> idle', () => {
  it('initial no current -> idle (no setState beyond initial)', () => {
    const { sessions } = mockSessions()
    const ctrl = mockController()
    const dispose = attachSessionFollow(sessions, ctrl, { now: () => 0, tickMs: 999999 })
    // 无会话：不触发 setState（初始就是 idle）
    expect(ctrl.calls.length).toBe(0)
    dispose()
  })
})

describe('attachSessionFollow - initialWelcome', () => {
  it('initialWelcome=true -> setState(welcome) on init', () => {
    const { sessions } = mockSessions()
    const ctrl = mockController()
    const dispose = attachSessionFollow(sessions, ctrl, {
      now: () => 0,
      tickMs: 999999,
      initialWelcome: true,
    })
    expect(ctrl.calls[0]?.state).toBe('welcome')
    dispose()
  })

  it('initialWelcome=true + no session -> welcome holds (no immediate idle)', () => {
    const { sessions } = mockSessions()
    const ctrl = mockController()
    const dispose = attachSessionFollow(sessions, ctrl, {
      now: () => 0,
      tickMs: 999999,
      initialWelcome: true,
    })
    // 无会话：welcome 保持，不回 idle
    const states = ctrl.calls.map(c => c.state)
    expect(states).toEqual(['welcome'])
    dispose()
  })

  it('initialWelcome + current idle session -> welcome holds (idle does not cancel)', () => {
    // 启用皮肤时 current 已是空闲会话：welcome 不应被首张 idle 快照抢占。
    const { sessions, setListCurrent, setSnapshot } = mockSessions()
    const ctrl = mockController()
    setSnapshot('s1', mockSnapshot()) // idle
    setListCurrent('s1') // 初始 current = s1
    const dispose = attachSessionFollow(sessions, ctrl, {
      now: () => 0,
      tickMs: 999999,
      initialWelcome: true,
    })
    const states = ctrl.calls.map(c => c.state)
    expect(states[0]).toBe('welcome')
    expect(states[states.length - 1]).toBe('welcome')
    dispose()
  })

  it('initialWelcome + running session -> welcome preempted by thinking', () => {
    const { sessions, setListCurrent, setSnapshot } = mockSessions()
    const ctrl = mockController()
    const dispose = attachSessionFollow(sessions, ctrl, {
      now: () => 0,
      tickMs: 999999,
      initialWelcome: true,
    })
    setListCurrent('s1')
    setSnapshot('s1', mockSnapshot({ running: true }))
    const states = ctrl.calls.map(c => c.state)
    // welcome 先，然后 thinking 抢占
    expect(states[0]).toBe('welcome')
    expect(states[states.length - 1]).toBe('thinking')
    dispose()
  })

  it('welcome holds WELCOME_HOLD_MS then tick -> idle', () => {
    vi.useFakeTimers()
    const { sessions } = mockSessions()
    const ctrl = mockController()
    let now = 0
    const dispose = attachSessionFollow(sessions, ctrl, {
      now: () => now,
      tickMs: 1000,
      initialWelcome: true,
    })
    expect(ctrl.calls[0]?.state).toBe('welcome')
    // 推进 3s + tick
    now = 3000
    vi.advanceTimersByTime(1000)
    const states = ctrl.calls.map(c => c.state)
    expect(states[states.length - 1]).toBe('idle')
    dispose()
    vi.useRealTimers()
  })
})

describe('attachSessionFollow - snapshot diff drives state', () => {
  it('running snapshot -> thinking -> replying -> done', () => {
    const { sessions, setListCurrent, setSnapshot } = mockSessions()
    const ctrl = mockController()
    const dispose = attachSessionFollow(sessions, ctrl, { now: () => 0, tickMs: 999999 })
    setListCurrent('s1')
    // running -> thinking
    setSnapshot('s1', mockSnapshot({ running: true }))
    expect(ctrl.calls.at(-1)?.state).toBe('thinking')
    // chunk -> replying
    setSnapshot('s1', mockSnapshot({ running: true, partial: { blocks: [{ kind: 'text', text: 'hi' }] } }))
    expect(ctrl.calls.at(-1)?.state).toBe('replying')
    // running false -> done
    setSnapshot('s1', mockSnapshot({ running: false }))
    expect(ctrl.calls.at(-1)?.state).toBe('done')
    dispose()
  })

  it('error snapshot -> error state', () => {
    const { sessions, setListCurrent, setSnapshot } = mockSessions()
    const ctrl = mockController()
    const dispose = attachSessionFollow(sessions, ctrl, { now: () => 0, tickMs: 999999 })
    setListCurrent('s1')
    setSnapshot('s1', mockSnapshot({ running: true }))
    setSnapshot('s1', mockSnapshot({ running: true, lastAgentError: 'boom' }))
    expect(ctrl.calls.at(-1)?.state).toBe('error')
    dispose()
  })

  it('permission snapshot -> permission state', () => {
    const { sessions, setListCurrent, setSnapshot } = mockSessions()
    const ctrl = mockController()
    const dispose = attachSessionFollow(sessions, ctrl, { now: () => 0, tickMs: 999999 })
    setListCurrent('s1')
    setSnapshot('s1', mockSnapshot({ running: true }))
    setSnapshot('s1', mockSnapshot({ running: true, pending: [{ kind: 'approval' }] }))
    expect(ctrl.calls.at(-1)?.state).toBe('permission')
    dispose()
  })
})
