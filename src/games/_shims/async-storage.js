// Web shim for @react-native-async-storage/async-storage backed by
// window.localStorage (with an in-memory fallback for private-mode failures).
const mem = new Map()

const AsyncStorage = {
  async getItem(key) {
    try { return window.localStorage.getItem(key) }
    catch { return mem.has(key) ? mem.get(key) : null }
  },
  async setItem(key, value) {
    try { window.localStorage.setItem(key, value) }
    catch { mem.set(key, value) }
  },
  async removeItem(key) {
    try { window.localStorage.removeItem(key) }
    catch { mem.delete(key) }
  },
}

export default AsyncStorage
