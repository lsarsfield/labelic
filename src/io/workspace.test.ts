import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeBlankDoc, type LabelDoc } from '../model/types'
import { useLabel } from '../state/store'
import {
  _resetWorkspaceForTests,
  boot,
  createFromDoc,
  currentId,
  flushPendingSave,
  getStatus,
  list,
  memoryBackend,
  open,
  remove,
  startWorkspaceAutosave,
  type WorkspaceBackend,
  type WorkspaceMeta,
} from './workspace'

/** memoryBackend + call counters + optional fault injection. */
function spyBackend(inner: WorkspaceBackend = memoryBackend()) {
  const counts = { putEntry: 0, putMeta: 0, deleteEntry: 0 }
  let failNextPutWith: unknown = null
  let failAllPutsWith: unknown = null
  const backend: WorkspaceBackend = {
    listMetas: () => inner.listMetas(),
    getDoc: (id) => inner.getDoc(id),
    putEntry: async (id, doc, meta) => {
      counts.putEntry += 1
      if (failAllPutsWith) throw failAllPutsWith
      if (failNextPutWith) {
        const err = failNextPutWith
        failNextPutWith = null
        throw err
      }
      return inner.putEntry(id, doc, meta)
    },
    putMeta: async (meta) => {
      counts.putMeta += 1
      return inner.putMeta(meta)
    },
    deleteEntry: async (id) => {
      counts.deleteEntry += 1
      return inner.deleteEntry(id)
    },
  }
  return {
    backend,
    counts,
    failNextPut: (err: unknown) => {
      failNextPutWith = err
    },
    failAllPuts: (err: unknown) => {
      failAllPutsWith = err
    },
    inner,
  }
}

const fakeStorage = () => {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    _map: map,
  }
}

let storageStub: ReturnType<typeof fakeStorage>
let stopAutosave: (() => void) | null = null

const doc = (name: string): LabelDoc => ({ ...makeBlankDoc(), name })

const metaByName = (metas: WorkspaceMeta[], name: string) =>
  metas.find((m) => m.name === name) ?? null

beforeEach(() => {
  vi.useFakeTimers()
  storageStub = fakeStorage()
  vi.stubGlobal('localStorage', storageStub)
  _resetWorkspaceForTests()
  useLabel.getState().setDoc(makeBlankDoc())
  useLabel.temporal.getState().clear()
})

afterEach(() => {
  stopAutosave?.()
  stopAutosave = null
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('boot', () => {
  it('opens the pointer entry; falls back to most recent on a dangling pointer', async () => {
    const spy = spyBackend()
    await spy.backend.putEntry('a', doc('Older'), { id: 'a', name: 'Older', updatedAt: 100, thumbSvg: null })
    await spy.backend.putEntry('b', doc('Newer'), { id: 'b', name: 'Newer', updatedAt: 200, thumbSvg: null })

    storageStub.setItem('labelic:current', 'a')
    await boot(spy.backend)
    expect(useLabel.getState().doc.name).toBe('Older')

    _resetWorkspaceForTests()
    storageStub.setItem('labelic:current', 'nope')
    await boot(spy.backend)
    expect(useLabel.getState().doc.name).toBe('Newer')
  })

  it('seeds the blank template when the workspace is empty', async () => {
    await boot(spyBackend().backend)
    expect(useLabel.getState().doc.name).toBe('Untitled label')
    expect(await list()).toHaveLength(1)
  })

  it('falls back past a corrupt entry without deleting it', async () => {
    const spy = spyBackend()
    await spy.backend.putEntry('bad', { junk: true }, { id: 'bad', name: 'Bad', updatedAt: 300, thumbSvg: null })
    await spy.backend.putEntry('good', doc('Good'), { id: 'good', name: 'Good', updatedAt: 200, thumbSvg: null })

    await boot(spy.backend)
    expect(useLabel.getState().doc.name).toBe('Good')
    expect(await spy.backend.getDoc('bad')).toBeDefined() // never deleted
  })
})

describe('debounced pair-capturing saver', () => {
  async function bootWithA(spy = spyBackend()) {
    await spy.backend.putEntry('A', doc('Alpha'), { id: 'A', name: 'Alpha', updatedAt: 100, thumbSvg: null })
    storageStub.setItem('labelic:current', 'A')
    await boot(spy.backend)
    stopAutosave = startWorkspaceAutosave()
    return spy
  }

  it('coalesces edits into one save under the current id', async () => {
    const spy = await bootWithA()
    const before = spy.counts.putEntry
    useLabel.getState().updateDocMeta({ name: 'one' })
    await vi.advanceTimersByTimeAsync(500)
    useLabel.getState().updateDocMeta({ name: 'two' })
    await vi.advanceTimersByTimeAsync(1000)
    expect(spy.counts.putEntry).toBe(before + 1)
    const stored = (await spy.backend.getDoc('A')) as LabelDoc
    expect(stored.name).toBe('two')
  })

  it('switching flushes the previous entry first — B never lands under A', async () => {
    const spy = await bootWithA()
    await spy.backend.putEntry('B', doc('Bravo'), { id: 'B', name: 'Bravo', updatedAt: 50, thumbSvg: null })

    useLabel.getState().updateDocMeta({ name: 'Alpha edited' })
    await open('B') // no timer advance: the pending save must flush inside the switch
    const storedA = (await spy.backend.getDoc('A')) as LabelDoc
    const storedB = (await spy.backend.getDoc('B')) as LabelDoc
    expect(storedA.name).toBe('Alpha edited')
    expect(storedB.name).toBe('Bravo')
    expect(currentId()).toBe('B')
  })

  it('opening an entry does not bump its updatedAt or write anything', async () => {
    const spy = await bootWithA()
    await spy.backend.putEntry('B', doc('Bravo'), { id: 'B', name: 'Bravo', updatedAt: 50, thumbSvg: null })
    const before = spy.counts.putEntry
    await open('B')
    await vi.advanceTimersByTimeAsync(5000)
    expect(spy.counts.putEntry).toBe(before) // suppression swallowed the setDoc
    const metas = await list()
    expect(metaByName(metas, 'Bravo')!.updatedAt).toBe(50)
  })

  it('the first real edit after a switch is saved (suppression is one-shot)', async () => {
    const spy = await bootWithA()
    await spy.backend.putEntry('B', doc('Bravo'), { id: 'B', name: 'Bravo', updatedAt: 50, thumbSvg: null })
    await open('B')
    useLabel.getState().updateDocMeta({ name: 'Bravo edited' })
    await vi.advanceTimersByTimeAsync(1000)
    expect(((await spy.backend.getDoc('B')) as LabelDoc).name).toBe('Bravo edited')
  })

  it('remove(current) cancels the pending save — deleted entries never resurrect', async () => {
    const spy = await bootWithA()
    await spy.backend.putEntry('B', doc('Bravo'), { id: 'B', name: 'Bravo', updatedAt: 50, thumbSvg: null })

    useLabel.getState().updateDocMeta({ name: 'Alpha dying words' })
    await remove('A')
    await vi.advanceTimersByTimeAsync(5000)
    expect(await spy.backend.getDoc('A')).toBeUndefined() // no zombie
    expect(currentId()).toBe('B')
  })

  it('removing the last entry seeds a blank doc', async () => {
    await bootWithA()
    await remove('A')
    const metas = await list()
    expect(metas).toHaveLength(1)
    expect(useLabel.getState().doc.name).toBe('Untitled label')
  })

  it('createFromDoc leaves the previous entry intact', async () => {
    await bootWithA()
    await createFromDoc(doc('Second label'))
    const metas = await list()
    expect(metas).toHaveLength(2)
    expect(useLabel.getState().doc.name).toBe('Second label')
  })

  it('a revision bump refreshes meta only, preserving list order', async () => {
    const spy = await bootWithA()
    const entriesBefore = spy.counts.putEntry
    useLabel.getState().bumpFontsRevision()
    await vi.advanceTimersByTimeAsync(2500)
    expect(spy.counts.putMeta).toBeGreaterThan(0)
    expect(spy.counts.putEntry).toBe(entriesBefore)
    const metas = await list()
    expect(metaByName(metas, 'Alpha')!.updatedAt).toBe(100) // not an edit
  })

  it('quota errors set status, keep the pair, and retry on the next flush', async () => {
    const spy = await bootWithA()
    spy.failNextPut({ name: 'QuotaExceededError' })

    useLabel.getState().updateDocMeta({ name: 'survives quota' })
    await vi.advanceTimersByTimeAsync(1000)
    expect(getStatus().kind).toBe('quota')
    expect(((await spy.backend.getDoc('A')) as LabelDoc).name).toBe('Alpha') // write failed

    await flushPendingSave() // retry with the retained pair
    expect(((await spy.backend.getDoc('A')) as LabelDoc).name).toBe('survives quota')
    expect(getStatus().kind).toBe('ok')
  })
})
