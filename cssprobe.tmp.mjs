import { chromium } from 'playwright'
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:3080/', { waitUntil: 'networkidle', timeout: 20000 })
const info = await page.evaluate(() => {
  let css = ''
  const seen = new Set()
  for (const s of document.styleSheets) {
    try {
      for (const r of s.cssRules) {
        const t = r.cssText
        if (!seen.has(t)) { seen.add(t); css += t + '\n' }
      }
    } catch { }
  }
  const urls = [...new Set(css.match(/url\([^)]*\)/g) || [])].slice(0, 40)
  const darkSel = (css.match(/[^{}]*data-ds-dark-theme[^{]*\{/g) || []).slice(0, 8).map(s => s.trim().slice(0, 90))
  return {
    bytes: css.length,
    urls,
    urlCount: (css.match(/url\(/g) || []).length,
    darkSelectors: darkSel,
    hasFontFace: css.includes('@font-face'),
  }
})
console.log(JSON.stringify(info, null, 1))
await b.close()
