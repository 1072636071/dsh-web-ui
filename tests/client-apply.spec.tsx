import { Context } from 'cordis'
import { describe, expect, it } from 'vitest'
import { SlotsService } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls ui-conversation's SlotMap merge for the composer dock hole.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { apply, inject } from '../src/client/index.ts'
import { TpsLine } from '../src/client/TpsLine.tsx'

/** Declare the composer dock hole under root, as ui-conversation does. */
async function bench(): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SlotsService).await()
  ctx.provide('conversation', {} as never)
  ctx.slots.register({
    name: 'root',
    children: { 'conversation.composer.dock': { kind: 'list', scope: 'session' } },
  } as never, () => null)
  await ctx.plugin(Object.assign(apply, { inject })).await()
  return ctx
}

describe('live-stats client apply', () => {
  it('registers the TPS row into the composer dock', async () => {
    const ctx = await bench()
    const first = ctx.slots.entries('conversation.composer.dock')[0]
    expect(first).toBeDefined()
    expect(first?.component).toBe(TpsLine)
    expect(first?.options.id).toBe('live-tps')
  })

  it('unregisters the row when the plugin is disposed', async () => {
    const ctx = new Context()
    await ctx.plugin(SlotsService).await()
    ctx.provide('conversation', {} as never)
    ctx.slots.register({
      name: 'root',
      children: { 'conversation.composer.dock': { kind: 'list', scope: 'session' } },
    } as never, () => null)
    const fiber = await ctx.plugin(Object.assign(apply, { inject })).await()
    expect(ctx.slots.entries('conversation.composer.dock').length).toBeGreaterThan(0)
    await fiber.dispose()
    expect(ctx.slots.entries('conversation.composer.dock')).toHaveLength(0)
  })
})
