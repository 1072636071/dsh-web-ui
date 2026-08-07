//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-skin-deepseek-whale`.
* @module @deepseek-ai/dsh-client-ui-skin-deepseek-whale/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-skin-deepseek-whale";
/** Cordis companion plugin name. */
const name = "client-ui-skin-deepseek-whale-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the skin owns no cordis events and no cross-plugin
* mutable state — its whole contract is a set of DOM writes (body attribute,
* chrome bars, title, favicon) that apply() performs and its effect disposer
* retracts, asserted by this package's apply spec against the assembled
* shell (the shipped web composition boots it in the keyless e2e).
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
