const STORAGE_KEY = 'rebuiltCheckoutState';

// Steps that are transient/in-motion rather than a stable place to land
// back on after a refresh -- resuming into these could re-trigger a
// checkout redirect or show a stale confirmation. Refreshing during these
// falls back to the last stable step instead.
const TRANSIENT_STEPS = new Set(['shopifyRedirect', 'confirmation']);

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      step: TRANSIENT_STEPS.has(parsed.step) ? 'checkout' : parsed.step,
      allergySelected: new Set(parsed.allergySelected || []),
    };
  } catch {
    return null;
  }
}

export function savePersistedState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      allergySelected: [...state.allergySelected],
    }));
  } catch {
    // Private browsing / storage quota / disabled storage -- persistence
    // is a nice-to-have, not worth breaking the app over.
  }
}

export function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
