// character-follow: ConversationSnapshot 差分 -> 归一化事件 -> reducer -> 浮层状态。
//
// 两层 seam：
//   1. diffEvents(prev, curr) -> CharacterEvent[]：纯函数，快照差分到归一化事件，可单测。
//   2. attachSessionFollow(sessions, controller, opts) -> dispose：订阅链，跟随 current 会话。
//
// 映射判定式（优先级从高到低）：
//   error > permission > working > replying > thinking > done(边沿) > idle
//   reading 由 reducer 的 tick 推导（thinking 持续 >=8s 无 chunk）。
//   listening 不触发（无 DSH 信号）。
//
// 只用 ConversationSnapshot 核心字段（running/partial/runningCalls/pending/
// promptError/lastAgentError/openError），不依赖投影 key，规避宿主版本漂移。

import type { CharacterEvent, CharacterState, CharacterStatus } from './character-state.ts'
import { initialCharacterStatus, reduceCharacter } from './character-state.ts'
import type { CharacterOverlay } from './character-overlay.ts'
// Type-only: SDK 类型（浏览器 bundle 纯度门）。
import type {
  ConversationSnapshot,
  ISessions,
  PartialAssistant,
  SessionId,
} from '@deepseek-ai/dsh-client-runtime/client'

/** pending interaction kind 联合（approval/question，见 SDK PendingKind）。 */
export type PendingKind = 'approval' | 'question'

/** 快照核心字段（差分只关心这些，与 SDK 类型解耦，可单测）。 */
export interface SnapshotCore {
  /** running 位。 */
  running: boolean
  /** partial 是否含可见 chunk（text/reasoning block 非空）。 */
  hasVisibleChunk: boolean
  /** runningCalls 数量。 */
  runningCallsCount: number
  /** pending interaction kind 集合。 */
  pendingKinds: ReadonlySet<PendingKind>
  /** 是否有 error（promptError/lastAgentError/openError 任一非空）。 */
  hasError: boolean
}

/** 空核心快照（无会话 / idle 兜底）。 */
export const EMPTY_CORE: SnapshotCore = {
  running: false,
  hasVisibleChunk: false,
  runningCallsCount: 0,
  pendingKinds: new Set<PendingKind>(),
  hasError: false,
}

/** 判定 partial 是否含可见 chunk（text/reasoning block 非空）。 */
export function hasVisiblePartialChunk(partial: PartialAssistant): boolean {
  for (const block of partial.blocks) {
    if (block.kind === 'text' && block.text.length > 0) return true
    if (block.kind === 'reasoning' && block.text.length > 0) return true
  }
  return false
}

/** 从 ConversationSnapshot 提取核心字段（差分输入）。 */
export function extractCore(snapshot: ConversationSnapshot): SnapshotCore {
  const pendingKinds = new Set<PendingKind>()
  for (const p of snapshot.pending) {
    if (p.kind === 'approval' || p.kind === 'question') pendingKinds.add(p.kind)
  }
  return {
    running: snapshot.running,
    hasVisibleChunk: snapshot.partial !== null && hasVisiblePartialChunk(snapshot.partial),
    runningCallsCount: snapshot.runningCalls.length,
    pendingKinds,
    hasError:
      snapshot.promptError !== null ||
      snapshot.lastAgentError !== null ||
      snapshot.openError !== null,
  }
}

/** 判定核心快照是否为 idle（兜底）。 */
function isIdleCore(c: SnapshotCore): boolean {
  return (
    !c.running &&
    !c.hasVisibleChunk &&
    c.runningCallsCount === 0 &&
    c.pendingKinds.size === 0 &&
    !c.hasError
  )
}

/** 判定核心快照是否有 pending。 */
function hasPendingCore(c: SnapshotCore): boolean {
  return c.pendingKinds.size > 0
}

/**
 * 快照差分 -> 归一化事件序列。
 *
 * 纯函数：无 DOM、无副作用、无 SDK 依赖。输入 prev/curr 核心快照，输出
 * reduceCharacter 接受的归一化事件数组（按优先级排序，reducer 顺序处理）。
 *
 * 映射判定式（优先级从高到低）：
 *   - error 出现 -> [session_error]（立即返回，最高优先级）
 *   - permission 退出 -> [permission_replied]
 *   - working 退出 -> [tool_finished]
 *   - permission 进入 -> [permission_asked]
 *   - working 进入 -> [tool_called]
 *   - replying（可见 chunk 出现）-> [text_delta]
 *   - thinking（running && !chunk，新轮次）-> [prompt_admitted]
 *   - done 边沿（running true->false，无 error/pending）-> [execution_finished]
 *   - idle 兜底 -> [session_idle]
 *
 * @param prev - 上一次核心快照（null 表示初次/切换会话）。
 * @param curr - 当前核心快照。
 * @returns 归一化事件数组（可能为空）。
 */
export function diffEvents(prev: SnapshotCore | null, curr: SnapshotCore): CharacterEvent[] {
  const events: CharacterEvent[] = []

  const currError = curr.hasError
  const prevError = prev !== null && prev.hasError

  // 1. error 出现 -> 最高优先级，立即返回。
  if (currError && !prevError) return [{ type: 'session_error' }]

  // 退出事件先发（让 reducer 先回退到 preWorking/prePermission）。
  // 2. permission 退出
  if (prev !== null && hasPendingCore(prev) && !hasPendingCore(curr)) {
    events.push({ type: 'permission_replied' })
  }
  // 3. working 退出
  if (prev !== null && prev.runningCallsCount > 0 && curr.runningCallsCount === 0) {
    events.push({ type: 'tool_finished' })
  }

  // 进入事件后发（让 reducer 按优先级抢占）。
  // 4. permission 进入
  if (hasPendingCore(curr) && (prev === null || !hasPendingCore(prev))) {
    events.push({ type: 'permission_asked' })
  }
  // 5. working 进入
  if (curr.runningCallsCount > 0 && (prev === null || prev.runningCallsCount === 0)) {
    events.push({ type: 'tool_called' })
  }
  // 6. replying（可见 chunk 出现）
  if (curr.hasVisibleChunk && (prev === null || !prev.hasVisibleChunk)) {
    events.push({ type: 'text_delta' })
  }
  // 7. thinking（running && !chunk，新轮次）
  if (curr.running && !curr.hasVisibleChunk && (prev === null || !prev.running || prev.hasVisibleChunk)) {
    events.push({ type: 'prompt_admitted' })
  }

  // 8. done 边沿（running true->false，无 error/pending）
  if (prev !== null && prev.running && !curr.running && !currError && !hasPendingCore(curr)) {
    events.push({ type: 'execution_finished', pendingTools: curr.runningCallsCount > 0 })
  }

  // 9. idle 兜底（仅在无其他事件且从非 idle 变化时）
  if (events.length === 0 && isIdleCore(curr) && (prev === null || !isIdleCore(prev))) {
    events.push({ type: 'session_idle' })
  }

  return events
}

/** attachSessionFollow 选项。 */
export interface AttachSessionFollowOptions {
  /** 当前时间函数（默认 Date.now，测试可注入）。 */
  now?: () => number
  /** tick 间隔（ms，默认 1000）。 */
  tickMs?: number
  /** 初始触发 welcome 态（素材就绪 + 首次启用时传 true）。 */
  initialWelcome?: boolean
}

/**
 * 附加会话状态跟随：订阅 sessions.list 跟踪 current，对 current 会话
 * binding(id).session.subscribe 读 ConversationSnapshot，差分归一化为事件，
 * 喂给 reduceCharacter，状态变化时调 controller.setState。
 *
 * 订阅在返回的 dispose 函数中全部释放，无泄漏。
 *
 * @param sessions - ctx.sessions 服务。
 * @param controller - 浮层控制器。
 * @param opts - 选项（now/tickMs/initialWelcome）。
 * @returns dispose 函数，释放所有订阅。
 */
export function attachSessionFollow(
  sessions: ISessions,
  controller: CharacterOverlay,
  opts?: AttachSessionFollowOptions,
): () => void {
  const now = opts?.now ?? (() => Date.now())
  const tickMs = opts?.tickMs ?? 1000

  // reducer 状态：初始 welcome 或 idle。
  let status: CharacterStatus
  let lastState: CharacterState
  if (opts?.initialWelcome === true) {
    const t = now()
    status = { state: 'welcome', welcomeSince: t, seq: 1 }
    lastState = 'welcome'
    controller.setState('welcome')
  } else {
    status = initialCharacterStatus(now())
    lastState = 'idle'
  }

  let prevCore: SnapshotCore | null = null
  let lastCurrent: SessionId | undefined = undefined
  let sessionUnsub: (() => void) | undefined
  const disposers: Array<() => void> = []

  /** 处理一次快照：差分 -> 事件 -> reducer -> setState。 */
  function processSnapshot(snapshot: ConversationSnapshot): void {
    const currCore = extractCore(snapshot)
    const events = diffEvents(prevCore, currCore)
    for (const event of events) {
      status = reduceCharacter(status, event, now())
    }
    if (status.state !== lastState) {
      controller.setState(status.state)
      lastState = status.state
    }
    prevCore = currCore
  }

  /** 附加到 current 会话（释放旧订阅）。 */
  function attachCurrent(id: SessionId | undefined): void {
    sessionUnsub?.()
    sessionUnsub = undefined
    prevCore = null
    if (id === undefined) {
      // 无会话：若不在 welcome 驻留，回 idle。
      if (status.state !== 'welcome') {
        status = initialCharacterStatus(now())
        if (lastState !== 'idle') {
          controller.setState('idle')
          lastState = 'idle'
        }
      }
      return
    }
    const binding = sessions.binding(id)
    if (binding === undefined) return
    sessionUnsub = binding.session.subscribe(() => {
      processSnapshot(binding.session.getSnapshot())
    })
    // 立即处理一次快照。
    processSnapshot(binding.session.getSnapshot())
  }

  // 跟踪 current 会话变化（仅在 current 变化时重新 attach）。
  const listUnsub = sessions.list.subscribe(() => {
    const list = sessions.list.getSnapshot()
    if (list.current !== lastCurrent) {
      lastCurrent = list.current
      attachCurrent(list.current)
    }
  })
  disposers.push(listUnsub)

  // 初始附加。
  const initialList = sessions.list.getSnapshot()
  lastCurrent = initialList.current
  attachCurrent(initialList.current)

  // tick：驱动 reading 超时和 done/welcome 驻留。
  let tickTimer: ReturnType<typeof setInterval> | undefined
  if (typeof setInterval === 'function') {
    tickTimer = setInterval(() => {
      const prevState = status.state
      status = reduceCharacter(status, { type: 'tick' }, now())
      if (status.state !== prevState && status.state !== lastState) {
        controller.setState(status.state)
        lastState = status.state
      }
    }, tickMs)
  }

  return () => {
    sessionUnsub?.()
    sessionUnsub = undefined
    for (const d of disposers.splice(0)) d()
    if (tickTimer !== undefined && typeof clearInterval === 'function') {
      clearInterval(tickTimer)
      tickTimer = undefined
    }
  }
}
