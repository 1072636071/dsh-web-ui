/**
 * LAN address derivation for the pairing URL. Mirrors the dsh CLI's
 * boot-time sampling (apps/cli/src/app-cli-entry.ts `resolveLanTrust`): the
 * pairing link may only name an address the /api trust fence was configured
 * with, so the same non-internal IPv4 derivation applies here — an external
 * plugin cannot read the CLI's sampled snapshot, but the fence accepts
 * exactly these literals, which is the property that matters.
 */

import { networkInterfaces } from 'node:os'

/**
 * Non-internal IPv4 interface addresses of this machine — the IP-literal
 * authorities an all-interfaces bind is reachable by on the LAN.
 * @returns the addresses in interface order (possibly empty).
 */
export function lanIPv4Addresses(): string[] {
  return Object.values(networkInterfaces()).flat()
    .filter((iface): iface is NonNullable<typeof iface> => { return iface !== undefined && iface.family === 'IPv4' && !iface.internal })
    .map(iface => iface.address)
}

/**
 * The LAN base URL a phone can reach this server at, or undefined when the
 * bind is not all-interfaces (or the machine has no non-internal IPv4
 * address). Uses the first interface address; multi-interface machines get
 * one deterministic candidate (documented limitation — no per-interface
 * picker).
 * @param host - the effective webserver bind host.
 * @param port - the listening port.
 * @returns `http://<lan-ip>:<port>` or undefined when not LAN-reachable.
 */
export function lanBaseUrl(host: string, port: number): string | undefined {
  if (host !== '0.0.0.0') return undefined
  const address = lanIPv4Addresses()[0]
  return address === undefined ? undefined : `http://${address}:${String(port)}`
}
