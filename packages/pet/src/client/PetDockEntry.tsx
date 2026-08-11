/**
 * Dock anchor inside `conversation.composer.dock`: mounts the floating pet
 * (portal) while visible; renders the summon button while hidden.
 * @module @deepseek-ai/dsh-pet/client/PetDockEntry
 */

import { useEffect, type ReactElement } from 'react'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PetDisplayConfig } from '../persist.ts'
import type { PetFeedback } from './pet-store.ts'
import { createPetStore } from './pet-store.ts'
import { WhalePet } from './WhalePet.tsx'
import { NS } from './locales.ts'
import styles from './pet.module.css'

/** Injected actions handed to the dock entry component. */
export interface PetInjected {
  /** Ensure the first snapshot is fetched (called on mount). */
  ensure: () => void
  /** Pet the whale girl (click). */
  pet: () => void
  /** Feed the whale girl. */
  feed: () => void
  /** Hide the whale girl. */
  hide: () => void
  /** Summon the hidden whale girl back. */
  summon: () => void
  /** Persist a drag position. */
  dragEnd: (right: number, bottom: number) => void
  /** Rename the pet (persisted by the host). */
  rename: (name: string) => void
  /** Clear the reaction bubble. */
  feedbackDone: () => void
}

/** Composed props of the dock entry (runtime + store + locale + injected). */
export type PetDockEntryProps =
  PropsRuntime<'conversation.composer.dock'>
  & PropsStore<ReturnType<typeof createPetStore>>
  & PetInjected
  & PropsLocale<typeof NS>

const DEFAULT_DISPLAY: PetDisplayConfig = { visible: true, size: 160, right: 24, bottom: 20 }

/**
 * Dock entry: while the pet is visible, mount the floating WhalePet (it
 * portals itself onto document.body); while hidden, render the summon
 * button so the pet can always come back.
 */
export function PetDockEntry(props: PetDockEntryProps): ReactElement {
  const { useStore, ensure } = props
  const snapshot = useStore((s) => s.snapshot)
  const feedback: PetFeedback | null = useStore((s) => s.feedback)
  const visible = snapshot?.display.visible ?? true

  useEffect(() => {
    ensure()
  }, [ensure])

  if (visible) {
    return (
      <span data-pet-dock data-testid="pet-dock">
        <WhalePet
          snapshot={snapshot}
          display={snapshot?.display ?? DEFAULT_DISPLAY}
          feedback={feedback}
          onPet={props.pet}
          onFeed={props.feed}
          onHide={props.hide}
          onDragEnd={props.dragEnd}
          onRename={props.rename}
          onFeedbackDone={props.feedbackDone}
          t={props.t}
        />
      </span>
    )
  }
  return (
    <button
      type="button"
      className={styles.summon}
      onClick={props.summon}
      data-testid="pet-summon"
    >
      {props.t('pet.summon', { name: snapshot?.name ?? '鲸鱼娘' })}
    </button>
  )
}
