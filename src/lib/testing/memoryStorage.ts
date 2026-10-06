/**
 * LocalStorage mínimo en memoria para pruebas, con opción de simular la
 * cuota llena.
 */
export class MemoryStorage {
  private data = new Map<string, string>();
  full = false;

  get length() {
    return this.data.size;
  }
  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null;
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.full) throw new Error('QuotaExceededError');
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}
