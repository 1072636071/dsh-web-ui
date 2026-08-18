// character-state: 会话事件 → 角色状态 的纯函数 reducer。
//
// 唯一 seam：reduceCharacter(currentStatus, event, now) → nextStatus。
// 无 DOM 依赖、无副作用、无 setTimeout——所有时序由调用方传入的 now（毫秒）驱动，
// 因此可在 vitest 中独立、确定性地测试。
//
// 状态联合 = DESIGN.md §4 十态逐字一致：
//   idle / thinking / reading / replying / working / error / welcome / done / permission / listening
//   listening 保留类型但运行时不由业务事件触发（仅 text_ended 从 replying 切入）。
//
// 优先级表（高 → 低）：
//   error 5 > working 4 > permission 3 > thinking/replying/done/reading 2 > welcome/idle 1
//   高优先级状态显示时，低优先级事件不能打断。
//
// 时序常量（ms）：reading 阈值 8000、done 驻留 3000~5000、welcome 驻留 3000。

/** 10 个角色状态（DESIGN.md §4 逐字一致）。 */
export type CharacterState =
  | "idle"
  | "thinking"
  | "reading"
  | "replying"
  | "working"
  | "error"
  | "welcome"
  | "done"
  | "permission"
  | "listening"

/**
 * 归一化后的角色事件。调用方把 V1/V2 SDK 原始事件映射为此联合类型后喂给 reducer。
 */
export type CharacterEvent =
  | { type: "session_idle" }
  | { type: "prompt_admitted" }
  | { type: "text_delta" }
  | { type: "text_ended" }
  | { type: "tool_called" }
  | { type: "tool_finished" }
  | { type: "session_error" }
  | { type: "server_connected" }
  | { type: "execution_finished"; pendingTools: boolean }
  | { type: "permission_asked" }
  | { type: "permission_replied" }
  | { type: "tick" }

/** reducer 状态：当前状态 + 时序元数据。 */
export type CharacterStatus = {
  state: CharacterState
  /** thinking 进入时间戳（ms），用于 reading 超时判定。 */
  thinkingSince?: number
  /** done 进入时间戳（ms），用于 3~5s 后切待机判定。 */
  doneSince?: number
  /** done 驻留时长（ms），进入 done 时随机生成 [DONE_HOLD_MIN_MS, DONE_HOLD_MAX_MS]。 */
  doneHoldMs?: number
  /** welcome 进入时间戳（ms），用于播一轮后切待机判定。 */
  welcomeSince?: number
  /** 进入 working 前的状态，tool_finished 回退到此态。 */
  preWorking?: CharacterState
  /** 进入 permission 前的状态，permission_replied 回退到此态。 */
  prePermission?: CharacterState
  /** 已处理的事件序号。 */
  seq: number
}

// 时序常量（ms）。DESIGN.md §4：reading ~8s；done 播 3~5s；welcome 播一轮。
export const READING_THRESHOLD_MS = 8000
export const DONE_HOLD_MIN_MS = 3000
export const DONE_HOLD_MAX_MS = 5000
export const WELCOME_HOLD_MS = 3000

// 状态优先级（高 → 低）：报错 > 工作 > 权限 > 思考/回复/完成/阅读 > 倾听/欢迎/待机。
const PRIORITY: Record<CharacterState, number> = {
  error: 5,
  working: 4,
  permission: 3,
  thinking: 2,
  replying: 2,
  done: 2,
  reading: 2,
  listening: 1,
  welcome: 1,
  idle: 1,
}

/** 初始状态。 */
export function initialCharacterStatus(now: number): CharacterStatus {
  return { state: "idle", seq: 0 }
}

/**
 * 角色状态 reducer：输入 = 当前状态 + 归一化事件 + 当前时间，输出 = 新状态。
 * 纯函数，无副作用。未知事件忽略（不改变状态）。
 */
export function reduceCharacter(state: CharacterStatus, event: CharacterEvent, now: number): CharacterStatus {
  if (event.type === "tick") return applyTick(state, now)
  return applyEvent(state, event, now)
}

// 时间驱动转换：reading 超时切入、done 延时切待机、welcome 播完切待机。
function applyTick(state: CharacterStatus, now: number): CharacterStatus {
  if (state.state === "thinking" && state.thinkingSince !== undefined && now - state.thinkingSince >= READING_THRESHOLD_MS) {
    return { ...state, state: "reading", seq: state.seq + 1 }
  }
  if (state.state === "done" && state.doneSince !== undefined && state.doneHoldMs !== undefined && now - state.doneSince >= state.doneHoldMs) {
    return { ...state, state: "idle", doneSince: undefined, doneHoldMs: undefined, seq: state.seq + 1 }
  }
  if (state.state === "welcome" && state.welcomeSince !== undefined && now - state.welcomeSince >= WELCOME_HOLD_MS) {
    return { ...state, state: "idle", welcomeSince: undefined, seq: state.seq + 1 }
  }
  return state
}

// 业务事件处理。reading 下任何业务事件先切回 thinking。
function applyEvent(state: CharacterStatus, event: CharacterEvent, now: number): CharacterStatus {
  const base: CharacterStatus = state.state === "reading" ? { ...state, state: "thinking" } : state

  switch (event.type) {
    case "session_error":
      return { ...base, state: "error", seq: base.seq + 1 }
    case "tool_called":
      return enterWorking(base)
    case "tool_finished":
      return exitWorking(base)
    case "permission_asked":
      return enterPermission(base)
    case "permission_replied":
      return exitPermission(base)
    case "prompt_admitted":
      return enterThinking(base, now)
    case "text_delta":
      return preempt(base, "replying", 2, new Set(["thinking", "replying"]))
    case "text_ended":
      return preempt(base, "listening", 2, new Set(["replying"]))
    case "server_connected":
      return { ...base, state: "welcome", welcomeSince: now, seq: base.seq + 1 }
    case "execution_finished":
      return handleExecutionFinished(base, event, now)
    case "session_idle":
      // welcome 是启用时的仪式状态，仅由 tick 在驻留 3s 后切待机；
      // 会话空闲翻转不应打断它（高优先级事件仍会抢占）。
      if (base.state === "welcome") return base
      return preempt(base, "idle", 3, new Set())
    default:
      return state
  }
}

// 抢占 + 流转判定：
//   - flowFrom 命中：同级流转（如 thinking → replying），允许切换。
//   - PRIORITY[当前] < gate：抢占更低优先级状态。
//   - 已在目标态时保持不变。
function preempt(state: CharacterStatus, target: CharacterState, gate: number, flowFrom: ReadonlySet<CharacterState>): CharacterStatus {
  if (!flowFrom.has(state.state) && PRIORITY[state.state] >= gate) return state
  if (state.state === target) return state
  return { ...state, state: target, seq: state.seq + 1 }
}

// prompt_admitted：新轮次。从 error 恢复、thinking 重置计时；抢占低优先级；
// 不打断 working/permission；不打断同级 replying/done。
function enterThinking(state: CharacterStatus, now: number): CharacterStatus {
  if (state.state === "thinking" || state.state === "error")
    return { ...state, state: "thinking", thinkingSince: now, seq: state.seq + 1 }
  if (PRIORITY[state.state] < 2) return { ...state, state: "thinking", thinkingSince: now, seq: state.seq + 1 }
  return state
}

// working：记录 preWorking 以便 tool_finished 回退。不抢占 error。
function enterWorking(state: CharacterStatus): CharacterStatus {
  if (state.state === "working") return state
  if (PRIORITY[state.state] >= 5) return state
  return { ...state, state: "working", preWorking: state.state, seq: state.seq + 1 }
}

// 退出 working：仅当前在 working 时回退到 preWorking（默认 replying）。
function exitWorking(state: CharacterStatus): CharacterStatus {
  if (state.state !== "working") return state
  return { ...state, state: state.preWorking ?? "replying", preWorking: undefined, seq: state.seq + 1 }
}

// permission：记录 prePermission 以便 permission_replied 回退。不抢占 error/working。
function enterPermission(state: CharacterStatus): CharacterStatus {
  if (PRIORITY[state.state] >= 3) return state
  return { ...state, state: "permission", prePermission: state.state, seq: state.seq + 1 }
}

// 退出 permission：仅当前在 permission 时回退到 prePermission（默认 idle）。
function exitPermission(state: CharacterStatus): CharacterStatus {
  if (state.state !== "permission") return state
  return { ...state, state: state.prePermission ?? "idle", prePermission: undefined, seq: state.seq + 1 }
}

// done 组合判定：execution_finished 且无 pending 工具 → done（播 3~5s 后切待机）。
// pendingTools=true 时不触发 done。不抢占 error/working/permission。
function handleExecutionFinished(
  state: CharacterStatus,
  event: { pendingTools: boolean },
  now: number,
): CharacterStatus {
  if (event.pendingTools) return state
  if (PRIORITY[state.state] >= 3) return state
  if (state.state === "idle" || state.state === "welcome" || state.state === "listening") return state
  return { ...state, state: "done", doneSince: now, doneHoldMs: DONE_HOLD_MIN_MS + Math.random() * (DONE_HOLD_MAX_MS - DONE_HOLD_MIN_MS), seq: state.seq + 1 }
}
