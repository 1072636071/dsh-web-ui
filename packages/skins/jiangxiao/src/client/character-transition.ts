// character-transition: 状态切换过渡段解析的纯函数模块。
//
// 唯一 seam：getTransitionPath(from, to) → TransitionSegment[]。
// 无 DOM 依赖、无副作用——不访问 window/document/定时器，可在 vitest 中独立确定性测试。
//
// 枢纽制过渡：状态 A→B 有直达段则播 1 段，否则经 idle 枢纽 2 段，无素材回空序列
// 由播放层走 crossfade 兜底。
//
// TRANSITIONS 表以 assets/character/transition-*.webp 文件为准。
// key 格式 "<from>→<to>"，对应文件 transition-<from>-<to>.webp。
// durationMs = 帧数 / 15fps（素材侧 hold-tail 尾帧静置已计入帧数）。
//
// 覆盖核心 10 态（DESIGN.md §4）之间的过渡素材 + 素材侧 6 个情绪子态过渡段：
//   idle 枢纽正放 9 段 + 倒放 9 段 + thinking↔replying 直达 2 段 = 20 段核心态；
//   idle↔{cheek-rest,chin-rest,frown-wave,nod-smile,shush,shy-smile} 12 段 +
//   {frown-wave,nod-smile}↔permission 4 段 = 16 段子态点缀；合计 36 段。
// 子态名不在 CharacterState 联合（无对应循环 webp），仅作过渡素材清单登记，
// 供未来"小动作"逻辑或外部完整性校验使用，getTransitionPath 不引用。

import type { CharacterState } from "./character-state"

/** 过渡播放段：webp 素材 + 时长 + 唯一 key。 */
export type TransitionSegment = {
  /** webp 素材路径（assets 下相对路径，运行时由播放层解析为实际 URL）。 */
  webp: string
  /** 播放时长（ms）= 帧数 / 15fps，含素材侧 hold-tail 尾帧静置。 */
  durationMs: number
  /** 唯一键 "<from>→<to>"，用于作废判定。 */
  key: string
}

/** 过渡段定义：(from, to, 帧数)。帧数取自素材侧（含 hold-tail）。 */
// prettier-ignore
const SEGMENTS: ReadonlyArray<readonly [CharacterState, CharacterState, number]> = [
  // idle 枢纽：正放 idle→X
  ["idle", "done", 52], ["idle", "error", 82], ["idle", "listening", 82],
  ["idle", "permission", 52], ["idle", "reading", 82], ["idle", "replying", 52],
  ["idle", "thinking", 52], ["idle", "welcome", 52], ["idle", "working", 52],
  // idle 枢纽：倒放 X→idle
  ["done", "idle", 52], ["error", "idle", 82], ["listening", "idle", 82],
  ["permission", "idle", 52], ["reading", "idle", 82], ["replying", "idle", 52],
  ["thinking", "idle", 52], ["welcome", "idle", 52], ["working", "idle", 52],
  // 直达链：thinking↔replying
  ["thinking", "replying", 82], ["replying", "thinking", 82],
]

/**
 * 情绪子态过渡段（素材侧 6 个子态，不在 CharacterState 联合）。
 * from/to 用 string 以接纳子态名；帧数取与核心态段相同的 52 帧默认
 * （素材侧 hold-tail 已计入；精确帧数需 webp 元数据，此处用合理默认）。
 */
// prettier-ignore
const SUBSTATE_SEGMENTS: ReadonlyArray<readonly [string, string, number]> = [
  // idle ↔ 子态（6 组双向 = 12 段）
  ["idle", "cheek-rest", 52], ["cheek-rest", "idle", 52],
  ["idle", "chin-rest", 52], ["chin-rest", "idle", 52],
  ["idle", "frown-wave", 52], ["frown-wave", "idle", 52],
  ["idle", "nod-smile", 52], ["nod-smile", "idle", 52],
  ["idle", "shush", 52], ["shush", "idle", 52],
  ["idle", "shy-smile", 52], ["shy-smile", "idle", 52],
  // 子态 ↔ permission（2 组双向 = 4 段）
  ["frown-wave", "permission", 52], ["permission", "frown-wave", 52],
  ["nod-smile", "permission", 52], ["permission", "nod-smile", 52],
]

/** 全部过渡段（核心态 20 + 子态 16 = 36），与 assets/character/transition-*.webp 一一对应。 */
const ALL_SEGMENTS: ReadonlyArray<readonly [string, string, number]> = [
  ...SEGMENTS,
  ...SUBSTATE_SEGMENTS,
]

/**
 * TRANSITIONS 常量表：key "<from>→<to>" → { webp, durationMs }。
 * 覆盖 assets/character/ 下全部 36 个 transition-*.webp 素材。
 */
export const TRANSITIONS: Readonly<Record<string, TransitionSegment>> = Object.freeze(
  Object.fromEntries(
    ALL_SEGMENTS.map(([from, to, frames]) => [
      `${from}→${to}`,
      {
        webp: `transition-${from}-${to}.webp`,
        durationMs: Math.round((frames * 1000) / 15),
        key: `${from}→${to}`,
      } satisfies TransitionSegment,
    ]),
  ),
)

/** 过渡段在表中的查找。 */
function lookup(from: CharacterState, to: CharacterState): TransitionSegment | undefined {
  return TRANSITIONS[`${from}→${to}`]
}

/**
 * 解析状态切换过渡段序列：
 * - from === to → 空序列（无过渡）；
 * - 有直达段（from→to 在表）→ 1 段；
 * - 否则经枢纽 → 2 段（from→idle + idle→to，两段都需在表；任一缺失则落空）；
 * - 无素材 → 空序列（调用方走 crossfade 兜底）。
 */
export function getTransitionPath(from: CharacterState, to: CharacterState): TransitionSegment[] {
  if (from === to) return []
  const direct = lookup(from, to)
  if (direct) return [direct]
  const a = lookup(from, "idle")
  const b = lookup("idle", to)
  if (a && b) return [a, b]
  return []
}
