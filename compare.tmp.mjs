import { chromium } from 'playwright'
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
// 本地静态服务上的 stock 预览
await page.goto('http://127.0.0.1:8642/gallery/preview.html?skin=stock&theme=light&chrome=0', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.screenshot({ path: '/tmp/preview-stock-light.png' })
const px = await page.evaluate(() => {
  const sample = (x, y) => { const e = document.elementFromPoint(x, y); if (!e) return null; const cs = getComputedStyle(e); return { bg: cs.backgroundColor, col: cs.color } }
  return {
    sidebarBrand: sample(140, 40),   // 侧栏品牌区
    sidebarMid: sample(140, 400),    // 侧栏中部
    convHeader: sample(800, 40),     // 会话头部
    convMid: sample(800, 400),       // 会话中部
    composer: sample(800, 830),      // composer 附近
    bodyBg: sample(20, 860),         // 页面边缘
  }
})
console.log('stock 预览采样:', JSON.stringify(px, null, 1))
await b.close()
