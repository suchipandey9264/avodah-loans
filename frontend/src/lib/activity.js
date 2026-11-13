import { useSyncExternalStore } from "react";

// Per-user activity log kept in this browser (front-end only).
// Guest activity is merged into the account on login. Replace with API calls when the backend is ready.

const EMPTY = { searches: [], saved: [], applications: [], compares: [], credit: [], callbacks: [], profile: {} };
const key = (uid) => `avodah.activity.${uid || "guest"}`;

const read = (uid) => {
  try {
    return { ...EMPTY, ...(JSON.parse(localStorage.getItem(key(uid))) ?? {}) };
  } catch {
    return { ...EMPTY };
  }
};
const write = (uid, s) => {
  try { localStorage.setItem(key(uid), JSON.stringify(s)); } catch { /* storage unavailable */ }
};

let uid = null;
let state = read(null);
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

function commit(next) {
  state = next;
  write(uid, state);
  emit();
}

const byKey = (list, k) => {
  const seen = new Set();
  return list.filter((x) => (seen.has(x[k]) ? false : seen.add(x[k])));
};

/** Switch the active user; on login, guest activity is folded into the account. */
export function setActivityUser(phone) {
  if (phone && phone !== uid) {
    const guest = read(null);
    const mine = read(phone);
    const merged = { ...mine, profile: { ...guest.profile, ...mine.profile } };
    for (const k of ["searches", "saved", "applications", "compares", "credit", "callbacks"]) {
      merged[k] = byKey([...guest[k], ...mine[k]].sort((a, b) => b.ts - a.ts), k === "saved" ? "key" : k === "searches" ? "query" : "ts");
    }
    write(phone, merged);
    try { localStorage.removeItem(key(null)); } catch { /* ignore */ }
  }
  uid = phone || null;
  state = read(uid);
  emit();
}

const subscribe = (l) => (listeners.add(l), () => listeners.delete(l));
export const useActivity = () => useSyncExternalStore(subscribe, () => state);

const now = () => Date.now();

export function logSearch(s) {
  const rest = state.searches.filter((x) => x.query !== s.query);
  commit({ ...state, searches: [{ ...s, ts: now() }, ...rest].slice(0, 30) });
}
export const removeSearch = (query) => commit({ ...state, searches: state.searches.filter((x) => x.query !== query) });

export const isSaved = (k) => state.saved.some((x) => x.key === k);
export function toggleSaved(offer) {
  const exists = state.saved.some((x) => x.key === offer.key);
  commit({ ...state, saved: exists ? state.saved.filter((x) => x.key !== offer.key) : [{ ...offer, ts: now() }, ...state.saved] });
  return !exists;
}

export function addApplication(app) {
  commit({ ...state, applications: [{ ...app, ts: now() }, ...state.applications] });
}
export const logCompare = (names, type) => commit({ ...state, compares: [{ names, type, ts: now() }, ...state.compares].slice(0, 20) });
export const logCredit = (r) => commit({ ...state, credit: [{ ...r, ts: now() }, ...state.credit] });
export const logCallback = (r) => commit({ ...state, callbacks: [{ ...r, ts: now() }, ...state.callbacks] });
export const updateProfile = (p) => commit({ ...state, profile: { ...state.profile, ...p } });
export const clearActivity = () => commit({ ...EMPTY, profile: state.profile });
