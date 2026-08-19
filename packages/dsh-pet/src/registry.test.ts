import { describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  DEFAULT_FRAME_COUNTS,
  DEFAULT_PET_CELL,
  JIANGXIAO_STATES,
  codexPetsDir,
  loadPetRegistry,
  petAssetFiles,
  petEntryView,
  petAtlasFile,
  petPackageRoot,
  resolvePetManifest,
} from './registry.ts'
import type { JiangxiaoState, PetManifest } from './registry.ts'
import { resolveTransition } from './scheduler.ts'
import type { TransitionTable } from './scheduler.ts'

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'dsh-pet-registry-'))
}

describe('resolvePetManifest', () => {
  it('resolves a bare Codex manifest onto the hatch-pet contract defaults', () => {
    const entry = resolvePetManifest({
      id: 'otter',
      displayName: '水獭',
      spritesheetPath: 'spritesheet.webp',
    }, join(tmpdir(), 'otter'))
    expect(entry).toBeDefined()
    expect(entry!.id).toBe('otter')
    expect(entry!.kind).toBe('spritesheet')
    expect(entry!.cell).toEqual(DEFAULT_PET_CELL)
    expect(entry!.columns).toBe(8)
    expect(entry!.atlasRows).toBe(9)
    expect(entry!.rows).toEqual([...DEFAULT_FRAME_COUNTS])
    expect(entry!.atlasUrl).toBe('/pet/otter/spritesheet.webp')
    expect(entry!.manifestUrl).toBe('/pet/otter/pet.json')
    // Every track's frames/durations line up with its row count.
    expect(entry!.tracks.idle.frames.length).toBe(entry!.rows[0])
    expect(entry!.tracks.idle.durations.length).toBe(entry!.rows[0])
    expect(entry!.tracks.jumping.loop).toBe(false)
    expect(entry!.tracks.jumping.fallback).toBe('idle')
    expect(entry!.tracks.failed.loop).toBe(false)
    expect(entry!.tracks.running.loop).toBe(true)
    // Spritesheet entries carry no webp state/transition tables.
    expect(entry!.states).toBeUndefined()
    expect(entry!.transitions).toBeUndefined()
  })

  it('marks v2 (spriteVersionNumber 2) atlases with 11 rows', () => {
    const entry = resolvePetManifest({
      id: 'firefly',
      displayName: 'Firefly',
      spritesheetPath: 'spritesheet.webp',
      spriteVersionNumber: 2,
    }, join(tmpdir(), 'firefly'))
    expect(entry).toBeDefined()
    // v2 atlases carry 11 rows: the 9 animation rows plus 2 look rows.
    expect(entry!.atlasRows).toBe(11)
    // The 9 animation rows still resolve the hatch-pet contract.
    expect(entry!.rows).toEqual([...DEFAULT_FRAME_COUNTS])
    expect(entry!.tracks.idle.frames.length).toBe(entry!.rows[0])
  })

  it('keeps the legacy whale-girl frame counts and its own durations', () => {
    const entry = resolvePetManifest({
      id: 'whale-girl',
      displayName: '鲸鱼娘',
      spritesheetPath: 'spritesheet.webp',
      frames: [6, 8, 8, 4, 5, 8, 6, 6, 6],
      tracks: { idle: { durations: [400, 400, 500, 400, 400, 500] } },
    }, join(tmpdir(), 'whale'))
    expect(entry!.rows).toEqual([6, 8, 8, 4, 5, 8, 6, 6, 6])
    expect(entry!.tracks.idle.durations).toEqual([400, 400, 500, 400, 400, 500])
    // Non-overridden tracks keep the contract rhythm.
    expect(entry!.tracks['running-right'].durations.length).toBe(8)
  })

  it('normalizes valid per-scene animation sequences', () => {
    const entry = resolvePetManifest({
      id: 'whale-girl',
      displayName: '鲸鱼娘',
      spritesheetPath: 'spritesheet.webp',
      sequences: {
        thinking: ['running', 'running-right', 'running', 'running-left', 'waiting'],
      },
    }, join(tmpdir(), 'whale'))
    expect(entry!.sequences).toEqual({
      thinking: ['running', 'running-right', 'running', 'running-left', 'waiting'],
    })
  })

  it('drops invalid or undersized per-scene animation sequences', () => {
    const warnings: string[] = []
    const entry = resolvePetManifest({
      id: 'whale-girl',
      displayName: '鲸鱼娘',
      spritesheetPath: 'spritesheet.webp',
      sequences: {
        waiting: ['waiting', 'idle'],
        thinking: ['running', 'bogus', 'running', 'running-left', 'waiting'],
      },
    }, join(tmpdir(), 'whale'), { warnings })
    expect(entry!.sequences).toBeUndefined()
    expect(warnings).toContain('manifest whale-girl: sequence waiting must contain at least 5 animations')
    expect(warnings).toContain('manifest whale-girl: sequence thinking contains unknown animation "bogus"')
  })

  it('cycles short override durations up to the row frame count', () => {
    const entry = resolvePetManifest({
      id: 'fox',
      displayName: '狐狸',
      spritesheetPath: 'atlas.png',
      frames: [4, 4, 4, 4, 4, 4, 4, 4, 4],
      tracks: { idle: { durations: [200, 300] } },
    }, join(tmpdir(), 'fox'))
    expect(entry!.tracks.idle.durations).toEqual([200, 300, 200, 300])
    expect(entry!.tracks.idle.frames).toEqual([0, 1, 2, 3])
  })

  it('rejects unsafe ids and spritesheet paths with warnings', () => {
    const warnings: string[] = []
    expect(resolvePetManifest({ id: 'Bad Id', displayName: 'x', spritesheetPath: 'a.webp' }, '/tmp', { warnings })).toBeUndefined()
    expect(resolvePetManifest({ id: 'ok', displayName: 'x', spritesheetPath: '../etc/passwd' }, '/tmp', { warnings })).toBeUndefined()
    expect(resolvePetManifest({ id: 'ok', displayName: 'x', spritesheetPath: '/absolute.webp' }, '/tmp', { warnings })).toBeUndefined()
    expect(warnings.length).toBe(3)
  })

  it('normalizes a manifest remarks block into per-pet pools', () => {
    const entry = resolvePetManifest({
      id: 'otter',
      displayName: '水獭',
      spritesheetPath: 'spritesheet.webp',
      remarks: {
        pet: '摸摸水獭的头',
        feed: ['小鱼干真香', ' 再来一条 '],
      },
    }, join(tmpdir(), 'otter'))
    expect(entry!.remarks).toEqual({ pet: ['摸摸水獭的头'], feed: ['小鱼干真香', '再来一条'] })
  })

  it('warns on malformed remarks slots but keeps the pet', () => {
    const warnings: string[] = []
    const entry = resolvePetManifest({
      id: 'fox',
      displayName: '狐狸',
      spritesheetPath: 'spritesheet.webp',
      remarks: { unknownSlot: ['x'], pet: [1, null] },
    }, join(tmpdir(), 'fox'), { warnings })
    expect(entry).toBeDefined()
    expect(entry!.remarks).toBeUndefined()
    expect(warnings.some(message => message.includes('unknown remarks slot'))).toBe(true)
    expect(warnings.some(message => message.includes('no usable lines'))).toBe(true)
  })
})

describe('loadPetRegistry', () => {
  it('ships the original and refined whale variants while keeping the original default', () => {
    const registry = loadPetRegistry({
      packageRoot: petPackageRoot(import.meta.url),
      petsDir: '',
    })

    expect(registry.entries.map(entry => entry.id)).toEqual([
      'whale-girl',
      'whale-girl-refined',
    ])
    expect(registry.byId('whale-girl')?.displayName).toBe('鲸鱼娘（原版）')
    expect(registry.byId('whale-girl-refined')?.displayName).toBe('鲸鱼娘（精致版）')
    expect(existsSync(petAtlasFile(registry.byId('whale-girl-refined')!))).toBe(true)
    expect(readFileSync(petAtlasFile(registry.byId('whale-girl')!)).equals(
      readFileSync(petAtlasFile(registry.byId('whale-girl-refined')!)),
    )).toBe(false)
    expect(registry.defaultEntry().id).toBe('whale-girl')
  })

  it('scans built-in assets, the custom pets dir, and composed extras with precedence', () => {
    const root = tempDir()
    try {
      const assets = join(root, 'assets')
      mkdirSync(join(assets, 'whale'), { recursive: true })
      writeFileSync(join(assets, 'whale', 'pet.json'), JSON.stringify({
        id: 'whale-girl', displayName: '鲸鱼娘', spritesheetPath: 'spritesheet.webp',
      }), 'utf8')
      const petsDir = join(root, 'pets')
      mkdirSync(join(petsDir, 'otter'), { recursive: true })
      writeFileSync(join(petsDir, 'otter', 'pet.json'), JSON.stringify({
        id: 'otter', displayName: '水獭', spritesheetPath: 'spritesheet.webp',
      }), 'utf8')
      // A broken manifest is skipped with a warning, never thrown.
      mkdirSync(join(petsDir, 'broken'), { recursive: true })
      writeFileSync(join(petsDir, 'broken', 'pet.json'), '{ not json', 'utf8')

      const registry = loadPetRegistry({ packageRoot: root, petsDir })
      expect(registry.entries.map(entry => entry.id)).toEqual(['whale-girl', 'otter'])
      expect(registry.defaultEntry().id).toBe('whale-girl')
      expect(registry.warnings.some(warning => warning.includes('broken'))).toBe(true)

      // A composed extra with the same id overrides the earlier sources.
      const overridden = loadPetRegistry({
        packageRoot: root,
        petsDir,
        extra: [{ id: 'whale-girl', displayName: '替换鲸', spritesheetPath: 'spritesheet.webp' }],
      })
      expect(overridden.byId('whale-girl')!.displayName).toBe('替换鲸')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('resolves a composed extra atlas to the real file (no doubled directory)', () => {
    const root = tempDir()
    try {
      // The atlas sits at <root>/pets/otter/spritesheet.webp.
      mkdirSync(join(root, 'pets', 'otter'), { recursive: true })
      writeFileSync(join(root, 'pets', 'otter', 'spritesheet.webp'), 'png', 'utf8')

      const registry = loadPetRegistry({
        packageRoot: root,
        petsDir: '',
        extra: [{ id: 'otter', displayName: '水獭', spritesheetPath: 'pets/otter/spritesheet.webp' }],
      })
      const entry = registry.byId('otter')
      expect(entry).toBeDefined()
      // dir is the spritesheet's parent; the stored path is its basename, so
      // joining them resolves to the real file instead of applying the
      // directory twice.
      expect(entry!.dir).toBe(join(root, 'pets', 'otter'))
      expect(entry!.spritesheetPath).toBe('spritesheet.webp')
      const atlas = petAtlasFile(entry!)
      expect(atlas).toBe(join(root, 'pets', 'otter', 'spritesheet.webp'))
      expect(existsSync(atlas)).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('defaults to the built-in pet even when custom pets sort first', () => {
    const root = tempDir()
    try {
      const petsDir = join(root, 'pets')
      mkdirSync(join(petsDir, 'aardvark'), { recursive: true })
      writeFileSync(join(petsDir, 'aardvark', 'pet.json'), JSON.stringify({
        id: 'aardvark', displayName: '鍦熻睔', spritesheetPath: 'spritesheet.webp',
      }), 'utf8')
      const registry = loadPetRegistry({ packageRoot: join(root, 'no-assets'), petsDir })
      expect(registry.defaultEntry().id).toBe('aardvark')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

describe('codexPetsDir', () => {
  it('honors CODEX_HOME and expands a leading tilde', () => {
    // Expected values join through the platform separator (POSIX on CI).
    expect(codexPetsDir({ CODEX_HOME: '/opt/codex' }, '/home/user')).toBe(join('/opt/codex', 'pets'))
    expect(codexPetsDir({ CODEX_HOME: '~/codex' }, '/home/user')).toBe(join('/home/user', 'codex', 'pets'))
    expect(codexPetsDir({}, '/home/user')).toBe(join('/home/user', '.codex', 'pets'))
  })
})

/**
 * Build a legal animated-webp manifest fixture: 10 cyclic states plus a few
 * transitions. The resolver accepts any number of transition keys (D13: all
 * 36 ship; the scheduler filters later), so a small sample exercises every
 * code path without bloating the test.
 */
function webpManifest(overrides: Partial<PetManifest> = {}): PetManifest {
  const states = {} as Record<JiangxiaoState, string>
  for (const state of JIANGXIAO_STATES) {
    states[state] = 'states/' + state + '.webp'
  }
  return {
    id: 'jiangxiao',
    displayName: '濮滄檽',
    kind: 'animated-webp',
    states,
    transitions: {
      'idle->thinking': { webp: 'transitions/idle-to-thinking.webp', durationMs: 300 },
      'thinking->idle': { webp: 'transitions/thinking-to-idle.webp', durationMs: 250 },
      'idle->working': { webp: 'transitions/idle-to-working.webp', durationMs: 320 },
    },
    ...overrides,
  }
}

describe('resolvePetManifest animated-webp', () => {
  it('resolves a legal webp manifest into a webp entry with state and transition URLs', () => {
    const entry = resolvePetManifest(webpManifest(), join(tmpdir(), 'jiangxiao'))
    expect(entry).toBeDefined()
    expect(entry!.id).toBe('jiangxiao')
    expect(entry!.kind).toBe('animated-webp')
    // Every state maps to a browser URL under the asset prefix.
    expect(entry!.states).toBeDefined()
    expect(entry!.states!.idle).toBe('/pet/jiangxiao/states/idle.webp')
    expect(entry!.states!.thinking).toBe('/pet/jiangxiao/states/thinking.webp')
    expect(entry!.states!.listening).toBe('/pet/jiangxiao/states/listening.webp')
    // Every transition carries a URL and its duration.
    expect(entry!.transitions).toBeDefined()
    expect(entry!.transitions!['idle->thinking']).toEqual({
      webp: '/pet/jiangxiao/transitions/idle-to-thinking.webp',
      durationMs: 300,
    })
    // Host-side paths are kept for the asset route.
    expect(entry!.statePaths).toBeDefined()
    expect(entry!.statePaths!.idle).toBe('states/idle.webp')
    expect(entry!.transitionPaths).toBeDefined()
    expect(entry!.transitionPaths!['idle->thinking']).toEqual({
      webp: 'transitions/idle-to-thinking.webp',
      durationMs: 300,
    })

    // End-to-end: production transitionKey format resolves the same entries.
    const table = entry!.transitions as unknown as TransitionTable
    expect(resolveTransition('idle', 'thinking', table, 'e2e-1').segments).toHaveLength(1)
    expect(resolveTransition('idle', 'thinking', table, 'e2e-1').segments[0]!.webp).toBe(
      '/pet/jiangxiao/transitions/idle-to-thinking.webp',
    )
    // Spritesheet geometry is filled with defaults so the PetDefinition shape
    // stays compatible; the browser half dispatches on 'kind'.
    expect(entry!.cell).toEqual(DEFAULT_PET_CELL)
    expect(entry!.columns).toBe(8)
    expect(entry!.rows).toEqual([...DEFAULT_FRAME_COUNTS])
  })

  it('exposes states and transitions through petEntryView', () => {
    const entry = resolvePetManifest(webpManifest(), join(tmpdir(), 'jiangxiao'))!
    const view = petEntryView(entry)
    expect(view.kind).toBe('animated-webp')
    expect(view.states).toBe(entry.states)
    expect(view.transitions).toBe(entry.transitions)
    // Host-only fields are stripped.
    expect((view as unknown as Record<string, unknown>).dir).toBeUndefined()
    expect((view as unknown as Record<string, unknown>).statePaths).toBeUndefined()
    expect((view as unknown as Record<string, unknown>).transitionPaths).toBeUndefined()
  })

  it('lists every declared webp file through petAssetFiles', () => {
    const entry = resolvePetManifest(webpManifest(), join(tmpdir(), 'jiangxiao'))!
    const files = petAssetFiles(entry)
    // 10 state webps + 3 transition webps.
    expect(files).toHaveLength(13)
    expect(files).toContain('states/idle.webp')
    expect(files).toContain('states/thinking.webp')
    expect(files).toContain('transitions/idle-to-thinking.webp')
    expect(files).toContain('transitions/thinking-to-idle.webp')
  })

  it('accepts all 36 transition keys without filtering (D13)', () => {
    // The resolver must not filter transition keys by reachability; the
    // scheduler (work item 03) owns that. Feed a mix of pet-reachable and
    // pet-unreachable keys and confirm every one survives.
    const transitions: Record<string, { webp: string; durationMs: number }> = {}
    const sample = [
      'idle->thinking', 'thinking->idle', 'idle->working', 'working->idle',
      'idle->replying', 'replying->idle', 'idle->error', 'error->idle',
      'idle->done', 'done->idle', 'idle->welcome', 'welcome->idle',
      'idle->listening', 'listening->idle', 'idle->reading', 'reading->idle',
      'idle->permission', 'permission->idle',
    ]
    for (const key of sample) {
      transitions[key] = { webp: 'transitions/' + key.replace('->', '-to-') + '.webp', durationMs: 200 }
    }
    const entry = resolvePetManifest(webpManifest({ transitions }), join(tmpdir(), 'jiangxiao'))!
    expect(entry).toBeDefined()
    expect(Object.keys(entry.transitionPaths!)).toHaveLength(sample.length)
    // Pet-unreachable keys (reading, permission) are kept by the resolver.
    expect(entry.transitionPaths!['idle->reading']).toBeDefined()
    expect(entry.transitionPaths!['idle->permission']).toBeDefined()

    // End-to-end: production scheduler resolves the same keys.
    const table = entry.transitions as unknown as TransitionTable
    expect(resolveTransition('idle', 'thinking', table, 'e2e-d13').segments).toHaveLength(1)
    expect(resolveTransition('thinking', 'idle', table, 'e2e-d13').segments).toHaveLength(1)
    expect(resolveTransition('idle', 'working', table, 'e2e-d13').segments).toHaveLength(1)
    // Same state: empty segments.
    expect(resolveTransition('idle', 'idle', table, 'e2e-d13').segments).toHaveLength(0)
  })

  it('rejects an unknown kind with a warning', () => {
    const warnings: string[] = []
    const entry = resolvePetManifest(
      { ...webpManifest(), kind: 'video-mp4' as unknown as 'animated-webp' },
      '/tmp',
      { warnings },
    )
    expect(entry).toBeUndefined()
    expect(warnings.some(message => message.includes('unknown kind'))).toBe(true)
  })

  it('rejects a missing states object', () => {
    const warnings: string[] = []
    const entry = resolvePetManifest(
      { id: 'jiangxiao', displayName: '濮滄檽', kind: 'animated-webp', transitions: {} },
      '/tmp',
      { warnings },
    )
    expect(entry).toBeUndefined()
    expect(warnings.some(message => message.includes('requires a states object'))).toBe(true)
  })

  it('rejects a missing transitions object', () => {
    const warnings: string[] = []
    const states = {} as Record<JiangxiaoState, string>
    for (const state of JIANGXIAO_STATES) states[state] = 'states/' + state + '.webp'
    const entry = resolvePetManifest(
      { id: 'jiangxiao', displayName: '濮滄檽', kind: 'animated-webp', states },
      '/tmp',
      { warnings },
    )
    expect(entry).toBeUndefined()
    expect(warnings.some(message => message.includes('requires a transitions object'))).toBe(true)
  })

  it('rejects when a state key is missing', () => {
    const warnings: string[] = []
    const states = {} as Record<JiangxiaoState, string>
    for (const state of JIANGXIAO_STATES) {
      if (state === 'listening') continue
      states[state] = 'states/' + state + '.webp'
    }
    const entry = resolvePetManifest(
      { id: 'jiangxiao', displayName: '濮滄檽', kind: 'animated-webp', states, transitions: { 'idle->thinking': { webp: 't.webp', durationMs: 100 } } },
      '/tmp',
      { warnings },
    )
    expect(entry).toBeUndefined()
    expect(warnings.some(message => message.includes('states.listening'))).toBe(true)
  })

  it('rejects an extra state key (typo surfacing)', () => {
    const warnings: string[] = []
    const states = {} as Record<JiangxiaoState, string>
    for (const state of JIANGXIAO_STATES) states[state] = 'states/' + state + '.webp'
    ;(states as Record<string, string>).listenting2 = 'states/listening2.webp'
    const entry = resolvePetManifest(
      { id: 'jiangxiao', displayName: '濮滄檽', kind: 'animated-webp', states, transitions: { 'idle->thinking': { webp: 't.webp', durationMs: 100 } } },
      '/tmp',
      { warnings },
    )
    expect(entry).toBeUndefined()
    expect(warnings.some(message => message.includes('not a known JiangxiaoState'))).toBe(true)
  })

  it('rejects path traversal in a state file', () => {
    const warnings: string[] = []
    const states = {} as Record<JiangxiaoState, string>
    for (const state of JIANGXIAO_STATES) states[state] = 'states/' + state + '.webp'
    states.idle = '../etc/passwd'
    const entry = resolvePetManifest(
      { id: 'jiangxiao', displayName: '濮滄檽', kind: 'animated-webp', states, transitions: { 'idle->thinking': { webp: 't.webp', durationMs: 100 } } },
      '/tmp',
      { warnings },
    )
    expect(entry).toBeUndefined()
    expect(warnings.some(message => message.includes('states.idle') && message.includes('safe relative path'))).toBe(true)
  })

  it('rejects path traversal in a transition webp', () => {
    const warnings: string[] = []
    const entry = resolvePetManifest(
      {
        ...webpManifest(),
        transitions: { 'idle->thinking': { webp: '/absolute.webp', durationMs: 100 } },
      },
      '/tmp',
      { warnings },
    )
    expect(entry).toBeUndefined()
    expect(warnings.some(message => message.includes('transition') && message.includes('safe relative path'))).toBe(true)
  })

  it('rejects a non-positive transition duration', () => {
    const warnings: string[] = []
    const entry = resolvePetManifest(
      {
        ...webpManifest(),
        transitions: { 'idle->thinking': { webp: 't.webp', durationMs: 0 } },
      },
      '/tmp',
      { warnings },
    )
    expect(entry).toBeUndefined()
    expect(warnings.some(message => message.includes('durationMs') && message.includes('positive'))).toBe(true)
  })

  it('rejects an empty transitions table', () => {
    const warnings: string[] = []
    const entry = resolvePetManifest(
      { ...webpManifest(), transitions: {} },
      '/tmp',
      { warnings },
    )
    expect(entry).toBeUndefined()
    expect(warnings.some(message => message.includes('transitions is empty'))).toBe(true)
  })

  it('rejects an unsafe id (shared guard with spritesheet)', () => {
    const warnings: string[] = []
    const entry = resolvePetManifest(
      { ...webpManifest(), id: 'Bad Id' },
      '/tmp',
      { warnings },
    )
    expect(entry).toBeUndefined()
    expect(warnings.some(message => message.includes('lowercase kebab id'))).toBe(true)
  })
})

describe('resolvePetManifest spritesheet regression', () => {
  it('explicit kind: "spritesheet" resolves through the spritesheet path', () => {
    const entry = resolvePetManifest({
      id: 'otter',
      displayName: '水獭',
      kind: 'spritesheet',
      spritesheetPath: 'spritesheet.webp',
    }, join(tmpdir(), 'otter'))
    expect(entry).toBeDefined()
    expect(entry!.kind).toBe('spritesheet')
    expect(entry!.states).toBeUndefined()
    expect(entry!.transitions).toBeUndefined()
    expect(entry!.statePaths).toBeUndefined()
    expect(entry!.transitionPaths).toBeUndefined()
  })

  it('omitting kind defaults to spritesheet (legacy compatibility)', () => {
    const entry = resolvePetManifest({
      id: 'whale-girl',
      displayName: '鲸鱼娘',
      spritesheetPath: 'spritesheet.webp',
    }, join(tmpdir(), 'whale'))
    expect(entry).toBeDefined()
    expect(entry!.kind).toBe('spritesheet')
  })

  it('petAssetFiles returns the single atlas for spritesheet entries', () => {
    const entry = resolvePetManifest({
      id: 'otter',
      displayName: '水獭',
      spritesheetPath: 'atlas.png',
    }, join(tmpdir(), 'otter'))!
    expect(petAssetFiles(entry)).toEqual(['atlas.png'])
  })
})
