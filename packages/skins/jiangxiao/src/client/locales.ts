/**
 * Jiangxiao skin locale dictionaries (zh/en). Owned by the skin settings card
 * that shows the animation-pack import guidance.
 * @module @linxin666/dsh-client-ui-skin-jiangxiao/client/locales
 */

/** Locale namespace owned by this skin. */
export const NS = 'skinJiangxiao'

/** Chinese copy. */
export const zh = {
  'settings.title': '姜晓皮肤',
  'settings.description': '查看姜晓皮肤专属功能与动画包状态。',
  'pet.guidance': '可下载并导入姜晓动画包，在宠物设置中启用宠物动画。',
  'pet.guidanceHint': '进入「宠物」设置页，点击「导入资产包」选择已下载的 ZIP 文件即可导入。',
  'pet.activated': '姜晓动画包已激活',
  'pet.activatedHint': '宠物动画已就绪，可在「宠物」设置页中选择姜晓宠物。',
  'pet.importLink': '前往宠物设置',
} as const

/** English copy. */
export const en = {
  'settings.title': 'Jiangxiao Skin',
  'settings.description': 'View Jiangxiao skin features and animation pack status.',
  'pet.guidance': 'Download and import the Jiangxiao animation pack to enable pet animations.',
  'pet.guidanceHint': 'Go to the Pet settings page and click "Import asset pack" to select the downloaded ZIP file.',
  'pet.activated': 'Jiangxiao animation pack is active',
  'pet.activatedHint': 'Pet animations are ready — select the Jiangxiao pet in the Pet settings page.',
  'pet.importLink': 'Go to Pet settings',
} as const

/** Key union for this namespace. */
export type JiangxiaoKey = keyof typeof zh

/**
 * Active dictionary, picked by the document language at call time.
 * Follows the same pattern as dsh-pet's locales.
 */
export function dictionary(): Record<JiangxiaoKey, string> {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'zh'
  return lang.toLowerCase().startsWith('en') ? en : zh
}

/**
 * Translate a key with optional `{name}` template params.
 * Mirrors the slot `Translate` contract.
 */
export function t(key: string, params?: Record<string, unknown>): string {
  let text: string = (dictionary() as Record<string, string>)[key] ?? key
  if (params !== undefined) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Jiangxiao skin settings card copy. */
    skinJiangxiao: JiangxiaoKey
  }
}