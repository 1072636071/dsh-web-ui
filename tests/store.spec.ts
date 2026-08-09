/**
 * Task-store tests: localStorage backend round-trips, corrupt-document
 * handling, invalid-row dropping, and the in-memory backend.
 */
import { describe, expect, it } from 'vitest'
import {
  InMemoryTaskStore, LocalStorageTaskStore, isTaskRecord, parseLedger,
} from '../src/core/store.ts'
import { createTask } from '../src/core/tasks.ts'

/** A tiny in-memory Storage stand-in (localStorage shape). */
class FakeStorage implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  private map = new Map<string, string>()
  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }
  removeItem(key: string): void {
    this.map.delete(key)
  }
  entries(): [string, string][] {
    return [...this.map.entries()]
  }
}

function sampleLedger() {
  return [
    createTask({ title: 'A', description: 'd', prompt: 'p' }, 1, 't-1'),
    createTask({ title: 'B', description: '', prompt: '' }, 2, 't-2'),
  ]
}

describe('LocalStorageTaskStore', () => {
  it('round-trips a ledger through storage', () => {
    const storage = new FakeStorage()
    const store = new LocalStorageTaskStore('k', storage)
    expect(store.load()).toEqual([])
    store.save(sampleLedger())
    expect(store.load()).toEqual(sampleLedger())
  })

  it('persists under the configured key with a JSON document', () => {
    const storage = new FakeStorage()
    const store = new LocalStorageTaskStore('dsh.taskBoard.v1', storage)
    store.save(sampleLedger())
    expect(storage.getItem('dsh.taskBoard.v1')).toBe(JSON.stringify(sampleLedger()))
  })

  it('clears the document on clear()', () => {
    const storage = new FakeStorage()
    const store = new LocalStorageTaskStore('k', storage)
    store.save(sampleLedger())
    store.clear()
    expect(store.load()).toEqual([])
  })

  it('tolerates storage absence (no storage, no throw)', () => {
    const store = new LocalStorageTaskStore('k', undefined)
    expect(store.load()).toEqual([])
    store.save(sampleLedger())
    expect(store.load()).toEqual([])
  })

  it('tolerates throwing storage reads/writes without breaking the board', () => {
    const broken: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
      getItem: () => { throw new Error('quota') },
      setItem: () => { throw new Error('quota') },
      removeItem: () => { throw new Error('quota') },
    }
    const store = new LocalStorageTaskStore('k', broken)
    expect(store.load()).toEqual([])
    expect(() => store.save(sampleLedger())).not.toThrow()
  })
})

describe('parseLedger', () => {
  it('returns an empty ledger for absent documents', () => {
    expect(parseLedger(null)).toEqual([])
  })

  it('returns an empty ledger for invalid JSON or non-array documents', () => {
    expect(parseLedger('not json')).toEqual([])
    expect(parseLedger('{"a":1}')).toEqual([])
  })

  it('drops invalid rows and keeps valid ones', () => {
    const valid = createTask({ title: 'ok', description: '', prompt: '' }, 1, 't-1')
    const ledger = [
      valid,
      { id: 't-2' },                       // missing fields
      { ...valid, id: 't-3', status: 'weird' }, // unknown status → normalized to todo
      null,
      'nope',
    ]
    const parsed = parseLedger(JSON.stringify(ledger))
    expect(parsed).toHaveLength(2)
    expect(parsed[0].id).toBe('t-1')
    expect(parsed[1].id).toBe('t-3')
    expect(parsed[1].status).toBe('todo')
  })
})

describe('isTaskRecord', () => {
  it('validates shape strictly', () => {
    const task = createTask({ title: 'x', description: '', prompt: '' }, 1, 't-1')
    expect(isTaskRecord(task)).toBe(true)
    expect(isTaskRecord({ ...task, status: 'bogus' })).toBe(false)
    expect(isTaskRecord({ ...task, executions: [{ id: 3 }] })).toBe(false)
    expect(isTaskRecord(null)).toBe(false)
    expect(isTaskRecord('x')).toBe(false)
  })
})

describe('InMemoryTaskStore', () => {
  it('stores and clones records (no shared mutation)', () => {
    const store = new InMemoryTaskStore()
    store.save(sampleLedger())
    const loaded = store.load()
    expect(loaded).toEqual(sampleLedger())
    loaded[0].title = 'mutated'
    expect(store.load()[0].title).toBe('A')
    store.clear()
    expect(store.load()).toEqual([])
  })
})
