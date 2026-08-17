// @vitest-environment jsdom
/**
 * PetSprite rename-box keyboard handling. The rename input must treat
 * Enter/Escape keydowns that arrive during IME composition (candidate
 * selection) as composition input, never as submit/cancel (issue #89).
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PetSprite, type PetSpriteProps } from './PetSprite.tsx'
import { t } from './locales.ts'
import type { PetStateView } from '../service.ts'
import type { PetDefinition, PetTrackDef } from '../registry.ts'
import type { JiangxiaoState } from '../registry.ts'
import type { PetAnimation } from '../state.ts'

/**
 * Shared spritesheet geometry and track definitions. Both the spritesheet and
 * webp fixture pets share the same cell size, grid, frame durations, and track
 * structure; only the identity fields (id/displayName/kind/states/transitions)
 * differ between the two.
 */
function spritesheetTracks(): {
  track: (frames: number[], durations: number[], loop?: boolean, fallback?: PetAnimation) => PetTrackDef
  tracks: Record<string, PetTrackDef>
  cell: { width: number; height: number }
  columns: number
  rows: number[]
} {
  const track = (frames: number[], durations: number[], loop = true, fallback?: PetAnimation): PetTrackDef => ({
    frames,
    durations,
    loop,
    ...(fallback === undefined ? {} : { fallback }),
  })
  return {
    track,
    tracks: {
      idle: track([0, 1, 2, 3, 4, 5], [400, 400, 400, 400, 400, 400]),
      'running-right': track([0, 1, 2, 3, 4, 5, 6, 7], [225, 225, 225, 225, 225, 225, 225, 225]),
      'running-left': track([0, 1, 2, 3, 4, 5, 6, 7], [225, 225, 225, 225, 225, 225, 225, 225]),
      waving: track([0, 1, 2, 3], [350, 350, 350, 350]),
      jumping: track([0, 1, 2, 3, 4], [300, 300, 300, 300, 300], false, 'idle'),
      failed: track([0, 1, 2, 3, 4, 5, 6, 7], [450, 450, 450, 450, 450, 450, 450, 450], false, 'idle'),
      waiting: track([0, 1, 2, 3, 4, 5], [450, 450, 450, 450, 450, 450]),
      running: track([0, 1, 2, 3, 4, 5], [250, 250, 250, 250, 250, 250]),
      review: track([0, 1, 2, 3, 4, 5], [550, 550, 550, 550, 550, 550]),
    },
    cell: { width: 192, height: 208 },
    columns: 8,
    rows: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  }
}

/** A minimal pet definition (geometry + tracks) as served by the host. */
function petDefinition(): PetDefinition {
  const { track, tracks, cell, columns, rows } = spritesheetTracks()
  return {
    id: 'whale-girl',
    displayName: '鲸鱼娘',
    description: '测试用鲸鱼娘',
    kind: 'spritesheet',
    cell,
    columns,
    rows,
    tracks,
    atlasUrl: '/pet/whale-girl/spritesheet.webp',
    manifestUrl: '/pet/whale-girl/pet.json',
  }
}

/** Snapshot fixture: idle whale girl named 泡泡. */
const snapshot: PetStateView = {
  animation: 'idle',
  phase: 'idle',
  sessionActive: true,
  affinity: {
    points: 0,
    rank: '幼鲸',
    rankEmoji: '*',
    pets: 0,
    feeds: 0,
    turns: 0,
    petCooldown: false,
    feedCooldown: false,
  },
  display: { visible: true, size: 160, right: 24, bottom: 20 },
  pet: { id: 'whale-girl', displayName: '鲸鱼娘', description: '测试用鲸鱼娘' },
  name: '泡泡',
  treats: { stocked: 3, max: 5 },
}

beforeAll(() => {
  // Deterministic zh copy for button labels.
  document.documentElement.lang = 'zh'
  // Prefer-reduced-motion matches: the sprite loop then never schedules
  // requestAnimationFrame, keeping the test free of animation timers.
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})

afterEach(() => {
  cleanup()
})

/** Render the pet with mocked callbacks; returns the rename and open spys. */
function renderPet(overrides: Partial<PetSpriteProps> = {}): {
  onRename: ReturnType<typeof vi.fn>
  onOpenSession: ReturnType<typeof vi.fn>
} {
  const onRename = vi.fn()
  const onOpenSession = vi.fn()
  const props: PetSpriteProps = {
    snapshot,
    definition: petDefinition(),
    display: snapshot.display,
    feedback: null,
    onPet: vi.fn(),
    onFeed: vi.fn(),
    onHide: vi.fn(),
    onDragEnd: vi.fn(),
    onRename,
    onOpenSession,
    onFeedbackDone: vi.fn(),
    t,
    ...overrides,
  }
  render(<PetSprite {...props} />)
  return { onRename, onOpenSession }
}

/** Hover the sprite to open the panel, then click the rename button. */
function openRename(): HTMLInputElement {
  fireEvent.pointerOver(screen.getByRole('button', { name: '鲸鱼娘' }))
  fireEvent.click(screen.getByText('改名'))
  return screen.getByPlaceholderText('输入新名字') as HTMLInputElement
}

/**
 * Fire a keydown whose native event reports an active IME composition, the
 * way Chromium marks Enter/Escape pressed to select or dismiss a candidate.
 */
function fireComposingKeydown(target: Element, key: string): void {
  fireEvent.compositionStart(target)
  const native = new window.KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    isComposing: true,
  })
  // jsdom does not implement KeyboardEvent.isComposing, so pin the flag on
  // the dispatched native event exactly as the browser would report it.
  Object.defineProperty(native, 'isComposing', { value: true })
  fireEvent(target, native)
  fireEvent.compositionEnd(target)
}

describe('PetSprite rename input', () => {
  it('submits the draft on Enter outside composition', () => {
    const { onRename } = renderPet()
    const input = openRename()
    fireEvent.change(input, { target: { value: ' 小鲸 ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledTimes(1)
    expect(onRename).toHaveBeenCalledWith('小鲸')
    expect(screen.queryByPlaceholderText('输入新名字')).toBeNull()
  })

  it('ignores Enter while an IME composition is active', () => {
    const { onRename } = renderPet()
    const input = openRename()
    fireEvent.change(input, { target: { value: '泡泡酱' } })
    fireComposingKeydown(input, 'Enter')
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('输入新名字')).toBe(input)
    expect(input.value).toBe('泡泡酱')
    // Once the composition is over, Enter submits normally.
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('泡泡酱')
    expect(screen.queryByPlaceholderText('输入新名字')).toBeNull()
  })

  it('ignores Escape while an IME composition is active', () => {
    const { onRename } = renderPet()
    const input = openRename()
    fireEvent.change(input, { target: { value: 'abc' } })
    fireComposingKeydown(input, 'Escape')
    expect(screen.getByPlaceholderText('输入新名字')).toBe(input)
    // A real Escape outside composition closes the box without renaming.
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('输入新名字')).toBeNull()
  })
})

describe('PetSprite status bubble', () => {
  const workingSnapshot: PetStateView = {
    ...snapshot,
    animation: 'running',
    phase: 'thinking',
    bubble: '正在思考',
  }

  it('renders host activity when no interaction feedback is active', () => {
    renderPet({ snapshot: workingSnapshot })
    expect(screen.queryByText('正在思考')).not.toBeNull()
  })

  it('lets transient interaction feedback replace host activity', () => {
    renderPet({
      snapshot: workingSnapshot,
      feedback: { text: '摸摸成功', kind: 'pet', at: 1 },
    })
    expect(screen.queryByText('摸摸成功')).not.toBeNull()
    expect(screen.queryByText('正在思考')).toBeNull()
  })

  it('renders one bubble per concurrent session without duplicating the global bubble', () => {
    renderPet({
      snapshot: {
        ...workingSnapshot,
        bubble: '正在思考',
        sessions: [
          { sessionId: 's-a', animation: 'running', phase: 'thinking', bubble: '正在思考' },
          { sessionId: 's-b', animation: 'running-right', phase: 'tool', bubble: '正在使用 grep' },
        ],
      },
    })
    // The display session appears in the stack exactly once: the legacy
    // single bubble is not rendered on top of the session list.
    expect(screen.getAllByText('正在思考')).toHaveLength(1)
    expect(screen.queryByText('正在使用 grep')).not.toBeNull()
  })

  it('lets feedback replace the whole session bubble stack', () => {
    renderPet({
      snapshot: {
        ...workingSnapshot,
        sessions: [
          { sessionId: 's-a', animation: 'running', phase: 'thinking', bubble: '正在思考' },
          { sessionId: 's-b', animation: 'running-right', phase: 'tool', bubble: '正在使用 grep' },
        ],
      },
      feedback: { text: '摸摸成功', kind: 'pet', at: 1 },
    })
    expect(screen.queryByText('摸摸成功')).not.toBeNull()
    expect(screen.queryByText('正在思考')).toBeNull()
    expect(screen.queryByText('正在使用 grep')).toBeNull()
  })

  it('clicking a session bubble navigates to that session', () => {
    const { onOpenSession } = renderPet({
      snapshot: {
        ...workingSnapshot,
        bubble: '正在思考',
        sessions: [
          { sessionId: 's-a', animation: 'running', phase: 'thinking', bubble: '正在思考' },
          { sessionId: 's-b', animation: 'running-right', phase: 'tool', bubble: '正在使用 grep' },
        ],
      },
    })
    fireEvent.click(screen.getByText('正在使用 grep'))
    expect(onOpenSession).toHaveBeenCalledTimes(1)
    expect(onOpenSession).toHaveBeenCalledWith('s-b')
    fireEvent.click(screen.getByText('正在思考'))
    expect(onOpenSession).toHaveBeenCalledTimes(2)
    expect(onOpenSession).toHaveBeenCalledWith('s-a')
    // Petting stays on the sprite only: bubble clicks must not pet.
  })

  it('clicking the legacy single bubble does not navigate (no session identity)', () => {
    const { onOpenSession } = renderPet({ snapshot: workingSnapshot })
    fireEvent.click(screen.getByText('正在思考'))
    expect(onOpenSession).not.toHaveBeenCalled()
  })

  it('keeps session bubbles visible and clickable while the hover panel is open', () => {
    // Regression: the panel used to occupy the same region as the bubble
    // stack and hide it on hover, so reaching a bubble was impossible. The
    // panel now opens beside the sprite and the stack stays interactive.
    const { onOpenSession } = renderPet({
      snapshot: {
        ...workingSnapshot,
        sessions: [
          { sessionId: 's-a', animation: 'running', phase: 'thinking', bubble: '正在思考' },
          { sessionId: 's-b', animation: 'running-right', phase: 'tool', bubble: '正在使用 grep' },
        ],
      },
    })
    fireEvent.pointerOver(screen.getByRole('button', { name: '鲸鱼娘' }))
    // The hover panel is open...
    expect(screen.queryByText('改名')).not.toBeNull()
    // ...and the bubbles are still there, still clickable.
    expect(screen.getByText('正在使用 grep')).not.toBeNull()
    fireEvent.click(screen.getByText('正在使用 grep'))
    expect(onOpenSession).toHaveBeenCalledWith('s-b')
  })
})

describe('PetSprite definition-driven render', () => {
  it('labels the sprite with the pet display name', () => {
    renderPet()
    expect(screen.queryByRole('button', { name: '鲸鱼娘' })).not.toBeNull()
  })

  it('shows the renamed snapshot name in the hover panel', () => {
    renderPet()
    fireEvent.pointerOver(screen.getByRole('button', { name: '鲸鱼娘' }))
    expect(screen.queryByText('泡泡')).not.toBeNull()
  })
})

// ---- animated-webp fixture helpers ----------------------------------------

/** A minimal webp pet definition (animated-webp kind). */
function webpPetDefinition(includeTransitions: boolean): PetDefinition {
  const { tracks, cell, columns, rows } = spritesheetTracks()
  const states: Record<JiangxiaoState, string> = {
    idle: '/pet/jiangxiao/states/idle.webp',
    thinking: '/pet/jiangxiao/states/thinking.webp',
    reading: '/pet/jiangxiao/states/reading.webp',
    replying: '/pet/jiangxiao/states/replying.webp',
    working: '/pet/jiangxiao/states/working.webp',
    error: '/pet/jiangxiao/states/error.webp',
    welcome: '/pet/jiangxiao/states/welcome.webp',
    done: '/pet/jiangxiao/states/done.webp',
    permission: '/pet/jiangxiao/states/permission.webp',
    listening: '/pet/jiangxiao/states/listening.webp',
  }
  const transitions: Record<string, { webp: string; durationMs: number }> | undefined = includeTransitions
    ? {
        'idle->thinking': { webp: '/pet/jiangxiao/transitions/idle-thinking.webp', durationMs: 500 },
        'idle->listening': { webp: '/pet/jiangxiao/transitions/idle-listening.webp', durationMs: 500 },
        'thinking->listening': { webp: '/pet/jiangxiao/transitions/thinking-listening.webp', durationMs: 500 },
      }
    : undefined
  return {
    id: 'jiangxiao',
    displayName: '墨染',
    description: '测试用墨染',
    kind: 'animated-webp',
    cell,
    columns,
    rows,
    tracks,
    atlasUrl: '/pet/jiangxiao/spritesheet.webp',
    manifestUrl: '/pet/jiangxiao/pet.json',
    states,
    ...(transitions === undefined ? {} : { transitions }),
  }
}

/** A snapshot fixture for the webp pet (idle 墨染). */
const webpSnapshot: PetStateView = {
  animation: 'idle',
  phase: 'idle',
  sessionActive: true,
  affinity: {
    points: 0,
    rank: '墨染',
    rankEmoji: '*',
    pets: 0,
    feeds: 0,
    turns: 0,
    petCooldown: false,
    feedCooldown: false,
  },
  display: { visible: true, size: 160, right: 24, bottom: 20 },
  pet: { id: 'jiangxiao', displayName: '墨染', description: '测试用墨染' },
  name: '墨染',
  treats: { stocked: 3, max: 5 },
}

/** Render a webp pet with mocked callbacks; returns helpers for re-render. */
function renderWebpPet(
  overrides: Partial<PetSpriteProps> = {},
): {
  onRename: ReturnType<typeof vi.fn>
  onOpenSession: ReturnType<typeof vi.fn>
  rerender: (newOverrides: Partial<PetSpriteProps>) => void
} {
  const onRename = vi.fn()
  const onOpenSession = vi.fn()
  const makeProps = (extra: Partial<PetSpriteProps> = {}): PetSpriteProps => ({
    snapshot: { ...webpSnapshot },
    definition: webpPetDefinition(false), // no transitions by default
    display: { visible: true, size: 160, right: 24, bottom: 20 },
    feedback: null,
    onPet: vi.fn(),
    onFeed: vi.fn(),
    onHide: vi.fn(),
    onDragEnd: vi.fn(),
    onRename,
    onOpenSession,
    onFeedbackDone: vi.fn(),
    t,
    ...extra,
  })
  const { rerender: rawRerender } = render(<PetSprite {...makeProps(overrides)} />)
  return {
    onRename,
    onOpenSession,
    rerender: (newOverrides: Partial<PetSpriteProps>) => {
      rawRerender(<PetSprite {...makeProps(newOverrides)} />)
    },
  }
}

// ---- animated-webp rendering tests ----------------------------------------

describe('PetSprite webp rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders an img element for animated-webp pets', () => {
    renderWebpPet()
    const img = screen.queryByRole('button', { name: '墨染' })
    expect(img).not.toBeNull()
    expect(img!.tagName).toBe('IMG')
    // The src should be set to the idle state webp
    expect(img!.getAttribute('src')).toBe('/pet/jiangxiao/states/idle.webp')
  })

  it('shows opaque placeholder with background color before webp loads', () => {
    renderWebpPet()
    const img = screen.getByRole('button', { name: '墨染' }) as HTMLImageElement
    // Placeholder: opacity 1 (fully opaque) with a background color
    expect(img.style.opacity).toBe('1')
    expect(img.style.backgroundColor).toBeTruthy()
    // Transition property is preserved for fade-in
    expect(img.style.transition).toContain('opacity')
  })

  it('updates the webp src when animation changes', () => {
    const { rerender } = renderWebpPet()
    const img = screen.getByRole('button', { name: '墨染' }) as HTMLImageElement

    // Initial src is idle.webp
    expect(img.src).toContain('/pet/jiangxiao/states/idle.webp')

    // Re-render with running animation (maps to 'thinking' via petToJiangxiao)
    rerender({
      snapshot: { ...webpSnapshot, animation: 'running' },
    })

    // After re-render, the src should update to thinking.webp
    // (no transitions defined, so crossfade fallback sets the loop state directly)
    const updatedImg = screen.getByRole('button', { name: '墨染' }) as HTMLImageElement
    expect(updatedImg.src).toContain('/pet/jiangxiao/states/thinking.webp')
  })

  it('handles rapid animation switching without stale transitions', () => {
    const { rerender } = renderWebpPet({
      definition: webpPetDefinition(true), // with transitions for segment playback
    })
    const img = screen.getByRole('button', { name: '墨染' }) as HTMLImageElement

    // Initial: idle
    expect(img.src).toContain('/pet/jiangxiao/states/idle.webp')

    // Switch to running (thinking state) - starts a transition sequence
    rerender({
      snapshot: { ...webpSnapshot, animation: 'running' },
    })

    // Quickly switch to waiting (listening state) before timers fire
    // The effect cleanup from the previous run should clear pending timeouts
    rerender({
      snapshot: { ...webpSnapshot, animation: 'waiting' },
    })

    // Run all pending timers
    vi.runAllTimers()

    // The final src should be listening.webp (waiting maps to listening)
    const updatedImg = screen.getByRole('button', { name: '墨染' }) as HTMLImageElement
    expect(updatedImg.src).toContain('/pet/jiangxiao/states/listening.webp')
  })
})
