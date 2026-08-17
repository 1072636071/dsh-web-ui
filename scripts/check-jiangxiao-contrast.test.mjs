/**
 * Wrapper that runs check-jiangxiao-contrast.mjs under `node --test` so the
 * contrast gate joins `pnpm test:scripts`. The script exits 0 when every
 * jiangxiao text token meets WCAG AA on every surface; a non-zero exit
 * surfaces the specific failures in its stderr.
 */
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(SCRIPT_DIR, 'check-jiangxiao-contrast.mjs')

test('jiangxiao skin text tokens meet WCAG AA on every surface (dark + light)', () => {
  execFileSync(process.execPath, [SCRIPT], { stdio: 'inherit' })
})