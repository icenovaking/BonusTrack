import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const control = vi.hoisted(() => ({ callbacks: {} as Record<string, (...args: any[]) => any>, update: vi.fn() }))
vi.mock('virtual:pwa-register/vue', () => ({ useRegisterSW: (callbacks: typeof control.callbacks) => {
  control.callbacks = callbacks
  return { needRefresh: ref(true), updateServiceWorker: control.update }
} }))

beforeEach(() => {
  vi.resetModules(); control.update.mockReset().mockResolvedValue(undefined)
  const windowMock = new EventTarget() as EventTarget & { confirm: ReturnType<typeof vi.fn> }
  windowMock.confirm = vi.fn().mockReturnValue(false)
  vi.stubGlobal('window', windowMock)
  vi.stubGlobal('navigator', { onLine: true, serviceWorker: { ready: Promise.resolve({ active: {} }) } })
})

describe('PWA installation and updates', () => {
  it('does not claim offline readiness before caching and reports registration failure', async () => {
    const pwa = await import('../src/pwa')
    expect(pwa.offlineReady.value).toBe(false)
    control.callbacks.onRegisterError!()
    expect(pwa.registrationError.value).toBe(true)
    expect(pwa.offlineReady.value).toBe(false)
  })
  it('announces completed caching and tracks loss and return of connectivity', async () => {
    const pwa = await import('../src/pwa')
    control.callbacks.onOfflineReady!()
    expect(pwa.offlineReady.value).toBe(true)
    window.dispatchEvent(new Event('offline')); expect(pwa.isOnline.value).toBe(false)
    window.dispatchEvent(new Event('online')); expect(pwa.isOnline.value).toBe(true)
  })
  it('recognizes an already activated offline worker on reopening', async () => {
    const pwa = await import('../src/pwa')
    control.callbacks.onRegisteredSW!('/sw.js', { active: {} })
    await Promise.resolve()
    expect(pwa.offlineReady.value).toBe(true)
  })
  it('keeps unsaved input when an update is declined and updates after explicit discard', async () => {
    const pwa = await import('../src/pwa'), { state } = await import('../src/state')
    state.dirty = true
    await pwa.activateUpdate()
    expect(control.update).not.toHaveBeenCalled()
    expect(state.dirty).toBe(true)
    vi.mocked(window.confirm).mockReturnValue(true)
    await pwa.activateUpdate()
    expect(state.dirty).toBe(false)
    expect(control.update).toHaveBeenCalledExactlyOnceWith(true)
  })
  it('does not update while saving and retains committed records on update failure', async () => {
    const pwa = await import('../src/pwa'), { state } = await import('../src/state')
    state.busy = true
    await pwa.activateUpdate(); expect(control.update).not.toHaveBeenCalled()
    state.busy = false
    const snapshot = structuredClone(JSON.parse(JSON.stringify(state.data)))
    control.update.mockRejectedValue(new Error('offline'))
    await pwa.activateUpdate()
    expect(state.message).toContain('更新失敗')
    expect(JSON.parse(JSON.stringify(state.data))).toEqual(snapshot)
  })
  it('offers install only when the browser supplies a prompt and clears it afterwards', async () => {
    const pwa = await import('../src/pwa')
    expect(pwa.canInstall.value).toBeNull()
    await pwa.installApp()
    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = new Event('beforeinstallprompt', { cancelable: true })
    Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(pwa.canInstall.value).not.toBeNull()
    await pwa.installApp()
    expect(prompt).toHaveBeenCalledOnce()
    expect(pwa.canInstall.value).toBeNull()
  })
})
