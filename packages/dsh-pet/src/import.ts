/**
 * Pet asset zip import — pure function that validates and extracts a pet asset
 * zip archive into the target directory. The zip must contain a valid pet.json
 * manifest with `kind: "animated-webp"` and `id: "jiangxiao"` so the import
 * is gated to exactly the Jiangxiao animated-webp pet.
 * @module @linxin666/dsh-pet/import
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import { unzipSync, type Unzipped } from 'fflate'

/** Max size of a single extracted file (500 MB). */
const MAX_FILE_SIZE = 500 * 1024 * 1024

/** Max total size of all extracted files (1 GB). */
const MAX_TOTAL_SIZE = 1024 * 1024 * 1024

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
 * error message string on failure, or undefined on success. */
function validatePetManifest(raw: unknown): string | undefined {
  if (typeof raw !== 'object' || raw === null) return 'pet.json 不是有效的 JSON 对象'
  const source = raw as Record<string, unknown>
  const id = typeof source.id === 'string' ? source.id.trim() : ''
  if (id !== 'jiangxiao') return 'pet.json id 必须是 "jiangxiao"'
  const kind = source.kind
  if (kind !== 'animated-webp') return 'pet.json kind 必须是 "animated-webp"'
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
 * @returns Success or error result.
 */
export function importPetZip(
  zipBuffer: Buffer,
  targetDir: string,
): { ok: true } | { ok: false; error: string } {
  // Parse the zip archive.
  let entries: Unzipped
  try {
    entries = unzipSync(new Uint8Array(zipBuffer))
  } catch (error) {
    return {
      ok: false,
      error: 'ZIP 解析失败: ' + (error instanceof Error ? error.message : String(error)),
    }
  }

  const entryKeys = Object.keys(entries)
  if (entryKeys.length === 0) {
    return { ok: false, error: 'ZIP 文件为空' }
  }

  // Validate zip slip and collect safe entry paths.
  const safeEntries: Array<{ key: string; safePath: string; data: Uint8Array }> = []
  let totalSize = 0

  for (const key of entryKeys) {
    const data = entries[key]
    if (data === undefined) continue

    const safe = safeEntryPath(key)
    if (safe === undefined) {
      return { ok: false, error: 'ZIP 包含不安全的路径: ' + JSON.stringify(key) }
    }

    // Check file size.
    if (data.byteLength > MAX_FILE_SIZE) {
      return {
        ok: false,
        error: '文件 ' + JSON.stringify(key) + ' 超过大小限制 (' + String(MAX_FILE_SIZE) + ' 字节)',
      }
    }

    totalSize += data.byteLength
    if (totalSize > MAX_TOTAL_SIZE) {
      return {
        ok: false,
        error: 'ZIP 总大小超过限制 (' + String(MAX_TOTAL_SIZE) + ' 字节)',
      }
    }

    safeEntries.push({ key, safePath: safe, data })
  }

  // Find pet.json in the safe entries.
  const petJsonEntry = findPetJsonEntry(safeEntries)
  if (petJsonEntry === undefined) {
    return { ok: false, error: 'ZIP 中未找到 pet.json' }
  }

  // Parse and validate pet.json.
  let petJsonRaw: unknown
  try {
    const text = new TextDecoder().decode(petJsonEntry.data)
    petJsonRaw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'pet.json 不是有效的 JSON' }
  }

  const validationError = validatePetManifest(petJsonRaw)
  if (validationError !== undefined) {
    return { ok: false, error: validationError }
  }

  // Check if target directory already exists.
  if (existsSync(targetDir)) {
    return { ok: false, error: '动画包已存在，请先删除旧目录再导入' }
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
      error: '文件写入失败: ' + (error instanceof Error ? error.message : String(error)),
    }
  }

  return { ok: true }
}