/**
 * Pet sprite companion component — the browser half's centerpiece. Renders a
 * fixed-position floating sprite (React portal onto document.body), plays
 * the track matching the host animation snapshot, and exposes the
 * interaction surface: click to pet, hover panel with feed/rename/hide, drag
 * to reposition (persisted via setConfig). Everything visual comes from the
 * pet definition the host serves ('/api/pet/pets' + the state snapshot's
 * pet id), so one component renders every registry entry.
 * @module @linxin666/dsh-pet/client/PetSprite
 */

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactPortal } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { PetDisplayConfig } from '../persist.ts'
import type { PetStateView } from '../service.ts'
import type { PetDefinition } from '../registry.ts'
import type { PetFeedback } from './pet-store.ts'
import { framePosition, rowOfTrack, trimTrack } from './spritesheet.ts'
import { petToJiangxiao, resolveTransition } from '../scheduler.ts'
import type { PetAnimation } from '../state.ts'
import { NS } from './locales.ts'
import styles from './pet.module.css'

/** Props injected by the plugin apply body (store actions + locale). */
export interface PetSpriteProps {
  /** Latest host snapshot; null while loading. */
  snapshot: PetStateView | null
  /** The selected pet's registry definition (atlas URL + geometry + tracks). */
  definition: PetDefinition
  /** Display configuration (persisted by the host). */
  display: PetDisplayConfig
  /** Active reaction bubble, if any. */
  feedback: PetFeedback | null
  /** Pet the sprite (click). */
  onPet: () => void
  /** Feed the sprite (panel button). */
  onFeed: () => void
  /** Hide the sprite (panel button). */
  onHide: () => void
  /** Persist a drag position. */
  onDragEnd: (right: number, bottom: number) => void
  /** Rename the selected pet (persisted by the host). */
  onRename: (name: string) => void
  /** Navigate to the session one status bubble reports on. */
  onOpenSession: (sessionId: string) => void
  /** Clear the reaction bubble (after its CSS animation). */
  onFeedbackDone: () => void
  /** Locale translate seat (namespace-bound). */
  t: TranslateNS<typeof NS>
}

/** Clamp a drag offset inside the viewport with a margin. */
function clampOffset(value: number, max: number): number {
  return Math.max(0, Math.min(max, value))
}

/**
 * The floating pet. The spritesheet frame advances on requestAnimationFrame
 * with per-frame durations from the definition's tracks; the atlas image is
 * loaded once and the background position is written straight to the sprite
 * element (no per-frame React state).
 */
export function PetSprite(props: PetSpriteProps): ReactPortal {
  const { snapshot, definition, display, feedback } = props
  const spriteRef = useRef<HTMLDivElement | null>(null)
  const floatRef = useRef<HTMLDivElement | null>(null)
  const [imageReady, setImageReady] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [dragPos, setDragPos] = useState<{ right: number; bottom: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; right: number; bottom: number } | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const frameRef = useRef<{ track: PetAnimation | null; index: number; elapsed: number }>({
    track: null,
    index: 0,
    elapsed: 0,
  })

  // Kind dispatch: 'animated-webp' takes the <img> + scheduler path; any
  // other value (including 'spritesheet' and the legacy omitted kind) falls
  // back to the existing spritesheet frame loop. The spritesheet path is
  // untouched under `isWebp === false`, so legacy pets regress nothing.
  const isWebp = definition.kind === 'animated-webp'

  // ---- animated-webp render state ---------------------------------------
  // The current <img> src (a loop-state webp or a transition-segment webp)
  // plus a loaded flag driving the placeholder fade-in (D14). The play key
  // invalidates a stale transition when a newer target arrives mid-play;
  // prevAnimationRef feeds the scheduler with the from-state.
  const initialWebpSrc: string | null = isWebp && definition.states !== undefined
    ? definition.states[petToJiangxiao(snapshot?.animation ?? 'idle')]
    : null
  const [webpSrc, setWebpSrc] = useState<string | null>(initialWebpSrc)
  const [webpLoaded, setWebpLoaded] = useState(false)
  const webpPlayKeyRef = useRef<string | null>(null)
  const webpTimeoutsRef = useRef<readonly number[]>([])
  const prevAnimationRef = useRef<PetAnimation>(snapshot?.animation ?? 'idle')
  /** Swap the webp src and reset the loaded flag in one batch (no flicker). */
  const setWebp = (src: string): void => {
    setWebpSrc(src)
    setWebpLoaded(false)
  }

  const cell = definition.cell
  const columns = definition.columns
  const rows = definition.rows
  const tracks = definition.tracks

  // Load the atlas once; the definition carries the authoritative per-row
  // frame counts and per-track durations, so nothing else is fetched.
  // Skipped on the animated-webp path (per-state webps load instead).
  useEffect(() => {
    if (isWebp) return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setImageReady(true)
    }
    img.src = definition.atlasUrl
    return () => {
      cancelled = true
      img.onload = null
    }
  }, [definition.atlasUrl, isWebp])

  // Frame loop: advance the current track and write background-position.
  // Offsets must be in SCALED coordinates (background-position applies to the
  // scaled background image), so the current sprite scale rides a ref that
  // the loop reads every tick. Under prefers-reduced-motion the sprite holds
  // its track's first frame instead of animating (presentation-only; the
  // animation state machine is untouched).
  const spriteScale = display.size / cell.height
  const animation = snapshot?.animation ?? 'idle'
  const scaleRef = useRef(spriteScale)
  scaleRef.current = spriteScale
  useEffect(() => {
    if (isWebp) return // webp path plays <img> webps; no rAF frame loop.
    const reduceMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true
    const row = rowOfTrack(animation)
    const track = trimTrack(tracks[animation], rows[row] ?? tracks[animation].frames.length)
    // Paint one static sprite frame up front either way, so the pet is never
    // blank while the loop heat-up runs.
    const leadCol = track.frames[0]!
    const lead = framePosition(cell, columns, row, leadCol, scaleRef.current)
    if (spriteRef.current !== null) {
      spriteRef.current.style.backgroundPosition = lead.x + 'px ' + lead.y + 'px'
    }
    if (reduceMotion) return
    let raf = 0
    let last = performance.now()
    const tick = (ts: number): void => {
      const delta = ts - last
      last = ts
      // Trim the track to the row's real frame count (transparent cells
      // would render as a vanishing pet).
      const row = rowOfTrack(animation)
      const track = trimTrack(tracks[animation], rows[row] ?? tracks[animation].frames.length)
      const st = frameRef.current
      if (st.track !== animation) {
        st.track = animation
        st.index = 0
        st.elapsed = 0
      }
      st.elapsed += delta
      const maxIndex = track.frames.length - 1
      while (st.elapsed >= (track.durations[st.index] ?? 0) && st.index < maxIndex) {
        st.elapsed -= track.durations[st.index] ?? 0
        st.index += 1
      }
      if (st.elapsed >= (track.durations[st.index] ?? 0)) {
        if (track.loop) {
          st.elapsed = 0
          st.index = 0
        } else {
          st.index = maxIndex // hold the final frame; the host switches tracks
        }
      }
      const col = track.frames[st.index]!
      const pos = framePosition(cell, columns, row, col, scaleRef.current)
      if (spriteRef.current !== null) {
        spriteRef.current.style.backgroundPosition = pos.x + 'px ' + pos.y + 'px'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animation, cell, columns, rows, tracks, isWebp])

  // Auto-clear the feedback bubble after its CSS animation. The callback
  // rides a ref so re-renders never reset the timer: the 2s poll rebuilds
  // `props` every tick, and depending on it would starve the timeout.
  const feedbackDoneRef = useRef(props.onFeedbackDone)
  feedbackDoneRef.current = props.onFeedbackDone
  useEffect(() => {
    if (feedback === null) return
    const timer = window.setTimeout(() => feedbackDoneRef.current(), 2600)
    return () => window.clearTimeout(timer)
  }, [feedback])

  // ---- animated-webp transition -------------------------------------------
  // When the animation changes, resolve the transition through the scheduler
  // and play segments sequentially. Key invalidation via effect cleanup
  // cancels stale timeouts when a newer target arrives mid-play.
  useEffect(() => {
    if (!isWebp) return

    const prevAnimation = prevAnimationRef.current
    prevAnimationRef.current = animation

    const from = petToJiangxiao(prevAnimation)
    const to = petToJiangxiao(animation)

    // Pre-fetch the target state's loop webp so the final swap is instant.
    if (definition.states !== undefined) {
      new Image().src = definition.states[to]
    }

    // Same state — ensure the loop webp is set (initial render).
    if (from === to) {
      if (definition.states !== undefined) {
        setWebp(definition.states[to])
      }
      return
    }

    // Resolve the transition (hub-routed through idle).
    const resolved = resolveTransition(from, to, definition.transitions ?? {})
    webpPlayKeyRef.current = resolved.key

    if (resolved.segments.length === 0) {
      // No transition material; crossfade directly to the target loop.
      if (definition.states !== undefined) {
        setWebp(definition.states[resolved.final])
      }
      return
    }

    // Play segments sequentially. Each segment's webp is pre-fetched by the
    // scheduler's caller (the segment webp was already loaded upstream), so
    // just swap the src without resetting the loaded flag.
    const timeouts: number[] = []
    let cumulativeDelay = 0

    for (const segment of resolved.segments) {
      const delay = cumulativeDelay
      const timeout = window.setTimeout(() => {
        setWebpSrc(segment.webp)
      }, delay)
      timeouts.push(timeout)
      cumulativeDelay += segment.durationMs
    }

    // After all segments complete, settle on the target loop state.
    const finalTimeout = window.setTimeout(() => {
      if (definition.states !== undefined) {
        setWebp(definition.states[resolved.final])
      }
    }, cumulativeDelay)
    timeouts.push(finalTimeout)

    webpTimeoutsRef.current = timeouts

    return () => {
      const ids = webpTimeoutsRef.current
      webpTimeoutsRef.current = []
      ids.forEach(id => window.clearTimeout(id))
    }
  }, [animation, isWebp, definition.states, definition.transitions])

  // Dragging: pointer events on the sprite; position is right/bottom based.
  // `draggedRef` records whether the pointer actually moved, so the browser's
  // trailing click (fired after pointerup) does not pet the sprite.
  const draggedRef = useRef(false)
  const clearHideTimer = (): void => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const onPointerDown = (e: ReactPointerEvent): void => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    const current = dragPos ?? { right: display.right, bottom: display.bottom }
    dragRef.current = { startX: e.clientX, startY: e.clientY, ...current }
    draggedRef.current = false
    setHovered(false)
  }
  const onPointerMove = (e: ReactPointerEvent): void => {
    const drag = dragRef.current
    if (drag === null) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) draggedRef.current = true
    const right = clampOffset(drag.right - dx, window.innerWidth - 40)
    const bottom = clampOffset(drag.bottom - dy, window.innerHeight - 40)
    setDragPos({ right, bottom })
  }
  const onPointerUp = (): void => {
    if (dragRef.current === null) return
    dragRef.current = null
    if (dragPos !== null) props.onDragEnd(dragPos.right, dragPos.bottom)
  }

  const pos = dragPos ?? { right: display.right, bottom: display.bottom }
  const spriteWidth = Math.round(cell.width * spriteScale)
  const spriteHeight = Math.round(cell.height * spriteScale)
  // Concurrent sessions each render their own bubble (stacked above the
  // sprite); the legacy single 'bubble' is the fallback when the host serves
  // no per-session list. The hover panel now sits beside the sprite, so the
  // bubbles stay visible and clickable while hovering — no region swap.
  const sessionBubbles = snapshot?.sessions ?? []
  const statusBubble = feedback === null && sessionBubbles.length === 0
    ? snapshot?.bubble
    : undefined
  const displayName = snapshot?.name ?? definition.displayName

  const float = (
    <div
      ref={floatRef}
      className={styles.float}
      style={{ right: pos.right, bottom: pos.bottom, zIndex: 2147483000 }}
      onPointerEnter={() => {
        clearHideTimer()
        setHovered(true)
      }}
      onPointerLeave={(e) => {
        // The panel renders OUTSIDE the container's box (absolute, beside
        // the sprite), so moving onto it fires pointerleave on the container.
        // Treat a target still inside the container's DOM (the overflowed
        // panel) as "still hovering"; otherwise give the pointer a short
        // grace period to reach the panel across the gap beside the sprite.
        // The bridge ('.panel::after') keeps the pointer inside the hit
        // area, and the grace period covers a slow mouse crossing the
        // remaining sliver.
        const next = e.relatedTarget
        if (next instanceof Node && floatRef.current?.contains(next)) return
        clearHideTimer()
        hideTimerRef.current = window.setTimeout(() => setHovered(false), 300)
      }}
    >
      {isWebp ? (
        <img
          className={clsx(styles.webpSprite, styles.sprite)}
          src={webpSrc ?? undefined}
          style={{
            width: spriteWidth,
            height: spriteHeight,
            opacity: 1,
            backgroundColor: 'rgba(30, 41, 59, 0.35)',
            transition: 'opacity 0.3s ease',
            cursor: dragRef.current === null ? 'grab' : 'grabbing',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => {
            if (draggedRef.current) return
            props.onPet()
          }}
          onLoad={() => setWebpLoaded(true)}
          role="button"
          aria-label={definition.displayName}
          draggable={false}
          alt={definition.displayName}
        />
      ) : (
        <div
          ref={spriteRef}
          className={styles.sprite}
          style={{
            width: spriteWidth,
            height: spriteHeight,
            backgroundImage: imageReady ? 'url(' + definition.atlasUrl + ')' : undefined,
            backgroundSize: (cell.width * columns * spriteScale) + 'px ' + (cell.height * rows.length * spriteScale) + 'px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '0 0',
            cursor: dragRef.current === null ? 'grab' : 'grabbing',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => {
            // A pointer sequence that moved (dragged) still fires a trailing
            // click; skip the pet when that happened.
            if (draggedRef.current) return
            props.onPet()
          }}
          role="button"
          aria-label={definition.displayName}
        />
      )}
      {feedback !== null && (
        <div key={feedback.at} className={clsx(styles.bubble, feedback.kind === 'feed' ? styles.bubbleFeed : styles.bubblePet)}>
          {feedback.text}
        </div>
      )}
      {feedback === null && sessionBubbles.length > 0 && (
        <div className={styles.bubbleStack}>
          {sessionBubbles.map(session => (
            <button
              key={session.sessionId}
              type="button"
              className={clsx(styles.bubble, styles.bubbleStatus, styles.bubbleClickable)}
              title={props.t('pet.openSessionHint')}
              onClick={() => { props.onOpenSession(session.sessionId) }}
            >
              {session.bubble}
            </button>
          ))}
        </div>
      )}
      {statusBubble !== undefined && (
        <div className={clsx(styles.bubble, styles.bubbleStatus)} role="status" aria-live="polite">
          {statusBubble}
        </div>
      )}
      {hovered && dragRef.current === null && (
        <div
          className={styles.panel}
          onPointerEnter={() => {
            // Reaching the panel (or its bridge) must cancel any hide timer
            // the container's pointerleave may have armed while the pointer
            // crossed the sliver between the sprite and the panel.
            clearHideTimer()
          }}
        >
          {renaming ? (
            <div className={styles.renameRow}>
              <input
                className={styles.nameInput}
                value={nameDraft}
                maxLength={20}
                placeholder={props.t('pet.namePlaceholder')}
                autoFocus
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  // While an IME composition is active (e.g. selecting a
                  // Chinese candidate), Enter/Escape keydowns belong to the
                  // input method: ignore them so candidate selection can
                  // neither submit the draft nor close the rename box.
                  if (e.nativeEvent.isComposing) return
                  if (e.key === 'Enter') {
                    const trimmed = nameDraft.trim()
                    if (trimmed !== '') {
                      props.onRename(trimmed)
                      setRenaming(false)
                    }
                  } else if (e.key === 'Escape') {
                    setRenaming(false)
                  }
                }}
              />
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  const trimmed = nameDraft.trim()
                  if (trimmed !== '') {
                    props.onRename(trimmed)
                    setRenaming(false)
                  }
                }}
              >
                {props.t('pet.confirm')}
              </button>
            </div>
          ) : (
            <>
              <div className={styles.rankRow}>
                <span className={styles.nameCell}>{displayName}</span>
                <span>{props.t('pet.rank', { rank: snapshot?.affinity.rank ?? '?' })}</span>
              </div>
              <div className={styles.rankRow}>
                <span>{props.t('pet.treats', { n: snapshot?.treats.stocked ?? 0 })}</span>
                <span>{props.t('pet.points', { points: snapshot?.affinity.points ?? 0 })}</span>
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.action} onClick={props.onFeed}>
                  {props.t('pet.feed')}
                </button>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    setNameDraft(displayName)
                    setRenaming(true)
                  }}
                >
                  {props.t('pet.rename')}
                </button>
                <button type="button" className={styles.action} onClick={props.onHide}>
                  {props.t('pet.hide')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )

  return createPortal(float, document.body)
}
