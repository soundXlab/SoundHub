import "@testing-library/jest-dom";

// Mock fetch for API calls
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  // Default mock - can be overridden in individual tests
  return originalFetch(...args);
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock URL.createObjectURL and revokeObjectURL
URL.createObjectURL = vi.fn(() => "blob:mock-url");
URL.revokeObjectURL = vi.fn();

// Mock alert
window.alert = vi.fn();
