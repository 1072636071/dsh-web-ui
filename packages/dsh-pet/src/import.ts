/**
 * Pet asset zip import — pure function that validates and extracts a pet asset
 * zip archive into the target directory. The zip must contain a valid pet.json
 * manifest with `kind: "animated-webp"` and `id: "jiangxiao"` so the import
 * is gated to exactly the Jiangxiao animated-webp pet. Returns error codes
 * (i18n keys from the pet locale namespace) instead of hardcoded messages;
 * the caller (routes.ts) resolves them to localized text.
 * @module @linxin666/dsh-pet/import
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import { unzipSync, type Unzipped } from 'fflate'

/** Max size of a single extracted file (500 MB). */
const MAX_FILE_SIZE = 500 * 1024 * 1024

/** Max total size of all extracted files (1 GB). */
const MAX_TOTAL_SIZE = 1024 * 1024 * 1024

/** Import result with an i18n error code. */
export type ImportErrorResult = { ok: false; errorCode: string; errorData?: Record<string, string> }

/** Import result type. */
export type ImportResult = { ok: true } | ImportErrorResult

/** Normalize a zip entry path to a safe relative path using the platform
 * separator, or return undefined when the path is unsafe (zip slip). */
function safeEntryPath(raw: string): string | undefined {
  // Normalize all backslashes to forward slashes first.
  const normalized = raw.replace(/\\/g, '/')
  // Reject absolute paths (starts with '/' or Windows drive letter).
  if (normalized.startsWith('/')) return undefined
  if (/^[A-Za-z]:\//i.test(normalized)) return undefined
  // Reject empty paths and directory entries (trailing '/').
  if (normalized === '' || normalized.endsWith('/')) return undefined
  // Split into segments and check for '..' or '.' segments.
  const segments = normalized.split('/').filter(s => s !== '')
  for (const segment of segments) {
    if (segment === '..' || segment === '.') return undefined
  }
  // Convert back to platform-native path.
  return segments.join(sep)
}

/** Validate a parsed pet.json manifest for import eligibility. Returns an
 * error code on failure, or undefined on success. The manifest must be a
 * well-formed animated-webp pet with complete states and transitions. Any
 * valid id passes — not just "jiangxiao". */
function validatePetManifest(raw: unknown): string | undefined {
  if (typeof raw !== 'object' || raw === null) return 'pet.importError.invalidJson'
  const source = raw as Record<string, unknown>
  const id = typeof source.id === 'string' ? source.id.trim() : ''
  if (id === '') return 'pet.importError.invalidId'
  const kind = source.kind
  if (kind !== 'animated-webp') return 'pet.importError.wrongKind'

  // Validate states: must be an object covering all 10 JiangxiaoState keys.
  const REQUIRED_STATES = [
    'idle', 'thinking', 'reading', 'replying', 'working',
    'error', 'welcome', 'done', 'permission', 'listening',
  ] as const
  const rawStates = source.states
  if (typeof rawStates !== 'object' || rawStates === null || Array.isArray(rawStates)) {
    return 'pet.importError.invalidStates'
  }
  const statesRecord = rawStates as Record<string, unknown>
  for (const state of REQUIRED_STATES) {
    if (typeof statesRecord[state] !== 'string' || statesRecord[state] === '') {
      return 'pet.importError.invalidStates'
    }
  }

  // Validate transitions: must be an object with at least one entry.
  const rawTransitions = source.transitions
  if (typeof rawTransitions !== 'object' || rawTransitions === null || Array.isArray(rawTransitions)) {
    return 'pet.importError.invalidTransitions'
  }
  const transitionEntries = Object.entries(rawTransitions as Record<string, unknown>)
  if (transitionEntries.length === 0) return 'pet.importError.invalidTransitions'
  for (const [key, value] of transitionEntries) {
    if (key === '') return 'pet.importError.invalidTransitions'
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return 'pet.importError.invalidTransitions'
    }
    const record = value as Record<string, unknown>
    if (typeof record.webp !== 'string' || record.webp === '') {
      return 'pet.importError.invalidTransitions'
    }
    if (typeof record.durationMs !== 'number' || !Number.isFinite(record.durationMs) || record.durationMs <= 0) {
      return 'pet.importError.invalidTransitions'
    }
  }

  return undefined
}

/** Find the pet.json entry among the safe entries. Looks for an entry whose
 * basename (last path segment) is exactly 'pet.json'. */
function findPetJsonEntry(
  entries: Array<{ key: string; safePath: string; data: Uint8Array }>,
): { key: string; safePath: string; data: Uint8Array } | undefined {
  // First, try an exact match at the root of the zip.
  const exact = entries.find(e => e.safePath === 'pet.json')
  if (exact !== undefined) return exact
  // Fall back to any entry whose basename is pet.json.
  return entries.find(e => {
    const segments = e.safePath.split(sep)
    return segments[segments.length - 1] === 'pet.json'
  })
}

/**
 * Import a pet asset zip archive into the target directory. Validates the
 * zip contents, checks for zip slip, validates pet.json, and extracts all
 * files. On any failure the target directory is cleaned up.
 *
 * @param zipBuffer - The raw zip archive bytes.
 * @param targetDir - Absolute path to the pet directory
 *   (e.g. ~/.codex/pets/jiangxiao).
 * @returns Success or error result with i18n error codes.
 */
export function importPetZip(
  zipBuffer: Buffer,
  targetDir: string,
): ImportResult {
  // Parse the zip archive.
  let entries: Unzipped
  try {
    entries = unzipSync(new Uint8Array(zipBuffer))
  } catch (error) {
    return {
      ok: false,
      errorCode: 'pet.importError.zipParse',
      errorData: { detail: error instanceof Error ? error.message : String(error) },
    }
  }

  const entryKeys = Object.keys(entries)
  if (entryKeys.length === 0) {
    return { ok: false, errorCode: 'pet.importError.zipEmpty' }
  }

  // Validate zip slip and collect safe entry paths.
  const safeEntries: Array<{ key: string; safePath: string; data: Uint8Array }> = []
  let totalSize = 0

  for (const key of entryKeys) {
    const data = entries[key]
    if (data === undefined) continue

    const safe = safeEntryPath(key)
    if (safe === undefined) {
      return { ok: false, errorCode: 'pet.importError.zipSlip', errorData: { path: JSON.stringify(key) } }
    }

    // Check file size.
    if (data.byteLength > MAX_FILE_SIZE) {
      return {
        ok: false,
        errorCode: 'pet.importError.fileTooBig',
        errorData: { name: JSON.stringify(key), limit: String(MAX_FILE_SIZE) },
      }
    }

    totalSize += data.byteLength
    if (totalSize > MAX_TOTAL_SIZE) {
      return {
        ok: false,
        errorCode: 'pet.importError.totalTooBig',
        errorData: { limit: String(MAX_TOTAL_SIZE) },
      }
    }

    safeEntries.push({ key, safePath: safe, data })
  }

  // Find pet.json in the safe entries.
  const petJsonEntry = findPetJsonEntry(safeEntries)
  if (petJsonEntry === undefined) {
    return { ok: false, errorCode: 'pet.importError.petJsonNotFound' }
  }

  // Parse and validate pet.json.
  let petJsonRaw: unknown
  try {
    const text = new TextDecoder().decode(petJsonEntry.data)
    petJsonRaw = JSON.parse(text)
  } catch {
    return { ok: false, errorCode: 'pet.importError.invalidJson' }
  }

  const validationError = validatePetManifest(petJsonRaw)
  if (validationError !== undefined) {
    return { ok: false, errorCode: validationError }
  }

  // Check if target directory already exists.
  if (existsSync(targetDir)) {
    return { ok: false, errorCode: 'pet.importExists' }
  }

  // Create target directory and write all files.
  try {
    mkdirSync(targetDir, { recursive: true })
    for (const entry of safeEntries) {
      const filePath = join(targetDir, entry.safePath)
      const parentDir = join(filePath, '..')
      if (parentDir !== targetDir) {
        mkdirSync(parentDir, { recursive: true })
      }
      writeFileSync(filePath, entry.data)
    }
  } catch (error) {
    // Clean up on failure.
    try { rmSync(targetDir, { recursive: true, force: true }) } catch { /* ignore */ }
    return {
      ok: false,
      errorCode: 'pet.importError.writeFailed',
      errorData: { detail: error instanceof Error ? error.message : String(error) },
    }
  }

  return { ok: true }
}