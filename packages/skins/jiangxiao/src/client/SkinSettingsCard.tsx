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
import {
  FX_KEYS,
  loadFxState,
  getFxSystem,
  type FxKey,
  type FxState,
} from './fx-system.ts'
import { probeAssetReady } from './character-overlay.ts'
import type { JiangxiaoKey } from './locales.ts'

/** The face the card's slot entry injects (currently none — purely static). */
export interface SkinJiangxiaoCardFace {
  /** No injected services. */
}

/** FX 开关的 locale key 映射。 */
const FX_LABEL_KEYS: Record<FxKey, 'fx.shimmer' | 'fx.fall' | 'fx.grain' | 'fx.breathe' | 'fx.micro'> = {
  shimmer: 'fx.shimmer',
  fall: 'fx.fall',
  grain: 'fx.grain',
  breathe: 'fx.breathe',
  micro: 'fx.micro',
}

/** FX 特效开关区块：五效独立 toggle + 全开/全关。消费语义别名，无颜色字面量。 */
function FxToggles(props: { t: (key: JiangxiaoKey) => string }) {
  const { t } = props
  const [state, setState] = useState<FxState>(() => loadFxState())

  /** 无全局系统时的降级：仅持久化 + 同步 html 类，下次 init 读取。 */
  const applyFxLocal = (next: FxState): void => {
    setState(next)
    try {
      localStorage.setItem('jx-fx', JSON.stringify(next))
    } catch {
      // 隐私模式
    }
    for (const k of FX_KEYS) document.documentElement.classList.toggle(`fx-${k}`, next[k])
  }

  const toggle = (key: FxKey, enabled: boolean): void => {
    const sys = getFxSystem()
    if (sys !== undefined) {
      sys.setFx(key, enabled)
      setState(sys.getAll())
    } else {
      applyFxLocal({ ...state, [key]: enabled })
    }
  }

  const toggleAll = (enabled: boolean): void => {
    const sys = getFxSystem()
    if (sys !== undefined) {
      sys.setAll(enabled)
      setState(sys.getAll())
    } else {
      applyFxLocal({ shimmer: enabled, fall: enabled, grain: enabled, breathe: enabled, micro: enabled })
    }
  }

  return (
    <div className={css.fxBlock}>
      <span className={css.fxTitle}>{t('fx.title')}</span>
      <span className={css.fxDescription}>{t('fx.description')}</span>
      <div className={css.fxList}>
        {FX_KEYS.map((key) => (
          <label key={key} className={css.fxRow}>
            <input
              type="checkbox"
              className={css.fxCheckbox}
              checked={state[key]}
              onChange={(e) => toggle(key, e.target.checked)}
            />
            <span className={css.fxLabel}>{t(FX_LABEL_KEYS[key])}</span>
          </label>
        ))}
      </div>
      <div className={css.fxActions}>
        <button type="button" className={css.fxButton} onClick={() => toggleAll(true)}>
          {t('fx.allOn')}
        </button>
        <button type="button" className={css.fxButton} onClick={() => toggleAll(false)}>
          {t('fx.allOff')}
        </button>
      </div>
    </div>
  )
}

/** Props the renderer binds for the Jiangxiao skin settings card. */
export type SkinJiangxiaoCardProps =
  PropsLocale<'skinJiangxiao'>
  & InjectFace<SkinJiangxiaoCardFace>

/** 设置卡视图态：探测中 / 就绪 / 未就绪（导入引导）。 */
export type SkinCardView = 'checking' | 'ready' | 'not-ready'

/**
 * 设置卡视图分支判定（纯函数，可单测）。
 * checking=true -> checking；否则 petImported===true -> ready，否则 not-ready。
 */
export function resolveSkinCardView(checking: boolean, petImported: boolean | null): SkinCardView {
  if (checking) return 'checking'
  return petImported === true ? 'ready' : 'not-ready'
}

/**
 * Render the Jiangxiao skin settings card.
 * @param props - locale copy.
 * @returns the card.
 */
export function SkinJiangxiaoCard(props: SkinJiangxiaoCardProps) {
  const { t } = props
  const [petImported, setPetImported] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)
  const view = resolveSkinCardView(checking, petImported)

  useEffect(() => {
    let cancelled = false
    setChecking(true)
    probeAssetReady().then(result => {
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
        {view === 'checking'
          ? (
            <p className={css.statusChecking}>{t('pet.guidance')}</p>
          )
          : view === 'ready'
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

        <FxToggles t={t} />
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