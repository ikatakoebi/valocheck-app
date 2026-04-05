const STORAGE_KEY = 'valocheck_search_history';
const MAX_ENTRIES = 10;

export interface SearchHistoryEntry {
  name: string;
  tag: string;
  rankTier: string | null; // e.g. "Diamond 1" or null
  rankTierNumber: number | null;
  timestamp: number;
}

export function getSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function addSearchHistory(entry: Omit<SearchHistoryEntry, 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getSearchHistory();

    // Remove existing entry for same player (name+tag, case-insensitive)
    const filtered = history.filter(
      (h) =>
        !(
          h.name.toLowerCase() === entry.name.toLowerCase() &&
          h.tag.toLowerCase() === entry.tag.toLowerCase()
        )
    );

    // Add new entry at the beginning
    const newEntry: SearchHistoryEntry = {
      ...entry,
      timestamp: Date.now(),
    };
    filtered.unshift(newEntry);

    // Limit to MAX_ENTRIES
    const trimmed = filtered.slice(0, MAX_ENTRIES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage might be full or disabled
  }
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
