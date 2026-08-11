/**
 * Consumer-side build for git installs (the `prepare` script): transpile
 * straight from src without tsc project references, which need the sibling
 * harness checkout that only dev machines and CI have. Types are NOT checked
 * here — `pnpm run typecheck` owns that.
 */
import type { UserConfig } from 'tsdown'
import { clientBundle } from './build/tsdown.client.ts'

/**
 * The prepare face builds both halves from src (node half entries given
 * here; the client bundle entry is fixed at src/client/index.ts inside the
 * preset) and pins every tsdown config to the self-contained
 * tsconfig.prepare.json — the repo tsconfig extends the sibling harness
 * checkout, which consumers lack.
 */
export default clientBundle('@deepseek-ai/dsh-client-ui-git-graph', ['src/index.ts', 'src/invariant.ts'])
  .map((config): UserConfig => ({ ...config, tsconfig: 'tsconfig.prepare.json' }))
