/**
 * Jiangxiao skin settings card — shows the animation-pack import guidance
 * text. When the Jiangxiao animated-webp pet is not yet imported, the card
 * tells the user how to get it; after import it shows an "activated" status.
 * The component is a first-level settings section (settings.section).
 * @module @linxin666/dsh-client-ui-skin-jiangxiao/client/SkinSettingsCard
 */

import { useEffect, useState, type ReactNode } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the settings-surface SlotMap merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import css from './skin-card.module.css'

/** The face the card's slot entry injects (currently none — purely static). */
export interface SkinJiangxiaoCardFace {
  /** No injected services. */
}

/** The pet registry entry served by /api/pet/pets. */
interface PetChoice {
  id: string
  displayName: string
}

/** Check if the Jiangxiao pet is registered (imported). */
async function hasJiangxiaoPet(): Promise<boolean> {
  try {
    const response = await fetch('/api/pet/pets')
    if (!response.ok) return false
    const list: PetChoice[] = await response.json()
    return list.some(pet => pet.id === 'jiangxiao')
  } catch {
    return false
  }
}

/** Props the renderer binds for the Jiangxiao skin settings card. */
export type SkinJiangxiaoCardProps =
  PropsLocale<'skinJiangxiao'>
  & InjectFace<SkinJiangxiaoCardFace>

/**
 * Render the Jiangxiao skin settings card.
 * @param props - locale copy.
 * @returns the card.
 */
export function SkinJiangxiaoCard(props: SkinJiangxiaoCardProps) {
  const { t } = props
  const [petImported, setPetImported] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    setChecking(true)
    hasJiangxiaoPet().then(result => {
      if (cancelled) return
      setPetImported(result)
      setChecking(false)
    }, () => {
      if (cancelled) return
      setPetImported(false)
      setChecking(false)
    })
    return () => { cancelled = true }
  }, [])

  const navigateToPet = (): void => {
    // Try to find and click the pet settings sidebar link.
    const petLink = document.querySelector<HTMLAnchorElement | HTMLButtonElement>(
      '[data-settings-nav-id="pet"] a, [data-settings-nav-id="pet"] button, '
      + '[data-slot="settings-nav"] [data-key="pet"]',
    )
    if (petLink !== null) {
      petLink.click()
      return
    }
    // Fallback: navigate to the pet settings hash.
    window.location.hash = '#/settings/pet'
  }

  return (
    <div className={css.card}>
      <div className={css.head}>
        <span className={css.title}>{t('settings.title')}</span>
        <span className={css.description}>{t('settings.description')}</span>
      </div>

      <div className={css.body}>
        {checking
          ? (
            <p className={css.statusChecking}>{t('pet.guidance')}</p>
          )
          : petImported === true
            ? (
              <div className={css.activated}>
                <span className={css.activatedBadge}>{t('pet.activated')}</span>
                <p className={css.hint}>{t('pet.activatedHint')}</p>
                <button
                  type="button"
                  className={css.linkButton}
                  onClick={navigateToPet}
                >
                  {t('pet.importLink')}
                </button>
              </div>
            )
            : (
              <div className={css.guidance}>
                <p className={css.guidanceText}>{t('pet.guidance')}</p>
                <p className={css.hint}>{t('pet.guidanceHint')}</p>
                <button
                  type="button"
                  className={css.linkButton}
                  onClick={navigateToPet}
                >
                  {t('pet.importLink')}
                </button>
              </div>
            )}
      </div>
    </div>
  )
}

/** Props the settings section binds for the Jiangxiao skin card page. */
export type SkinJiangxiaoSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'skinJiangxiao'>
  & InjectFace<SkinJiangxiaoCardFace>

/** Render the Jiangxiao skin settings card as a first-level settings page. */
export function SkinJiangxiaoSection(props: SkinJiangxiaoSectionProps): ReactNode {
  const { t } = props
  return (
    <ul className={css.sectionList}>
      <SkinJiangxiaoCard t={t} />
    </ul>
  )
}

export default SkinJiangxiaoSection