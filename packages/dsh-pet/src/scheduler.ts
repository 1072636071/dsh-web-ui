/**
 * Transition scheduler — pure hub-routing lookup for the animated-webp pet.
 *
 * Given (from, to, transitions) the scheduler decides which webp clips to play
 * when the pet switches between two JiangxiaoState cyclic states, plus a
 * single "play key" the renderer uses to invalidate a stale transition when a
 * newer target arrives mid-play. No DOM, no clock, no side effects beyond a
 * module-level counter that only advances when the caller omits keySeed —
 * pass an explicit keySeed for a fully deterministic, replayable result.
 *
 * Hub routing (PRD D7, ADR-013 section 2): idle is the hub. A direct edge
 * `from->to` plays one clip forward. Without a direct edge, the scheduler
 * routes through idle: `from->idle` (reversed) then `idle->to` (forward),
 * yielding two segments. When neither path has material, segments is empty
 * and the renderer falls back to a crossfade. The scheduler only ever looks
 * up keys between JiangxiaoState values (the 10 cyclic states); micro-expression
 * states (cheek-rest/chin-rest/nod-smile/shush/shy-smile/frown-wave) are not
 * in the type and are never queried, satisfying D13 — those transition files
 * ship in the package for material completeness but are never indexed here.
 *
 * Transition keys use the ASCII `->` separator (consistent with the pack
 * script in work item 06): `${from}->${to}`.
 * @module @linxin666/dsh-pet/scheduler
 */

import type { JiangxiaoState } from './registry.ts'
import type { PetAnimation } from './state.ts'

/**
 * One playable clip in a resolved transition sequence. `reversed` signals
 * that the renderer should play the webp in reverse (the hub route reuses
 * the `from->idle` clip played backward to depict `idle->from` motion).
 */
export interface TransitionSegment {
  /** Webp file path (or browser URL) of the clip, as found in the table. */
  webp: string
  /** Play duration in ms (positive finite, as validated by the registry). */
  durationMs: number
  /** True when the clip should be played in reverse. */
  reversed?: boolean
}

/** The full result of one transition resolution. */
export interface ResolvedTransition {
  /** Ordered clips to play; empty means "no material, crossfade fallback". */
  segments: TransitionSegment[]
  /** The terminal cyclic state the pet settles into after the clips. */
  final: JiangxiaoState
  /**
   * Unique play key for this resolution. The renderer compares it against
   * the in-flight key to invalidate a stale transition when a newer target
   * arrives. Two resolutions with different keys are always distinct plays.
   */
  key: string
}

/**
 * Transition table shape: key `${from}->${to}` → clip descriptor. This is
 * the runtime view the scheduler consumes (host-side paths or browser URLs
 * both fit; the registry hands the browser-side view to the renderer).
 */
export type TransitionTable = Record<string, { webp: string; durationMs: number }>

/** The hub state every indirect route transits through. */
const HUB: JiangxiaoState = 'idle'

/**
 * Module-level counter for default key generation. Only advances when the
 * caller omits keySeed, so explicit-keySeed calls are fully pure. This is
 * the single tolerated side effect; tests pass keySeed for determinism.
 */
let keyCounter = 0

/**
 * Build a transition key from two states. Centralized so the separator
 * convention (ASCII `->`) lives in one place.
 */
function transitionKey(from: JiangxiaoState, to: JiangxiaoState): string {
  return from + '->' + to
}

/**
 * Resolve the clip sequence to play when switching from one cyclic state to
 * another, using hub routing through idle.
 *
 * Resolution order:
 *   1. `from === to` → no transition needed; empty segments.
 *   2. Direct edge `from->to` exists → one forward clip.
 *   3. Hub route `from->idle` (reversed) + `idle->to` (forward) both exist →
 *      two clips.
 *   4. Neither path has material → empty segments (crossfade fallback signal
 *      for the renderer).
 *
 * The `key` is `keySeed` when provided, otherwise `${from}->${to}#${n}` where
 * `n` is a monotonically advancing module counter. Pass keySeed for
 * deterministic, replayable results in tests.
 */
export function resolveTransition(
  from: JiangxiaoState,
  to: JiangxiaoState,
  transitions: TransitionTable,
  keySeed?: string,
): ResolvedTransition {
  const key = keySeed !== undefined ? keySeed : transitionKey(from, to) + '#' + (++keyCounter)

  // Same state: nothing to play. Avoids a spurious idle round-trip when the
  // state machine re-emits the current state.
  if (from === to) {
    return { segments: [], final: to, key }
  }

  // 1. Direct edge: one forward clip.
  const direct = transitions[transitionKey(from, to)]
  if (direct !== undefined) {
    return {
      segments: [{ webp: direct.webp, durationMs: direct.durationMs }],
      final: to,
      key,
    }
  }

  // 2. Hub route through idle: from->idle (reversed) + idle->to (forward).
  //    Both legs must have material; a partial route is useless and falls
  //    through to the crossfade fallback.
  const fromToHub = transitions[transitionKey(from, HUB)]
  const hubToTo = transitions[transitionKey(HUB, to)]
  if (fromToHub !== undefined && hubToTo !== undefined) {
    return {
      segments: [
        { webp: fromToHub.webp, durationMs: fromToHub.durationMs, reversed: true },
        { webp: hubToTo.webp, durationMs: hubToTo.durationMs },
      ],
      final: to,
      key,
    }
  }

  // 3. No material on either path: empty segments signal the renderer to
  //    crossfade between the two state loops.
  return { segments: [], final: to, key }
}

/**
 * Pet animation contract → Jiangxiao cyclic state mapping (PRD D8). The pet
 * state machine emits one of 9 PetAnimation tracks; the animated-webp
 * renderer needs the corresponding JiangxiaoState to index the webp loops
 * and feed the scheduler. `running-left` and `waving` are reserve slots the
 * state machine never emits today; they map to `idle` and `welcome` so a
 * future emitter stays well-typed without redefining the table.
 */
export const PET_TO_JIANGXIAO: Readonly<Record<PetAnimation, JiangxiaoState>> = {
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

/**
 * Map one PetAnimation track onto its Jiangxiao cyclic state. Thin wrapper
 * over PET_TO_JIANGXIAO so callers import a function, not a lookup table.
 */
export function petToJiangxiao(petAnim: PetAnimation): JiangxiaoState {
  return PET_TO_JIANGXIAO[petAnim]
}