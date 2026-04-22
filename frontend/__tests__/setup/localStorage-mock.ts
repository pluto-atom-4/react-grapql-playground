/**
 * Global localStorage mock for test isolation
 * Provides a consistent, in-memory localStorage implementation across all tests
 * Prevents state leakage when tests run in parallel
 */

export const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    length: 0,
    key: () => null,
  };
})();

/**
 * Initialize localStorage mock on globalThis
 * Called from vitest-setup.ts to ensure mock is available before tests run
 */
export function initializeLocalStorageMock() {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}
