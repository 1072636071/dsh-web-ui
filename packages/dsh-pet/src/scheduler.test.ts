import { describe, expect, it } from 'vitest'
import type { JiangxiaoState } from './registry.ts'
import type { PetAnimation } from './state.ts'
import {
  PET_TO_JIANGXIAO,
  petToJiangxiao,
  resolveTransition,
  type TransitionTable,
} from './scheduler.ts'

/**
 * Build a transition table from a list of [from, to, webp, durationMs] rows.
 * Keys use the ASCII `->` separator, matching the scheduler and the pack
 * script in work item 06.
 */
function table(rows: ReadonlyArray<[JiangxiaoState, JiangxiaoState, string, number]>): TransitionTable {
  const out: TransitionTable = {}
  for (const [from, to, webp, durationMs] of rows) {
    out[from + '->' + to] = { webp, durationMs }
  }
  return out
}

describe('resolveTransition', () => {
  it('returns one forward segment when a direct edge exists', () => {
    const transitions = table([
      ['idle', 'thinking', 'transitions/idle-to-thinking.webp', 300],
    ])
    const result = resolveTransition('idle', 'thinking', transitions, 'k1')
    expect(result.segments).toEqual([
      { webp: 'transitions/idle-to-thinking.webp', durationMs: 300 },
    ])
    expect(result.final).toBe('thinking')
    expect(result.key).toBe('k1')
  })

  it('routes through idle when no direct edge exists (2 segments, first reversed)', () => {
    // thinking -> working has no direct clip; the hub route is
    // thinking->idle (reversed) + idle->working (forward).
    const transitions = table([
      ['thinking', 'idle', 'transitions/thinking-to-idle.webp', 250],
      ['idle', 'working', 'transitions/idle-to-working.webp', 320],
    ])
    const result = resolveTransition('thinking', 'working', transitions, 'k2')
    expect(result.segments).toEqual([
      { webp: 'transitions/thinking-to-idle.webp', durationMs: 250, reversed: true },
      { webp: 'transitions/idle-to-working.webp', durationMs: 320 },
    ])
    expect(result.final).toBe('working')
    expect(result.key).toBe('k2')
  })

  it('prefers a direct edge over the hub route when both exist', () => {
    const transitions = table([
      ['thinking', 'working', 'transitions/thinking-to-working.webp', 200],
      ['thinking', 'idle', 'transitions/thinking-to-idle.webp', 250],
      ['idle', 'working', 'transitions/idle-to-working.webp', 320],
    ])
    const result = resolveTransition('thinking', 'working', transitions, 'k3')
    expect(result.segments).toHaveLength(1)
    expect(result.segments[0]).toEqual({
      webp: 'transitions/thinking-to-working.webp',
      durationMs: 200,
    })
  })

  it('falls back to empty segments when no material exists on either path', () => {
    // No direct edge, no hub legs: crossfade fallback signal.
    const result = resolveTransition('thinking', 'working', {}, 'k4')
    expect(result.segments).toEqual([])
    expect(result.final).toBe('working')
    expect(result.key).toBe('k4')
  })

  it('falls back to empty segments when only one hub leg exists', () => {
    // A partial hub route is unusable; the scheduler must not emit a single
    // reversed leg and leave the pet stranded mid-transition.
    const transitions = table([
      ['thinking', 'idle', 'transitions/thinking-to-idle.webp', 250],
    ])
    const result = resolveTransition('thinking', 'working', transitions, 'k5')
    expect(result.segments).toEqual([])
  })

  it('returns empty segments when from === to (no self-transition)', () => {
    const transitions = table([
      ['idle', 'thinking', 'transitions/idle-to-thinking.webp', 300],
    ])
    const result = resolveTransition('thinking', 'thinking', transitions, 'k6')
    expect(result.segments).toEqual([])
    expect(result.final).toBe('thinking')
  })

  it('routes through idle for every non-idle pair when only hub legs exist', () => {
    // A hub-only table: every from->idle and idle->to leg is present, no
    // direct edges. Every distinct pair should resolve to 2 segments.
    const states: readonly JiangxiaoState[] = [
      'idle', 'thinking', 'reading', 'replying', 'working',
      'error', 'welcome', 'done', 'permission', 'listening',
    ]
    const rows: Array<[JiangxiaoState, JiangxiaoState, string, number]> = []
    for (const s of states) {
      if (s === 'idle') continue
      rows.push(['idle', s, 'idle->' + s + '.webp', 200])
      rows.push([s, 'idle', s + '->idle.webp', 200])
    }
    const transitions = table(rows)
    // Pick two non-idle, non-equal states with no direct edge.
    const result = resolveTransition('error', 'done', transitions, 'k7')
    expect(result.segments).toHaveLength(2)
    expect(result.segments[0].reversed).toBe(true)
    expect(result.segments[1].reversed).toBeUndefined()
    expect(result.final).toBe('done')
  })

  it('always sets final to the target state, regardless of path', () => {
    const transitions = table([
      ['idle', 'thinking', 't.webp', 100],
    ])
    expect(resolveTransition('idle', 'thinking', transitions, 'a').final).toBe('thinking')
    expect(resolveTransition('thinking', 'working', transitions, 'b').final).toBe('working')
    expect(resolveTransition('error', 'error', transitions, 'c').final).toBe('error')
  })
})

describe('resolveTransition key invalidation', () => {
  it('uses keySeed verbatim when provided (deterministic, pure)', () => {
    const transitions = table([['idle', 'thinking', 't.webp', 100]])
    const a = resolveTransition('idle', 'thinking', transitions, 'same-key')
    const b = resolveTransition('idle', 'thinking', transitions, 'same-key')
    expect(a.key).toBe('same-key')
    expect(b.key).toBe('same-key')
  })

  it('generates distinct keys on successive calls without keySeed', () => {
    const transitions = table([['idle', 'thinking', 't.webp', 100]])
    const a = resolveTransition('idle', 'thinking', transitions)
    const b = resolveTransition('idle', 'thinking', transitions)
    const c = resolveTransition('idle', 'thinking', transitions)
    expect(a.key).not.toBe(b.key)
    expect(b.key).not.toBe(c.key)
    expect(a.key).not.toBe(c.key)
    // Default keys carry the from->to prefix for debuggability.
    expect(a.key.startsWith('idle->thinking#')).toBe(true)
  })

  it('lets the renderer distinguish a stale transition from a fresh one', () => {
    // Simulate two rapid target switches: the renderer keeps the in-flight
    // key; when a newer resolution arrives with a different key, the old
    // play is invalidated. The scheduler only provides distinct keys; the
    // comparison is the renderer's job (work item 04).
    const transitions = table([['idle', 'thinking', 't.webp', 100]])
    const first = resolveTransition('idle', 'thinking', transitions, 'play-1')
    const second = resolveTransition('idle', 'working', transitions, 'play-2')
    expect(first.key).not.toBe(second.key)
    // A replay with the same keySeed reproduces the same key (idempotent
    // invalidation check).
    const replay = resolveTransition('idle', 'thinking', transitions, 'play-1')
    expect(replay.key).toBe(first.key)
  })
})

describe('petToJiangxiao', () => {
  it('maps every PetAnimation track onto its Jiangxiao cyclic state (D8)', () => {
    const expected: Readonly<Record<PetAnimation, JiangxiaoState>> = {
      idle: 'idle',
      running: 'thinking',
      'running-right': 'working',
      review: 'replying',
      waiting: 'listening',
      jumping: 'done',
      failed: 'error',
      'running-left': 'idle',
      waving: 'welcome',
    }
    const animations: readonly PetAnimation[] = [
      'idle', 'running-right', 'running-left', 'waving', 'jumping',
      'failed', 'waiting', 'running', 'review',
    ]
    for (const anim of animations) {
      expect(petToJiangxiao(anim)).toBe(expected[anim])
    }
  })

  it('covers all 9 PetAnimation tracks (no silent fallthrough)', () => {
    const animations: readonly PetAnimation[] = [
      'idle', 'running-right', 'running-left', 'waving', 'jumping',
      'failed', 'waiting', 'running', 'review',
    ]
    const seen = new Set(animations.map(petToJiangxiao))
    // The image is 8 distinct states (running-left collapses into idle).
    expect(seen.size).toBe(8)
    expect(seen.has('idle')).toBe(true)
    expect(seen.has('thinking')).toBe(true)
    expect(seen.has('working')).toBe(true)
    expect(seen.has('replying')).toBe(true)
    expect(seen.has('listening')).toBe(true)
    expect(seen.has('done')).toBe(true)
    expect(seen.has('error')).toBe(true)
    expect(seen.has('welcome')).toBe(true)
  })

  it('PET_TO_JIANGXIAO is a readonly table matching the function', () => {
    const animations: readonly PetAnimation[] = [
      'idle', 'running-right', 'running-left', 'waving', 'jumping',
      'failed', 'waiting', 'running', 'review',
    ]
    for (const anim of animations) {
      expect(PET_TO_JIANGXIAO[anim]).toBe(petToJiangxiao(anim))
    }
  })
})

describe('resolveTransition D13 — only 10 cyclic states are indexed', () => {
  it('never queries keys outside the JiangxiaoState set', () => {
    // The scheduler builds keys purely from its JiangxiaoState inputs and the
    // hub (idle). Micro-expression states (cheek-rest/chin-rest/nod-smile/
    // shush/shy-smile/frown-wave) are not in JiangxiaoState and can never
    // appear in a queried key. reading/permission are in the type but the pet
    // mapping never emits them, so they only appear if a caller asks for them
    // directly — at which point the lookup is still between two JiangxiaoState
    // values, never a micro-expression state.
    const transitions = table([
      ['reading', 'idle', 'reading->idle.webp', 200],
      ['idle', 'thinking', 'idle->thinking.webp', 200],
    ])
    // reading is a JiangxiaoState; the scheduler can route through it, but
    // only because the caller asked. The key space stays within the 10
    // cyclic states.
    const result = resolveTransition('reading', 'thinking', transitions, 'k')
    expect(result.segments).toHaveLength(2)
    expect(result.segments[0]).toEqual({
      webp: 'reading->idle.webp',
      durationMs: 200,
      reversed: true,
    })
    expect(result.segments[1]).toEqual({
      webp: 'idle->thinking.webp',
      durationMs: 200,
    })
  })

  it('the pet mapping never produces reading or permission', () => {
    // D13: reading/permission are pet-unreachable. The mapping function is
    // the only path from PetAnimation to JiangxiaoState, so if its image
    // excludes them, the scheduler can never be fed them by the pet loop.
    const animations: readonly PetAnimation[] = [
      'idle', 'running-right', 'running-left', 'waving', 'jumping',
      'failed', 'waiting', 'running', 'review',
    ]
    for (const anim of animations) {
      const state = petToJiangxiao(anim)
      expect(state).not.toBe('reading')
      expect(state).not.toBe('permission')
    }
  })
})