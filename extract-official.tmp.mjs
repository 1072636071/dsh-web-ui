import { chromium } from 'playwright'
import fs from 'node:fs'

const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:3080/', { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForTimeout(2500)

// 1) 摘除当前皮肤（blue-fantasy），恢复官方外观
await page.evaluate(() => {
  document.body.removeAttribute('data-dsh-blue-fantasy')
  document.body.removeAttribute('data-dsh-retro')
  document.body.removeAttribute('data-dsh-ths')
  document.body.removeAttribute('data-dsh-xp')
  for (const s of document.querySelectorAll('style[data-plugin*="ui-skin"]')) s.remove()
  for (const l of document.querySelectorAll('link[rel="icon"]')) l.remove()
  // blue-fantasy 的 backdrop 是 body 直属 fixed div
  for (const el of [...document.body.children]) {
    if (el.style && (el.style.position === 'fixed' || el.style.backgroundImage)) el.remove()
  }
})
await page.waitForTimeout(400)

// 2) 官方 token：light 采样（body 计算样式上的全部 --dsw-* 变量）
const readTokens = () => page.evaluate(() => {
  const cs = getComputedStyle(document.body)
  const out = {}
  for (let i = 0; i < cs.length; i++) {
    const n = cs[i]
    if (n.startsWith('--dsw-') || n.startsWith('--ds-')) out[n] = cs.getPropertyValue(n).trim()
  }
  return out
})
const light = await readTokens()
// dark：设置官方暗色属性再采样
await page.evaluate(() => { document.body.setAttribute('data-ds-dark-theme', '') })
await page.waitForTimeout(400)
const dark = await readTokens()
await page.evaluate(() => { document.body.removeAttribute('data-ds-dark-theme') })

// 3) 官方布局尺寸
const layout = await page.evaluate(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } }
  const frame = document.querySelector('[data-dsh-frame]')
  const conv = document.querySelector('[data-pane="conversation"]')
  const convHeader = conv?.querySelector(':scope > div > header')
  const sidebar = document.querySelector('[data-pane="sidebar"]')
  const sbInner = sidebar?.firstElementChild
  const sbFirst = sbInner?.firstElementChild
  const sbLast = sbInner?.lastElementChild
  const details = document.querySelector('[data-pane="details"]')
  return {
    viewport: { w: innerWidth, h: innerHeight },
    frame: r(frame),
    sidebar: r(sidebar), details: r(details), conversation: r(conv),
    convHeader: r(convHeader),
    sbInner: r(sbInner), sbFirst: r(sbFirst), sbLast: r(sbLast),
    bodyFont: getComputedStyle(document.body).fontSize,
    bodyRadius: getComputedStyle(document.body).borderRadius,
  }
})

// 4) 官方样式总量评估
const cssStats = await page.evaluate(() => {
  let total = 0, sheets = 0
  for (const s of document.styleSheets) {
    try { total += [...s.cssRules].reduce((a, r) => a + r.cssText.length, 0); sheets++ } catch { }
  }
  const adopted = document.adoptedStyleSheets || []
  let adv = 0
  for (const s of adopted) { try { adv += [...s.cssRules].reduce((a, r) => a + r.cssText.length, 0) } catch { } }
  return { sheets, total, adoptedSheets: adopted.length, adoptedBytes: adv }
})

// 5) 真实 GUI 截图（官方外观基准）
await page.screenshot({ path: '/tmp/official-gui-light.png' })
await page.evaluate(() => { document.body.setAttribute('data-ds-dark-theme', '') })
await page.waitForTimeout(400)
await page.screenshot({ path: '/tmp/official-gui-dark.png' })

fs.writeFileSync('/tmp/official-tokens-light.json', JSON.stringify(light, null, 0))
fs.writeFileSync('/tmp/official-tokens-dark.json', JSON.stringify(dark, null, 0))
console.log('light tokens:', Object.keys(light).length, '| dark tokens:', Object.keys(dark).length)
console.log('layout:', JSON.stringify(layout))
console.log('cssStats:', JSON.stringify(cssStats))
await b.close()
