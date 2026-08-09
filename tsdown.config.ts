/**
 * Dev-machine build (after `tsc -b`): the node half from tsc's lib/types
 * emit plus the browser client bundle through the copied dsh client-bundle
 * preset (build/tsdown.client.ts, kept in sync with the harness checkout's
 * packages/client/tsdown.client.ts).
 */
import { clientBundle } from './build/tsdown.client.ts'

export default clientBundle('@deepseek-ai/dsh-client-ui-git-graph', [
  'lib/types/index.js',
  'lib/types/invariant.js',
])
