const KEY = 'hello-harbour-v1';
const blank = () => ({ version: 1, day: 1, scene: 0, completed: [], firstTry: [], attempts: {}, saved: [], notes: [], activities: [], started: false, name: 'Charlie', sound: true, reducedMotion: false });
export function readState(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(KEY));
    if (!value || value.version !== 1) return blank();
    const state = { ...blank(), ...value };
    state.day = Math.min(30, Math.max(1, Math.trunc(Number(state.day) || 1)));
    state.scene = Math.min(2, Math.max(0, Math.trunc(Number(state.scene) || 0)));
    for (const key of ['completed', 'firstTry', 'saved']) state[key] = Array.isArray(state[key]) ? [...new Set(state[key].filter(v => typeof v === 'string' && /^\d{1,2}-[0-2]$/.test(v)))] : [];
    state.notes = Array.isArray(state.notes) ? state.notes.filter(n => n && typeof n.text === 'string' && typeof n.day === 'number').slice(-30) : [];
    state.activities = Array.isArray(state.activities) ? state.activities.filter(v=>typeof v==='string'&&/^\d{1,2}:(home|cafe|market|work|park|books)$/.test(v)).slice(-180) : [];
    state.attempts = state.attempts && typeof state.attempts === 'object' && !Array.isArray(state.attempts) ? state.attempts : {};
    state.name = typeof state.name === 'string' ? state.name.slice(0, 24) : 'Charlie';
    return state;
  } catch { return blank(); }
}
export function saveState(state, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}
export function eraseState(storage = globalThis.localStorage) { storage.removeItem(KEY); }
export function progress(state) {
  return { completed: state.completed.length, percent: Math.round(state.completed.length / 90 * 100), days: Math.floor(state.completed.length / 3), firstTry: state.firstTry.length };
}
