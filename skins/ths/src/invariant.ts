/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-skin-ths`.
 * @module @deepseek-ai/dsh-client-ui-skin-ths/invariant
 */

/* jscpd:ignore-start */
import type { Context } from 'cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-skin-ths'

/** Cordis companion plugin name. */
export const name = 'client-ui-skin-ths-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the skin owns no cordis events and no cross-plugin
 * mutable state — its whole contract is a set of DOM writes (body attribute,
 * chrome bars, title, favicon) that apply() performs and its effect disposer
 * retracts, asserted by this package's apply spec against the assembled
 * shell (the shipped web composition boots it in the keyless e2e).
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
