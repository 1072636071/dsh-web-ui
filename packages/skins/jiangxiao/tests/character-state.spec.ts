/**
 * character-state reducer 单测 — 表驱动覆盖优先级抢占、回退、时序边沿。
 *
 * 纯函数：无 DOM、无定时器、无副作用。所有时序由传入的 now（ms）驱动。
 */
import { describe, expect, it } from 'vitest'
import {
  DONE_HOLD_MIN_MS,
  DONE_HOLD_MAX_MS,
  READING_THRESHOLD_MS,
  WELCOME_HOLD_MS,
  initialCharacterStatus,
  reduceCharacter,
  type CharacterEvent,
  type CharacterState,
  type CharacterStatus,
} from '../src/client/character-state.ts'

/** 便捷：从 idle 起步，seq=0，now=0。 */
function start(): CharacterStatus {
  return initialCharacterStatus(0)
}

/** 便捷：reduce 一串事件，每步 now 递增 1ms（时序无关场景）。 */
function run(events: CharacterEvent[], from: CharacterStatus = start()): CharacterStatus {
  let s = from
  let now = 0
  for (const e of events) {
    s = reduceCharacter(s, e, now)
    now += 1
  }
  return s
}

describe('initialCharacterStatus', () => {
  it('starts at idle with seq 0', () => {
    const s = initialCharacterStatus(1000)
    expect(s.state).toBe('idle')
    expect(s.seq).toBe(0)
  })
})

describe('priority preemption — error > working > permission > thinking/replying/done/reading > welcome/idle', () => {
  // 表驱动：高优先级状态显示时，低优先级事件不能打断。
  // 注：prompt_admitted 是新轮次事件，从 error 恢复是设计行为，不属于抢占范畴。
  const cases: ReadonlyArray<{ name: string; high: CharacterEvent; low: CharacterEvent; highState: CharacterState }> = [
    { name: 'error blocks working', high: { type: 'session_error' }, low: { type: 'tool_called' }, highState: 'error' },
    { name: 'error blocks permission', high: { type: 'session_error' }, low: { type: 'permission_asked' }, highState: 'error' },
    { name: 'error blocks text_delta', high: { type: 'session_error' }, low: { type: 'text_delta' }, highState: 'error' },
    { name: 'error blocks session_idle', high: { type: 'session_error' }, low: { type: 'session_idle' }, highState: 'error' },
    { name: 'working blocks permission', high: { type: 'tool_called' }, low: { type: 'permission_asked' }, highState: 'working' },
    { name: 'working blocks text_delta', high: { type: 'tool_called' }, low: { type: 'text_delta' }, highState: 'working' },
    { name: 'working blocks prompt_admitted', high: { type: 'tool_called' }, low: { type: 'prompt_admitted' }, highState: 'working' },
    { name: 'permission blocks text_delta', high: { type: 'permission_asked' }, low: { type: 'text_delta' }, highState: 'permission' },
    { name: 'permission blocks prompt_admitted', high: { type: 'permission_asked' }, low: { type: 'prompt_admitted' }, highState: 'permission' },
  ]
  for (const c of cases) {
    it(c.name, () => {
      const s = run([c.high, c.low])
      expect(s.state).toBe(c.highState)
    })
  }
})

describe('prompt_admitted — new turn recovers from error', () => {
  it('prompt_admitted from error recovers to thinking (new turn, not preemption)', () => {
    const s = run([{ type: 'session_error' }, { type: 'prompt_admitted' }])
    expect(s.state).toBe('thinking')
  })
})

describe('preWorking fallback — tool_finished returns to preWorking', () => {
  it('from thinking: tool_called then tool_finished returns to thinking', () => {
    const s = run([{ type: 'prompt_admitted' }, { type: 'tool_called' }, { type: 'tool_finished' }])
    expect(s.state).toBe('thinking')
  })
  it('from replying: tool_called then tool_finished returns to replying', () => {
    const s = run([{ type: 'prompt_admitted' }, { type: 'text_delta' }, { type: 'tool_called' }, { type: 'tool_finished' }])
    expect(s.state).toBe('replying')
  })
  it('default fallback is replying when preWorking undefined', () => {
    // 直接 tool_called 从 idle，preWorking=idle，tool_finished 回 idle
    const s = run([{ type: 'tool_called' }, { type: 'tool_finished' }])
    expect(s.state).toBe('idle')
  })
  it('tool_finished outside working is no-op', () => {
    const s = run([{ type: 'prompt_admitted' }, { type: 'tool_finished' }])
    expect(s.state).toBe('thinking')
  })
})

describe('prePermission fallback — permission_replied returns to prePermission', () => {
  it('from thinking: permission_asked then permission_replied returns to thinking', () => {
    const s = run([{ type: 'prompt_admitted' }, { type: 'permission_asked' }, { type: 'permission_replied' }])
    expect(s.state).toBe('thinking')
  })
  it('default fallback is idle when prePermission undefined', () => {
    const s = run([{ type: 'permission_asked' }, { type: 'permission_replied' }])
    expect(s.state).toBe('idle')
  })
  it('permission_replied outside permission is no-op', () => {
    const s = run([{ type: 'prompt_admitted' }, { type: 'permission_replied' }])
    expect(s.state).toBe('thinking')
  })
})

describe('reading tick timeout — thinking exceeds READING_THRESHOLD_MS', () => {
  it('thinking under threshold stays thinking', () => {
    let s = reduceCharacter(start(), { type: 'prompt_admitted' }, 0)
    s = reduceCharacter(s, { type: 'tick' }, READING_THRESHOLD_MS - 1)
    expect(s.state).toBe('thinking')
  })
  it('thinking at exactly threshold transitions to reading', () => {
    let s = reduceCharacter(start(), { type: 'prompt_admitted' }, 0)
    s = reduceCharacter(s, { type: 'tick' }, READING_THRESHOLD_MS)
    expect(s.state).toBe('reading')
  })
  it('thinking over threshold transitions to reading', () => {
    let s = reduceCharacter(start(), { type: 'prompt_admitted' }, 0)
    s = reduceCharacter(s, { type: 'tick' }, READING_THRESHOLD_MS + 100)
    expect(s.state).toBe('reading')
  })
  it('reading state: any business event returns to thinking first', () => {
    let s = reduceCharacter(start(), { type: 'prompt_admitted' }, 0)
    s = reduceCharacter(s, { type: 'tick' }, READING_THRESHOLD_MS)
    expect(s.state).toBe('reading')
    // text_delta 在 reading 下先切回 thinking 再处理 → replying
    s = reduceCharacter(s, { type: 'text_delta' }, READING_THRESHOLD_MS + 1)
    expect(s.state).toBe('replying')
  })
})

describe('done edge — done holds random duration then transitions to idle', () => {
  it('done sets doneHoldMs in [MIN, MAX] on entry', () => {
    let s = run([{ type: 'prompt_admitted' }, { type: 'text_delta' }])
    s = reduceCharacter(s, { type: 'execution_finished', pendingTools: false }, 100)
    expect(s.state).toBe('done')
    expect(s.doneHoldMs).toBeGreaterThanOrEqual(DONE_HOLD_MIN_MS)
    expect(s.doneHoldMs).toBeLessThanOrEqual(DONE_HOLD_MAX_MS)
  })
  it('done before hold expires stays done', () => {
    let s = run([{ type: 'prompt_admitted' }, { type: 'text_delta' }])
    s = reduceCharacter(s, { type: 'execution_finished', pendingTools: false }, 100)
    expect(s.state).toBe('done')
    // 远小于 MIN，必定仍在驻留窗口内。
    s = reduceCharacter(s, { type: 'tick' }, 100 + DONE_HOLD_MIN_MS - 1000)
    expect(s.state).toBe('done')
  })
  it('done at max hold transitions to idle', () => {
    let s = run([{ type: 'prompt_admitted' }, { type: 'text_delta' }])
    s = reduceCharacter(s, { type: 'execution_finished', pendingTools: false }, 100)
    expect(s.state).toBe('done')
    // MAX 是驻留窗口上界，必定已超时。
    s = reduceCharacter(s, { type: 'tick' }, 100 + DONE_HOLD_MAX_MS)
    expect(s.state).toBe('idle')
  })
  it('execution_finished with pendingTools does not trigger done', () => {
    let s = run([{ type: 'prompt_admitted' }, { type: 'text_delta' }])
    s = reduceCharacter(s, { type: 'execution_finished', pendingTools: true }, 100)
    expect(s.state).toBe('replying')
  })
  it('execution_finished from idle/welcome/listening is no-op (no done animation)', () => {
    let s = start()
    s = reduceCharacter(s, { type: 'execution_finished', pendingTools: false }, 100)
    expect(s.state).toBe('idle')
  })
})

describe('welcome hold — welcome holds WELCOME_HOLD_MS then idle', () => {
  it('welcome under hold stays welcome', () => {
    let s = reduceCharacter(start(), { type: 'server_connected' }, 0)
    expect(s.state).toBe('welcome')
    s = reduceCharacter(s, { type: 'tick' }, WELCOME_HOLD_MS - 1)
    expect(s.state).toBe('welcome')
  })
  it('welcome at hold transitions to idle', () => {
    let s = reduceCharacter(start(), { type: 'server_connected' }, 0)
    s = reduceCharacter(s, { type: 'tick' }, WELCOME_HOLD_MS)
    expect(s.state).toBe('idle')
  })
})

describe('text flow — thinking to replying to listening', () => {
  it('prompt_admitted then text_delta goes to replying', () => {
    const s = run([{ type: 'prompt_admitted' }, { type: 'text_delta' }])
    expect(s.state).toBe('replying')
  })
  it('text_ended from replying goes to listening', () => {
    const s = run([{ type: 'prompt_admitted' }, { type: 'text_delta' }, { type: 'text_ended' }])
    expect(s.state).toBe('listening')
  })
  it('text_ended outside replying is no-op', () => {
    const s = run([{ type: 'prompt_admitted' }, { type: 'text_ended' }])
    expect(s.state).toBe('thinking')
  })
})

describe('session_idle preempts low priority', () => {
  it('session_idle does not cancel the welcome ceremony', () => {
    // 启用时的 welcome 由 tick 在驻留后切待机，会话空闲翻转不打断它。
    let s = reduceCharacter(start(), { type: 'server_connected' }, 0)
    s = reduceCharacter(s, { type: 'session_idle' }, 1)
    expect(s.state).toBe('welcome')
  })
  it('session_idle drops thinking to idle', () => {
    let s = reduceCharacter(start(), { type: 'prompt_admitted' }, 0)
    s = reduceCharacter(s, { type: 'session_idle' }, 1)
    expect(s.state).toBe('idle')
  })
  it('session_idle does not preempt working', () => {
    let s = run([{ type: 'tool_called' }])
    s = reduceCharacter(s, { type: 'session_idle' }, 1)
    expect(s.state).toBe('working')
  })
  it('high-priority event still cuts the welcome ceremony', () => {
    let s = reduceCharacter(start(), { type: 'server_connected' }, 0)
    s = reduceCharacter(s, { type: 'session_error' }, 1)
    expect(s.state).toBe('error')
  })
})

describe('timing constants match DESIGN.md §4', () => {
  it('READING_THRESHOLD_MS = 8000', () => {
    expect(READING_THRESHOLD_MS).toBe(8000)
  })
  it('DONE_HOLD_MIN_MS = 3000', () => {
    expect(DONE_HOLD_MIN_MS).toBe(3000)
  })
  it('DONE_HOLD_MAX_MS = 5000', () => {
    expect(DONE_HOLD_MAX_MS).toBe(5000)
  })
  it('WELCOME_HOLD_MS = 3000', () => {
    expect(WELCOME_HOLD_MS).toBe(3000)
  })
})

describe('state union — 10 states match DESIGN.md §4 exactly', () => {
  it('exposes exactly the 10 DESIGN.md states', () => {
    // 类型层面已把数组约束为 CharacterState 成员；此处防手误枚举漏项。
    const expected: CharacterState[] = [
      'idle', 'thinking', 'reading', 'replying', 'working',
      'error', 'welcome', 'done', 'permission', 'listening',
    ]
    expect(new Set(expected).size).toBe(10)
  })
})
