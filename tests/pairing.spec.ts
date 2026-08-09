/** PairingService semantics: one-time tokens, expiry, refresh, stop, presence. */
import { describe, expect, it } from 'vitest'
import { PairingService, type PairingConfig } from '../src/pairing.ts'

function makeService(overrides: Partial<PairingConfig> = {}) {
  let counter = 0
  const service = new PairingService({
    tokenTtlMs: 60_000,
    offlineAfterMs: 10_000,
    maxDevices: 2,
    cookieName: 'dsh_pair',
    ...overrides,
  }, {
    now: () => now,
    randomToken: () => `tok-${String(++counter).padStart(4, '0')}`,
  })
  service.setLanBaseUrl('http://192.168.1.5:3080')
  return service
}

let now = 0
beforeEach0()

function beforeEach0(): void {
  now = 1_000_000
}

describe('PairingService', () => {
  it('issues one active token and replaces it on refresh (old link dies)', () => {
    const service = makeService()
    const first = service.issue()
    expect(service.accept(first.token)).toMatchObject({ ok: true })
    // Refresh: the previous token record is gone, so reuse is invalid.
    const second = service.issue()
    expect(second.token).not.toBe(first.token)
    expect(service.accept(first.token)).toEqual({ ok: false, code: 'invalid' })
    expect(service.accept(second.token)).toMatchObject({ ok: true })
  })

  it('refuses a consumed token (one-time) with used', () => {
    const service = makeService()
    const { token } = service.issue()
    expect(service.accept(token)).toMatchObject({ ok: true })
    expect(service.accept(token)).toEqual({ ok: false, code: 'used' })
  })

  it('refuses an expired token as invalid', () => {
    const service = makeService()
    const { token } = service.issue()
    now += 61_000
    expect(service.accept(token)).toEqual({ ok: false, code: 'invalid' })
  })

  it('refuses an unknown token as invalid', () => {
    const service = makeService()
    expect(service.accept('nope')).toEqual({ ok: false, code: 'invalid' })
  })

  it('throws lan-required when no LAN base is set (no unusable QR)', () => {
    const service = makeService()
    service.setLanBaseUrl(undefined)
    expect(() => service.issue()).toThrow(/--host 0.0.0.0/)
  })

  it('stop revokes devices and tokens; a fresh issue re-arms', () => {
    const service = makeService()
    const { token } = service.issue()
    const accepted = service.accept(token)
    expect(accepted.ok).toBe(true)
    const deviceId = accepted.ok ? accepted.deviceId : ''
    expect(service.hasDevice(deviceId)).toBe(true)
    service.stop()
    expect(service.hasDevice(deviceId)).toBe(false)
    expect(service.touchDevice(deviceId)).toBe(false)
    expect(service.accept(token)).toEqual({ ok: false, code: 'invalid' })
    expect(service.snapshot().phase).toBe('stopped')
    // Refresh re-arms from the stopped state.
    service.issue()
    expect(service.snapshot().phase).toBe('waiting')
  })

  it('tracks presence: touch keeps a device online, then it ages offline', () => {
    const service = makeService()
    const { token } = service.issue()
    const accepted = service.accept(token)
    const deviceId = accepted.ok ? accepted.deviceId : ''
    expect(service.snapshot().phase).toBe('connected')
    now += 9_000
    service.sweep()
    expect(service.snapshot().phase).toBe('connected')
    now += 2_000
    service.sweep()
    expect(service.snapshot().phase).toBe('disconnected')
    // Activity brings it back online.
    expect(service.touchDevice(deviceId)).toBe(true)
    expect(service.snapshot().phase).toBe('connected')
  })

  it('notifies listeners only on real snapshot changes', () => {
    const service = makeService()
    const seen: string[] = []
    service.onState(snapshot => { seen.push(snapshot.phase) })
    service.issue()
    expect(seen).toEqual(['waiting'])
    service.sweep()
    expect(seen).toEqual(['waiting'])
    const { token } = service.issue()
    const accepted = service.accept(token)
    expect(accepted.ok).toBe(true)
    expect(seen).toEqual(['waiting', 'waiting', 'connected'])
  })

  it('evicts the oldest device at the session cap', () => {
    const service = makeService({ maxDevices: 2 })
    const first = service.issue()
    const a = service.accept(first.token)
    const second = service.issue()
    const b = service.accept(second.token)
    const third = service.issue()
    const c = service.accept(third.token)
    const aId = a.ok ? a.deviceId : ''
    const bId = b.ok ? b.deviceId : ''
    const cId = c.ok ? c.deviceId : ''
    expect(service.hasDevice(aId)).toBe(false)
    expect(service.hasDevice(bId)).toBe(true)
    expect(service.hasDevice(cId)).toBe(true)
    expect(service.snapshot().deviceCount).toBe(2)
  })
})
