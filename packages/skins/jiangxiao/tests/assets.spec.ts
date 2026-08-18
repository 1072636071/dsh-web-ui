/**
 * 工单 01：素材完整性校验 — 46 个 webp（10 循环态 + 36 过渡态）。
 *
 * 验证 assets/character/ 下素材数量与命名规范，确保素材入仓自洽。
 */
import { describe, expect, it } from 'vitest'
import { readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const assetsDir = fileURLToPath(new URL('../assets/character/', import.meta.url))

function listWebp(): string[] {
  return readdirSync(assetsDir).filter((f) => f.endsWith('.webp'))
}

describe('assets/character — 46 webp integrity', () => {
  it('has exactly 46 webp files', () => {
    const files = listWebp()
    expect(files).toHaveLength(46)
  })

  it('has 10 loop-state webp named {state}.webp', () => {
    const expected = ['idle', 'thinking', 'reading', 'replying', 'working', 'error', 'welcome', 'done', 'permission', 'listening']
    const files = listWebp()
    const loop = files.filter((f) => !f.startsWith('transition-'))
    expect(loop).toHaveLength(10)
    for (const state of expected) {
      expect(loop).toContain(`${state}.webp`)
    }
  })

  it('has 36 transition webp named transition-<from>-<to>.webp', () => {
    const files = listWebp()
    const trans = files.filter((f) => f.startsWith('transition-'))
    expect(trans).toHaveLength(36)
    for (const f of trans) {
      expect(f).toMatch(/^transition-[a-z-]+-[a-z-]+\.webp$/)
    }
  })

  it('idle hub transitions cover all 9 non-idle core states (forward + reverse)', () => {
    const files = listWebp()
    const coreStates = ['thinking', 'reading', 'replying', 'working', 'error', 'welcome', 'done', 'permission', 'listening']
    for (const s of coreStates) {
      expect(files).toContain(`transition-idle-${s}.webp`)
      expect(files).toContain(`transition-${s}-idle.webp`)
    }
  })

  it('thinking <-> replying direct transitions exist', () => {
    const files = listWebp()
    expect(files).toContain('transition-thinking-replying.webp')
    expect(files).toContain('transition-replying-thinking.webp')
  })

  it('all webp files are non-empty', () => {
    const files = listWebp()
    for (const f of files) {
      const size = statSync(`${assetsDir}/${f}`).size
      expect(size).toBeGreaterThan(0)
    }
  })
})
