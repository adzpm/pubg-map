// Node >= 24 defines an experimental globalThis.localStorage (undefined without --localstorage-file) that
// vitest's jsdom environment refuses to override; wire jsdom's real Storage back onto the global instead.
Object.defineProperty(globalThis, 'localStorage', {
    value: globalThis.jsdom.window.localStorage,
    writable: true,
    configurable: true,
})
