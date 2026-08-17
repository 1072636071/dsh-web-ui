/**
 * dsh-pet locale dictionaries (zh/en).
 * @module @linxin666/dsh-pet/client/locales
 */

/** Dictionary namespace this package registers. */
export const NS = 'pet'

/** Chinese copy. */
export const zh = {
  'pet.feed': '喂食',
  'pet.hide': '隐藏',
  'pet.rename': '改名',
  'pet.confirm': '确定',
  'pet.namePlaceholder': '输入新名字',
  'pet.summon': '召唤{name}',
  'pet.rank': '亲密度 {rank}',
  'pet.points': '{points} 点',
  'pet.treats': '小鱼干 ×{n}',
  'pet.state.loading': '宠物正在赶来…',
  'pet.state.error': '宠物迷路了（连接失败）',
  'pet.openSessionHint': '点击跳转到对应会话',
  'pet.importAsset': '导入资产包...',
  'pet.importing': '正在导入...',
  'pet.importSuccess': '姜晓动画包已导入，请重新加载页面以选择',
  'pet.importError': '导入失败：{error}',
  'pet.importExists': '动画包已存在，请先删除旧目录再导入',
  'pet.importError.zipParse': 'ZIP 解析失败：{detail}',
  'pet.importError.zipEmpty': 'ZIP 文件为空',
  'pet.importError.zipSlip': 'ZIP 包含不安全的路径：{path}',
  'pet.importError.fileTooBig': '文件 {name} 超过大小限制（{limit} 字节）',
  'pet.importError.totalTooBig': 'ZIP 总大小超过限制（{limit} 字节）',
  'pet.importError.petJsonNotFound': 'ZIP 中未找到 pet.json',
  'pet.importError.invalidJson': 'pet.json 不是有效的 JSON',
  'pet.importError.invalidId': 'pet.json id 不能为空',
  'pet.importError.wrongKind': 'pet.json kind 必须是 "animated-webp"',
  'pet.importError.invalidStates': 'pet.json 缺少完整的 states 结构',
  'pet.importError.invalidTransitions': 'pet.json 缺少有效的 transitions 结构',
  'pet.importError.writeFailed': '文件写入失败：{detail}',
  // 一级设置页（settings.section 席位）。
  'settings.title': '宠物',
  'settings.description': '选择宠物并调整它的显示布局。',
  'settings.pet': '宠物',
  'settings.petHint': '选择显示哪只宠物；每只宠物独立命名，可在宠物悬浮面板改名。',
  'settings.enabled': '启用宠物',
  'settings.enabledHint': '关闭后隐藏宠物并停止轮询，可在设置里重新启用。',
  'settings.visible': '显示宠物',
  'settings.visibleHint': '关闭后宠物隐藏，可从聊天输入区重新召唤。',
  'settings.size': '大小（px）',
  'settings.sizeHint': '精灵单元高度，范围 32–512。',
  'settings.right': '距右侧（px）',
  'settings.rightHint': '距视口右边缘的水平内缩距离。',
  'settings.bottom': '距底部（px）',
  'settings.bottomHint': '距视口底边的垂直内缩距离。',
  'settings.inherit': '继承',
  'settings.on': '开',
  'settings.off': '关',
  'settings.overridden': '已覆盖',
  'settings.reset': '恢复默认',
  'settings.notExposed': '当前 DSH 版本未向设置页暴露本插件的配置命名空间，表单不可用。可编辑 ~/.dsh/settings.yaml 直接配置，或为 dsh-host-apiproxy 的 WEB_SETTINGS_NAMESPACES 白名单补充本命名空间后重启。',
  'settings.readOnly': '当前部署的设置只读。',
  'settings.expand': '展开设置',
  'settings.collapse': '收起设置',
  'settings.save': '保存',
  'settings.saving': '保存中…',
  'settings.discard': '放弃',
  'settings.unsaved': '未保存',
  'settings.saveFailed': '部署未接受这些值，已保留供你修改。',
  'settings.invalidNumber': '请输入数字，留空则使用默认值。',
} as const

/** English copy. */
export const en = {
  'pet.feed': 'Feed',
  'pet.hide': 'Hide',
  'pet.rename': 'Rename',
  'pet.confirm': 'OK',
  'pet.namePlaceholder': 'Enter a new name',
  'pet.summon': 'Summon {name}',
  'pet.rank': 'Affinity {rank}',
  'pet.points': '{points} pts',
  'pet.treats': 'Treats ×{n}',
  'pet.state.loading': 'The pet is on its way…',
  'pet.state.error': 'The pet is lost (connection failed)',
  'pet.openSessionHint': 'Click to jump to this session',
  'pet.importAsset': 'Import asset pack...',
  'pet.importing': 'Importing...',
  'pet.importSuccess': 'Jiangxiao pet pack imported. Reload the page to select it.',
  'pet.importError': 'Import failed: {error}',
  'pet.importExists': 'The pet pack already exists. Delete the old directory before importing.',
  'pet.importError.zipParse': 'ZIP parse failed: {detail}',
  'pet.importError.zipEmpty': 'ZIP file is empty',
  'pet.importError.zipSlip': 'ZIP contains an unsafe path: {path}',
  'pet.importError.fileTooBig': 'File {name} exceeds the size limit ({limit} bytes)',
  'pet.importError.totalTooBig': 'ZIP total size exceeds the limit ({limit} bytes)',
  'pet.importError.petJsonNotFound': 'pet.json not found in the ZIP',
  'pet.importError.invalidJson': 'pet.json is not valid JSON',
  'pet.importError.invalidId': 'pet.json id must not be empty',
  'pet.importError.wrongKind': 'pet.json kind must be "animated-webp"',
  'pet.importError.invalidStates': 'pet.json has an incomplete states structure',
  'pet.importError.invalidTransitions': 'pet.json has an invalid transitions structure',
  'pet.importError.writeFailed': 'File write failed: {detail}',
  // First-level settings section (the `settings.section` seat).
  'settings.title': 'Pet',
  'settings.description': 'Pick a pet and tune its display layout.',
  'settings.pet': 'Pet',
  'settings.petHint': 'Choose which pet shows. Names are stored per pet; rename from the pet hover panel.',
  'settings.enabled': 'Enable the pet',
  'settings.enabledHint': 'When off, the pet hides and polling stops; re-enable it here.',
  'settings.visible': 'Show the pet',
  'settings.visibleHint': 'When off, the pet hides; summon it again from the input row.',
  'settings.size': 'Size (px)',
  'settings.sizeHint': 'Sprite cell height, 32\u2013512.',
  'settings.right': 'Right inset (px)',
  'settings.rightHint': 'Horizontal inset from the viewport right edge.',
  'settings.bottom': 'Bottom inset (px)',
  'settings.bottomHint': 'Vertical inset from the viewport bottom edge.',
  'settings.inherit': 'Inherit',
  'settings.on': 'On',
  'settings.off': 'Off',
  'settings.overridden': 'Overridden',
  'settings.reset': 'Reset to default',
  'settings.notExposed': 'This DSH version does not expose this plugin\'s settings namespace to the configuration page, so the form is unavailable. Edit ~/.dsh/settings.yaml directly, or add the namespace to dsh-host-apiproxy\'s WEB_SETTINGS_NAMESPACES allowlist and restart.',
  'settings.readOnly': 'This deployment stores settings read-only.',
  'settings.expand': 'Show settings',
  'settings.collapse': 'Hide settings',
  'settings.save': 'Save',
  'settings.saving': 'Saving\u2026',
  'settings.discard': 'Discard',
  'settings.unsaved': 'Unsaved',
  'settings.saveFailed': 'The deployment did not accept these values; they were left for you to correct.',
  'settings.invalidNumber': 'Enter a number, or leave blank to use the default.',
} as const

/** Key union for this namespace. */
export type PetKey = keyof typeof zh

/** The settings-card slice of the pet dictionary. */
export type SettingsCardKey = PetKey

/**
 * Active dictionary, picked by the document language at call time. The pet
 * mounts as a global floating surface (not a session-scoped slot), so it has
 * no framework locale seat and resolves its copy the same tiny way the
 * task-board's DOM-injected surface does.
 */
export function dictionary(): Record<PetKey, string> {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'zh'
  return lang.toLowerCase().startsWith('en') ? en : zh
}

/**
 * Translate a key with optional `{name}` template params. Mirrors the slot
 * `Translate` contract `(key, params?) => string` so it can be handed to the
 * same components that used to receive the framework-injected `t` seat. The
 * key is typed loosely (`string`) so the function is assignable to the slot's
 * `TranslateNS<'pet'>` (whose key domain also spans the shared common
 * vocabulary); a missing key degrades to the key itself rather than throwing.
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
    /** dsh-pet UI copy. */
    pet: PetKey
  }
}
