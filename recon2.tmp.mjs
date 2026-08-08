import { chromium } from 'playwright'
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:3080/', { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForTimeout(2500)

// 找 composer / 输入区
const probes = await page.evaluate(() => {
  const find = (sel) => document.querySelector(sel) ? (() => { const e = document.querySelector(sel); const r = e.getBoundingClientRect(); return { cls: e.className, tag: e.tagName, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) } })() : null
  return {
    textarea: find('textarea'),
    sendButton: [...document.querySelectorAll('button')].filter(b => /send|发送/i.test(b.getAttribute('aria-label') || '') || /send/i.test(b.className)).slice(0, 2).map(b => { const r = b.getBoundingClientRect(); return { cls: b.className, aria: b.getAttribute('aria-label'), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) } }),
    convChildren: [...document.querySelector('[data-pane="conversation"]')?.children || []].map(c => c.className),
    convDepth: (() => { let el = document.querySelector('[data-pane="conversation"]'), d = 0; while (el && el.childElementCount === 1 && d < 20) { el = el.firstElementChild; d++ } return { singleChain: d, top: el?.className } })(),
    msgCount: document.querySelectorAll('[data-pane="conversation"] [class*="message"], [data-pane="conversation"] [class*="msg"], [data-pane="conversation"] [class*="bubble"]').length,
    detailsOpen: !!document.querySelector('[data-pane="details"]')?.getBoundingClientRect().width,
    frame: document.querySelector('[data-dsh-frame]')?.getAttribute('data-sidebar-collapsed'),
  }
})
console.log(JSON.stringify(probes, null, 1))
await b.close()
