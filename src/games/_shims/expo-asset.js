// Web shim for `expo-asset`. Under Vite, `import x from './model.glb'` already
// resolves to the asset URL string, so fromModule just wraps it.
export class Asset {
  constructor(uri) {
    this.uri = uri
    this.localUri = uri
    this.downloaded = true
  }
  static fromModule(mod) {
    const uri =
      typeof mod === 'string' ? mod : (mod && (mod.uri || mod.default)) || mod
    return new Asset(uri)
  }
  async downloadAsync() {
    this.downloaded = true
    return this
  }
}

export default { Asset }
