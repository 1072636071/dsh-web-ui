/**
 * Pet registry — the multi-pet contract. One pet is a directory holding a
 * 'pet.json' manifest plus an atlas image; nothing else is required, and no
 * host or client code changes when a pet is added. The registry scans three
 * sources, later sources overriding earlier ones on an id collision:
 *
 *   1. the package's own 'assets' subdirectories (built-in pets);
 *   2. '${CODEX_HOME:-~/.codex}/pets' subdirectories (hatch-pet custom pets);
 *   3. 'PetConfig.pets' manifests composed by the embedding application
 *      (highest precedence).
 *
 * The manifest follows the Codex/hatch-pet contract (8 columns x 9 rows of
 * 192x208 cells, the 9-state row order below). Legacy whale-girl manifests
 * that only carry 'frames' keep working: geometry, per-row frame counts and
 * per-track rhythm all fall back to the hatch-pet contract defaults, and the
 * whale-girl manifest overrides its own durations.
 * @module @linxin666/dsh-pet/registry
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ActivityPhase, PetAnimation } from './state.ts'
import { normalizePetRemarks, type PetRemarks, type PetRemarksManifest } from './remarks.ts'

/** Fixed row order of the 9-state animation contract. */
export const PET_ROW_ORDER: readonly PetAnimation[] = [
  'idle',
  'running-right',
  'running-left',
  'waving',
  'jumping',
  'failed',
  'waiting',
  'running',
  'review',
]

/**
 * The 10 cyclic states an animated-webp pet declares (JiangxiaoState). The
 * manifest's 'states' map must cover every key; the renderer (work item 04)
 * indexes these for the loop animation. The pet animation contract maps onto
 * this set via PET_TO_JIANGXIAO (work item 03).
 */
export type JiangxiaoState =
  | 'idle'
  | 'thinking'
  | 'reading'
  | 'replying'
  | 'working'
  | 'error'
  | 'welcome'
  | 'done'
  | 'permission'
  | 'listening'

/** All 10 cyclic states in a stable order (manifest 'states' must cover each). */
export const JIANGXIAO_STATES: readonly JiangxiaoState[] = [
  'idle',
  'thinking',
  'reading',
  'replying',
  'working',
  'error',
  'welcome',
  'done',
  'permission',
  'listening',
]

/** Manifest kind: spritesheet (default) or animated-webp (Jiangxiao-style). */
export type PetManifestKind = 'spritesheet' | 'animated-webp'

/** One animated-webp transition: a webp file plus its play duration in ms. */
export interface WebpPetTransition {
  /** Webp file path relative to the manifest's directory. */
  webp: string
  /** Play duration in ms (positive finite). */
  durationMs: number
}

/** Host-side transition descriptor (file path + duration, no URL rewrite). */
export interface WebpPetTransitionEntry {
  /** Relative webp file path (safe, normalized). */
  webp: string
  /** Play duration in ms. */
  durationMs: number
}

/** Browser-side transition descriptor (URL + duration). */
export interface WebpPetTransitionView {
  /** Browser URL of the webp (served by the host asset route). */
  webp: string
  /** Play duration in ms. */
  durationMs: number
}

/** Atlas cell size in px. */
export interface PetCell {
  width: number
  height: number
}

/** Atlas cell size in px (Codex/hatch-pet contract). */
export const DEFAULT_PET_CELL: PetCell = { width: 192, height: 208 }
/** Columns per row (max frames per track). */
export const DEFAULT_PET_COLUMNS = 8
/** Rows in the atlas (fixed by the animation contract). */
export const DEFAULT_PET_ROW_COUNT = 9

/**
 * Per-row used-column counts from the hatch-pet contract table. Manifests
 * that carry no 'frames' field (the Codex custom-pet shape) resolve here.
 */
export const DEFAULT_FRAME_COUNTS: readonly number[] = [6, 8, 8, 4, 5, 8, 6, 6, 6]

/** Absolute package root, resolved from a module URL (lib/ or src/). */
export function petPackageRoot(importMetaUrl: string): string {
  return fileURLToPath(new URL('../', importMetaUrl))
}

/** Resolve the hatch-pet custom pets directory (CODEX_HOME or ~/.codex). */
export function codexPetsDir(env: NodeJS.ProcessEnv = process.env, home: string = homedir()): string {
  const raw = env.CODEX_HOME !== undefined && env.CODEX_HOME.trim() !== ''
    ? env.CODEX_HOME.trim()
    : join(home, '.codex')
  const expanded = raw === '~'
    ? home
    : (raw.startsWith('~/') || raw.startsWith('~\\')) ? join(home, raw.slice(2)) : raw
  return join(expanded, 'pets')
}

/** Finite non-negative integer guard, else the fallback. */
function finiteInt(value: unknown, fallback: number, max: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= max
    ? value
    : fallback
}

/** Build the browser URL of one pet asset. */
function assetUrl(prefix: string, id: string, file: string): string {
  const path = file.split('/').filter(segment => segment !== '').join('/')
  return prefix + '/' + encodeURIComponent(id) + '/' + path
}

/** One animation track as served to the browser half. */
export interface PetTrackDef {
  /** Frame indices (columns) played in order. */
  frames: number[]
  /** Per-frame duration in ms; same length as frames. */
  durations: number[]
  /** Whether the track loops; a non-looping track holds its last frame. */
  loop: boolean
  /** Track to switch to after a non-looping track finishes. */
  fallback?: PetAnimation
}

/** Default per-track rhythm (hatch-pet contract table). */
export const DEFAULT_TRACK_PATTERNS: Record<PetAnimation, {
  durations: number[]
  loop: boolean
  fallback?: PetAnimation
}> = {
  idle: { durations: [280, 110, 110, 140, 140, 320], loop: true },
  'running-right': { durations: [120, 120, 120, 120, 120, 120, 120, 220], loop: true },
  'running-left': { durations: [120, 120, 120, 120, 120, 120, 120, 220], loop: true },
  waving: { durations: [140, 140, 140, 280], loop: true },
  jumping: { durations: [140, 140, 140, 140, 280], loop: false, fallback: 'idle' },
  failed: { durations: [140, 140, 140, 140, 140, 140, 140, 240], loop: false, fallback: 'idle' },
  waiting: { durations: [150, 150, 150, 150, 150, 260], loop: true },
  running: { durations: [120, 120, 120, 120, 120, 220], loop: true },
  review: { durations: [150, 150, 150, 150, 150, 280], loop: true },
}

/** Manifest shape a pet directory (or 'PetConfig.pets' entry) declares. */
export interface PetManifest {
  /** Unique pet id, lowercase kebab-case. */
  id: string
  /** Human-readable display name (settings selector, panel header). */
  displayName: string
  /** One-line description. */
  description?: string
  /**
   * Manifest kind: 'spritesheet' (default) or 'animated-webp'. The kind
   * decides which fields the resolver validates and which render path the
   * browser half takes. Omitting it keeps the legacy spritesheet contract,
   * so existing pets are unaffected.
   */
  kind?: PetManifestKind
  /** Atlas path relative to the manifest's directory (spritesheet kind). */
  spritesheetPath?: string
  /** Atlas cell size; defaults to the Codex contract 192x208. */
  cell?: { width?: number; height?: number }
  /** Columns per row; defaults to 8. */
  columns?: number
  /**
   * Per-row frame counts (9 entries, row order above). Manifests that omit
   * it resolve the hatch-pet contract table.
   */
  frames?: number[]
  /** Optional per-track rhythm overrides; omitted tracks use the defaults. */
  tracks?: Partial<Record<PetAnimation, PetTrackOverride>>
  /** Optional per-scene track sequences; every declared sequence has at least 5 items. */
  sequences?: Partial<Record<ActivityPhase, PetAnimation[]>>
  /**
   * Optional witty-remark overrides the pet speaks on interactions
   * (community contributions use this to give their pet its own voice).
   * Each slot accepts one line or a pool of lines; a slot replaces the
   * built-in default pool for that slot only.
   */
  remarks?: PetRemarksManifest
  /**
   * animated-webp kind: 10 cyclic states → webp file paths. Required when
   * kind is 'animated-webp'; ignored by the spritesheet resolver.
   */
  states?: Record<JiangxiaoState, string>
  /**
   * animated-webp kind: transition key '<from>→<to>' → {webp, durationMs}.
   * Required when kind is 'animated-webp'. The resolver accepts every key
   * (D13: all 36 transition files ship; the scheduler in work item 03
   * filters to pet-reachable 10-state paths, not this layer).
   */
  transitions?: Record<string, WebpPetTransition>
}

/** Per-track rhythm overrides a manifest may carry. */
export interface PetTrackOverride {
  /** Per-frame durations in ms (cycled to the row's frame count). */
  durations?: number[]
  /** Whether the track loops. */
  loop?: boolean
  /** Track to switch to after a non-looping track finishes. */
  fallback?: PetAnimation
}

/** A normalized pet as served to the browser half. */
export interface PetDefinition {
  id: string
  displayName: string
  description: string
  /** Manifest kind (spritesheet or animated-webp). */
  kind: PetManifestKind
  /** Atlas cell size in px. */
  cell: PetCell
  /** Columns per row. */
  columns: number
  /** Per-row frame counts (length 9, row order above). */
  rows: number[]
  /** Total atlas rows (9 for v1, 11 for v2 look-row atlases). */
  atlasRows: number
  /** Fully resolved animation tracks (frames + durations + loop/fallback). */
  tracks: Record<PetAnimation, PetTrackDef>
  /** Validated per-scene track sequences; omitted scenes keep single-track playback. */
  sequences?: Partial<Record<ActivityPhase, PetAnimation[]>>
  /** Browser URL of the atlas (served by the host asset route). */
  atlasUrl: string
  /** Browser URL of the manifest (served by the host asset route). */
  manifestUrl: string
  /**
   * animated-webp kind: 10 cyclic states → browser URLs. Present only when
   * kind is 'animated-webp'.
   */
  states?: Record<JiangxiaoState, string>
  /**
   * animated-webp kind: transition key → {webp URL, durationMs}. Present
   * only when kind is 'animated-webp'.
   */
  transitions?: Record<string, WebpPetTransitionView>
}

/** A resolved pet plus its host-side file location. */
export interface PetEntry extends PetDefinition {
  /** Absolute directory holding the manifest and atlas. */
  dir: string
  /** Atlas path relative to 'dir' (declared by the manifest). */
  spritesheetPath: string
  /**
   * animated-webp kind: 10 cyclic states → relative file paths. Present
   * only when kind is 'animated-webp'.
   */
  statePaths?: Record<JiangxiaoState, string>
  /**
   * animated-webp kind: transition key → {relative webp path, durationMs}.
   * Present only when kind is 'animated-webp'.
   */
  transitionPaths?: Record<string, WebpPetTransitionEntry>
  /** Normalized per-pet remark pools (manifest 'remarks'), when declared. */
  remarks?: PetRemarks
}

/** Registry load result: resolved entries plus load warnings. */
export interface PetRegistry {
  entries: PetEntry[]
  warnings: string[]
  byId(id: string): PetEntry | undefined
  /** The pet an installation falls back to when the selection is unknown. */
  defaultEntry(): PetEntry
}

/** Registry sources. */
export interface PetRegistryOptions {
  /** Absolute package root whose 'assets/*' hold built-in pets. */
  packageRoot: string
  /** Asset route prefix the browser URLs are built under. */
  assetPrefix?: string
  /** Custom pet directory (defaults to '${CODEX_HOME:-~/.codex}/pets'). */
  petsDir?: string
  /** Extra manifest entries composed by the embedding application. */
  extra?: readonly PetManifest[]
}

/** Stable id charset: keeps asset URLs plain and filesystem-safe. */
const PET_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/
/** Safe path-segment charset for atlas files. */
const PATH_SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/
const PET_NAME_MAX_LENGTH = 80
/** Upper bound on a transition key length (defensive; keys are arbitrary). */
const TRANSITION_KEY_MAX_LENGTH = 64
/** Upper bound on a transition duration in ms (defensive). */
const TRANSITION_DURATION_MAX_MS = 60_000

/**
 * Validate one relative path segment list: no absolute paths, no backslash,
 * no '..' segments, every segment matches the safe charset. Returns the
 * normalized segments (joined by '/'), or undefined when the path is unsafe.
 */
function safeRelativePath(raw: string): string | undefined {
  const trimmed = raw.trim()
  if (trimmed === '') return undefined
  const segments = trimmed.split('/').filter(segment => segment !== '')
  if (
    segments.length === 0
    || isAbsolute(trimmed)
    || trimmed.includes('\\')
    || segments.some(segment => segment === '..' || !PATH_SEGMENT_PATTERN.test(segment))
  ) {
    return undefined
  }
  return segments.join('/')
}

const PET_PHASES: readonly ActivityPhase[] = ['idle', 'waiting', 'thinking', 'tool', 'review', 'done', 'failed']

/** Validate optional scene sequences without rejecting an otherwise usable pet. */
function normalizeSequences(
  raw: unknown,
  id: string,
  warn: (message: string) => void,
): Partial<Record<ActivityPhase, PetAnimation[]>> | undefined {
  if (raw === undefined) return undefined
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    warn('manifest ' + id + ': sequences must be an object keyed by activity phase')
    return undefined
  }
  const sequences: Partial<Record<ActivityPhase, PetAnimation[]>> = {}
  for (const [phase, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!PET_PHASES.includes(phase as ActivityPhase)) {
      warn('manifest ' + id + ': unknown sequence phase ' + JSON.stringify(phase))
      continue
    }
    if (!Array.isArray(value) || value.length < 5) {
      warn('manifest ' + id + ': sequence ' + phase + ' must contain at least 5 animations')
      continue
    }
    const unknownIndex = value.findIndex(animation => typeof animation !== 'string' || !PET_ROW_ORDER.includes(animation as PetAnimation))
    if (unknownIndex !== -1) {
      const unknown = value[unknownIndex]
      warn('manifest ' + id + ': sequence ' + phase + ' contains unknown animation ' + JSON.stringify(unknown))
      continue
    }
    sequences[phase as ActivityPhase] = value as PetAnimation[]
  }
  return Object.keys(sequences).length === 0 ? undefined : sequences
}

/**
 * Normalize one parsed manifest into a renderable pet entry, or undefined
 * (with a warning recorded) when the manifest violates the contract.
 */
export function resolvePetManifest(
  raw: unknown,
  dir: string,
  options: { assetPrefix?: string; warnings?: string[] } = {},
): PetEntry | undefined {
  const { assetPrefix = '/pet', warnings = [] } = options
  const warn = (message: string): void => { warnings.push(message) }
  if (typeof raw !== 'object' || raw === null) {
    warn('manifest is not an object')
    return undefined
  }
  const source = raw as Record<string, unknown>
  const id = typeof source.id === 'string' ? source.id.trim() : ''
  if (!PET_ID_PATTERN.test(id)) {
    warn('manifest id ' + JSON.stringify(String(source.id)) + ' is not a lowercase kebab id')
    return undefined
  }
  const displayName = typeof source.displayName === 'string' && source.displayName.trim() !== ''
    ? source.displayName.trim().slice(0, PET_NAME_MAX_LENGTH)
    : id
  const description = typeof source.description === 'string'
    ? source.description.trim()
    : ''
  const remarks = normalizePetRemarks(source.remarks, message => warn('manifest ' + id + ': ' + message))
  // Kind dispatch: 'animated-webp' takes the webp branch; anything else
  // (including 'spritesheet' and the legacy omitted value) falls back to
  // the spritesheet contract. An unknown kind is rejected.
  const rawKind = source.kind
  if (rawKind !== undefined && rawKind !== 'spritesheet' && rawKind !== 'animated-webp') {
    warn('manifest ' + id + ': unknown kind ' + JSON.stringify(String(rawKind)))
    return undefined
  }
  const kind: PetManifestKind = rawKind === 'animated-webp' ? 'animated-webp' : 'spritesheet'
  if (kind === 'animated-webp') {
    return resolveWebpManifest(source, id, displayName, description, dir, assetPrefix, remarks, warn)
  }
  return resolveSpritesheetManifest(source, id, displayName, description, dir, assetPrefix, remarks, warn)
}

/**
 * Resolve an animated-webp manifest: 10 cyclic states + transition table.
 * The spritesheet geometry fields are filled with defaults so the existing
 * PetDefinition shape stays compatible; the browser half dispatches on
 * 'kind' to pick the webp render path (work item 04).
 */
function resolveWebpManifest(
  source: Record<string, unknown>,
  id: string,
  displayName: string,
  description: string,
  dir: string,
  assetPrefix: string,
  remarks: PetRemarks | undefined,
  warn: (message: string) => void,
): PetEntry | undefined {
  // states: must be an object covering all 10 JiangxiaoState keys, each
  // value a safe relative webp path.
  const rawStates = source.states
  if (typeof rawStates !== 'object' || rawStates === null || Array.isArray(rawStates)) {
    warn('manifest ' + id + ': animated-webp requires a states object')
    return undefined
  }
  const statePaths = {} as Record<JiangxiaoState, string>
  for (const state of JIANGXIAO_STATES) {
    const raw = (rawStates as Record<string, unknown>)[state]
    if (typeof raw !== 'string') {
      warn('manifest ' + id + ': states.' + state + ' is not a string')
      return undefined
    }
    const safe = safeRelativePath(raw)
    if (safe === undefined) {
      warn('manifest ' + id + ': states.' + state + ' ' + JSON.stringify(raw) + ' is not a safe relative path')
      return undefined
    }
    statePaths[state] = safe
  }
  // Reject extra state keys (typos surface early; the contract is exactly 10).
  for (const key of Object.keys(rawStates as Record<string, unknown>)) {
    if (!JIANGXIAO_STATES.includes(key as JiangxiaoState)) {
      warn('manifest ' + id + ': states.' + key + ' is not a known JiangxiaoState')
      return undefined
    }
  }
  // transitions: must be an object; each value {webp, durationMs} with a
  // safe relative webp path and a positive finite duration. Keys are
  // arbitrary strings (D13: the resolver accepts all 36 transition keys;
  // the scheduler filters to pet-reachable paths in work item 03).
  const rawTransitions = source.transitions
  if (typeof rawTransitions !== 'object' || rawTransitions === null || Array.isArray(rawTransitions)) {
    warn('manifest ' + id + ': animated-webp requires a transitions object')
    return undefined
  }
  const transitionPaths = {} as Record<string, WebpPetTransitionEntry>
  for (const [key, value] of Object.entries(rawTransitions as Record<string, unknown>)) {
    if (key === '' || key.length > TRANSITION_KEY_MAX_LENGTH) {
      warn('manifest ' + id + ': transition key ' + JSON.stringify(key) + ' is empty or too long')
      return undefined
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      warn('manifest ' + id + ': transition ' + JSON.stringify(key) + ' is not an object')
      return undefined
    }
    const record = value as Record<string, unknown>
    const rawWebp = record.webp
    if (typeof rawWebp !== 'string') {
      warn('manifest ' + id + ': transition ' + JSON.stringify(key) + '.webp is not a string')
      return undefined
    }
    const safeWebp = safeRelativePath(rawWebp)
    if (safeWebp === undefined) {
      warn('manifest ' + id + ': transition ' + JSON.stringify(key) + '.webp ' + JSON.stringify(rawWebp) + ' is not a safe relative path')
      return undefined
    }
    const rawDuration = record.durationMs
    if (typeof rawDuration !== 'number' || !Number.isFinite(rawDuration) || rawDuration <= 0 || rawDuration > TRANSITION_DURATION_MAX_MS) {
      warn('manifest ' + id + ': transition ' + JSON.stringify(key) + '.durationMs is not a positive finite number')
      return undefined
    }
    transitionPaths[key] = { webp: safeWebp, durationMs: rawDuration }
  }
  if (Object.keys(transitionPaths).length === 0) {
    warn('manifest ' + id + ': animated-webp transitions is empty')
    return undefined
  }
  // Build browser URLs for every state and transition webp.
  const stateUrls = {} as Record<JiangxiaoState, string>
  for (const state of JIANGXIAO_STATES) {
    stateUrls[state] = assetUrl(assetPrefix, id, statePaths[state])
  }
  const transitionUrls = {} as Record<string, WebpPetTransitionView>
  for (const [key, entry] of Object.entries(transitionPaths)) {
    transitionUrls[key] = { webp: assetUrl(assetPrefix, id, entry.webp), durationMs: entry.durationMs }
  }
  // Spritesheet geometry is unused by the webp render path but kept as
  // defaults so the PetDefinition shape stays compatible with existing
  // consumers (the browser half dispatches on 'kind').
  const cell = { ...DEFAULT_PET_CELL }
  const columns = DEFAULT_PET_COLUMNS
  const rows = [...DEFAULT_FRAME_COUNTS]
  const tracks = {} as Record<PetAnimation, PetTrackDef>
  for (const [row, animation] of PET_ROW_ORDER.entries()) {
    const pattern = DEFAULT_TRACK_PATTERNS[animation]
    const frameCount = Math.max(1, Math.min(rows[row]!, columns))
    tracks[animation] = {
      frames: Array.from({ length: frameCount }, (_, index) => index),
      durations: pattern.durations.slice(0, frameCount),
      loop: pattern.loop,
      ...(pattern.fallback === undefined ? {} : { fallback: pattern.fallback }),
    }
  }
  // spritesheetPath is required by the manifest shape but unused for webp
  // pets; carry a placeholder so the entry stays shape-compatible.
  const spritesheetPath = 'spritesheet.webp'
  return {
    id,
    displayName,
    description,
    kind: 'animated-webp',
    cell,
    columns,
    rows,
    atlasRows: DEFAULT_PET_ROW_COUNT,
    tracks,
    atlasUrl: assetUrl(assetPrefix, id, spritesheetPath),
    manifestUrl: assetUrl(assetPrefix, id, 'pet.json'),
    states: stateUrls,
    transitions: transitionUrls,
    dir,
    spritesheetPath,
    statePaths,
    transitionPaths,
    ...(remarks === undefined ? {} : { remarks }),
  }
}

/**
 * Resolve a spritesheet manifest (the legacy Codex/hatch-pet contract).
 * Extracted from the original resolvePetManifest body; behavior unchanged.
 */
function resolveSpritesheetManifest(
  source: Record<string, unknown>,
  id: string,
  displayName: string,
  description: string,
  dir: string,
  assetPrefix: string,
  remarks: PetRemarks | undefined,
  warn: (message: string) => void,
): PetEntry | undefined {
  const spritesheet = typeof source.spritesheetPath === 'string' && source.spritesheetPath.trim() !== ''
    ? source.spritesheetPath.trim()
    : 'spritesheet.webp'
  const spritesheetPath = safeRelativePath(spritesheet)
  if (spritesheetPath === undefined) {
    warn('manifest spritesheetPath ' + JSON.stringify(spritesheet) + ' is not a safe relative path')
    return undefined
  }
  const rawCell = (typeof source.cell === 'object' && source.cell !== null ? source.cell : {}) as Record<string, unknown>
  const cell = {
    width: finiteInt(rawCell.width, DEFAULT_PET_CELL.width, 2048),
    height: finiteInt(rawCell.height, DEFAULT_PET_CELL.height, 2048),
  }
  const columns = finiteInt(source.columns, DEFAULT_PET_COLUMNS, 32)
  // v2 atlases (spriteVersionNumber 2) hold 11 rows: 9 animation rows + 2 look rows.
  const atlasRowCount = source.spriteVersionNumber === 2 ? 11 : DEFAULT_PET_ROW_COUNT
  const rows = DEFAULT_FRAME_COUNTS.map((fallback, index) => {
    const value = Array.isArray(source.frames) ? source.frames[index] : undefined
    return finiteInt(value, fallback, columns)
  })
  const sequences = normalizeSequences(source.sequences, id, warn)
  const trackOverrides = (typeof source.tracks === 'object' && source.tracks !== null ? source.tracks : {}) as Partial<Record<PetAnimation, PetTrackOverride>>
  const tracks = {} as Record<PetAnimation, PetTrackDef>
  for (const [row, animation] of PET_ROW_ORDER.entries()) {
    const pattern = DEFAULT_TRACK_PATTERNS[animation]
    const override = trackOverrides[animation]
    const durations = Array.isArray(override?.durations) && override.durations.length > 0
      ? override.durations.filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0)
      : pattern.durations
    if (durations.length === 0) {
      warn('manifest ' + id + ': track ' + animation + ' carries no usable durations')
      return undefined
    }
    const frameCount = Math.max(1, Math.min(rows[row]!, columns))
    const sized = durations.length >= frameCount
      ? durations.slice(0, frameCount)
      : Array.from({ length: frameCount }, (_, index) => durations[index % durations.length]!)
    tracks[animation] = {
      frames: Array.from({ length: frameCount }, (_, index) => index),
      durations: sized,
      loop: typeof override?.loop === 'boolean' ? override.loop : pattern.loop,
      ...(override?.fallback === undefined
        ? pattern.fallback === undefined ? {} : { fallback: pattern.fallback }
        : PET_ROW_ORDER.includes(override.fallback)
          ? { fallback: override.fallback }
          : pattern.fallback === undefined ? {} : { fallback: pattern.fallback }),
    }
  }
  return {
    id,
    displayName,
    description,
    kind: 'spritesheet',
    cell,
    columns,
    rows,
    atlasRows: atlasRowCount,
    tracks,
    ...(sequences === undefined ? {} : { sequences }),
    atlasUrl: assetUrl(assetPrefix, id, spritesheet),
    manifestUrl: assetUrl(assetPrefix, id, 'pet.json'),
    dir,
    spritesheetPath,
    ...(remarks === undefined ? {} : { remarks }),
  }
}

/** Scan one directory of pet folders; entries come back in name order. */
function scanPetDir(dir: string, options: { assetPrefix?: string; warnings?: string[] }): PetEntry[] {
  if (!existsSync(dir)) return []
  let names: string[] = []
  try {
    names = readdirSync(dir).filter(name => !name.startsWith('.'))
  } catch {
    return []
  }
  names.sort()
  const entries: PetEntry[] = []
  for (const name of names) {
    const manifestFile = join(dir, name, 'pet.json')
    if (!existsSync(manifestFile)) continue
    const parsed = readPetJson(manifestFile, options.warnings)
    if (parsed === undefined) continue
    const entry = resolvePetManifest(parsed, join(dir, name), options)
    if (entry !== undefined) entries.push(entry)
  }
  return entries
}

/** Read and parse one manifest file; undefined (warning recorded) on failure. */
function readPetJson(file: string, warnings: string[] | undefined): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    warnings?.push('skipping ' + file + ': ' + (error instanceof Error ? error.message : String(error)))
    return undefined
  }
}

/**
 * Load the pet registry: built-in 'assets/*' first, then the hatch-pet
 * custom pets directory, then composed 'extra' manifests (each later source
 * overrides an earlier one on id collision). The registry never throws on a
 * bad manifest: it skips it and records a warning.
 */
export function loadPetRegistry(options: PetRegistryOptions): PetRegistry {
  const { packageRoot, assetPrefix = '/pet' } = options
  const warnings: string[] = []
  const byId = new Map<string, PetEntry>()
  const builtinIds = new Set<string>()

  for (const entry of scanPetDir(join(packageRoot, 'assets'), { assetPrefix, warnings })) {
    if (byId.has(entry.id)) {
      warnings.push('duplicate built-in pet id ' + entry.id + '; the first one wins')
      continue
    }
    byId.set(entry.id, entry)
    builtinIds.add(entry.id)
  }

  const petsDir = options.petsDir ?? codexPetsDir()
  if (petsDir !== '') {
    for (const entry of scanPetDir(petsDir, { assetPrefix, warnings })) {
      if (byId.has(entry.id)) warnings.push('custom pet ' + entry.id + ' overrides the built-in one')
      byId.set(entry.id, entry)
    }
  }

  for (const manifest of options.extra ?? []) {
    const raw = manifest.spritesheetPath
    const dir = raw === undefined || isAbsolute(raw)
      ? join(packageRoot, 'assets', 'extra')
      : dirname(resolve(packageRoot, raw))
    // petAtlasFile joins entry.dir (already the spritesheet's parent when the
    // path is package-relative) with entry.spritesheetPath, so the stored path
    // must be the basename only — otherwise the directory segment is applied
    // twice and the atlas 404s.
    const source = raw === undefined || isAbsolute(raw)
      ? manifest
      : { ...manifest, spritesheetPath: basename(raw) }
    const entry = resolvePetManifest(source, dir, { assetPrefix, warnings })
    if (entry === undefined) continue
    if (byId.has(entry.id)) warnings.push('composed pet ' + entry.id + ' overrides an earlier registration')
    byId.set(entry.id, entry)
  }

  const entries = [...byId.values()]
  return {
    entries,
    warnings,
    byId: (id: string) => byId.get(id),
    defaultEntry: () => entries.find(entry => builtinIds.has(entry.id)) ?? entries[0]!,
  }
}

/** Strip host-only fields, leaving the client-visible definition. */
export function petEntryView(entry: PetEntry): PetDefinition {
  return {
    id: entry.id,
    displayName: entry.displayName,
    description: entry.description,
    kind: entry.kind,
    cell: entry.cell,
    columns: entry.columns,
    rows: entry.rows,
    atlasRows: entry.atlasRows,
    tracks: entry.tracks,
    ...(entry.sequences === undefined ? {} : { sequences: entry.sequences }),
    atlasUrl: entry.atlasUrl,
    manifestUrl: entry.manifestUrl,
    ...(entry.states === undefined ? {} : { states: entry.states }),
    ...(entry.transitions === undefined ? {} : { transitions: entry.transitions }),
  }
}

/** The absolute file a pet's atlas resolves to (host asset route). */
export function petAtlasFile(entry: PetEntry): string {
  return join(entry.dir, entry.spritesheetPath)
}

/**
 * Every declared asset file for one entry, relative to its directory. The
 * host asset route serves exactly this set (plus pet.json and previews) so
 * a manifest can never read an undeclared file. Spritesheet entries declare
 * one atlas; animated-webp entries declare every state and transition webp.
 */
export function petAssetFiles(entry: PetEntry): readonly string[] {
  if (entry.kind === 'animated-webp') {
    const files: string[] = []
    if (entry.statePaths !== undefined) {
      for (const path of Object.values(entry.statePaths)) files.push(path)
    }
    if (entry.transitionPaths !== undefined) {
      for (const transition of Object.values(entry.transitionPaths)) files.push(transition.webp)
    }
    return files
  }
  return [entry.spritesheetPath]
}

/** The directory basename of one entry (legacy asset URL alias, e.g. whale). */
export function petDirAlias(entry: PetEntry): string {
  return basename(entry.dir)
}

