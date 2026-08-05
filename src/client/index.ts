import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-token-meter/client'
import { TpsLine } from './TpsLine.tsx'

export { TpsLine, formatTokensPerSecond } from './TpsLine.tsx'

/** Client services required by the composer dock contribution. */
export const inject = ['slots', 'conversation']

/** Mount the TPS row immediately below the built-in session statistics. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.slots.register({
    name: 'conversation.composer.dock',
    id: 'live-tps',
    order: 1,
  }, TpsLine), 'live-stats: TPS composer row')
}
