import { clone } from "./utils.js";
import { DEFAULT_BENCHMARK, DEFAULT_RULES, DEFAULT_TARGETS, SEED_RECORDS } from "./data.js";

const STORAGE_KEY = "profit-operating-dashboard:v1";

export function createDefaultState() {
  return {
    records: clone(SEED_RECORDS),
    targets: clone(DEFAULT_TARGETS),
    benchmark: clone(DEFAULT_BENCHMARK),
    rules: clone(DEFAULT_RULES),
    snapshots: {},
  };
}

export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createDefaultState();
    const parsed = JSON.parse(saved);
    return {
      ...createDefaultState(),
      ...parsed,
      targets: { ...clone(DEFAULT_TARGETS), ...(parsed.targets || {}) },
      benchmark: { ...clone(DEFAULT_BENCHMARK), ...(parsed.benchmark || {}) },
      rules: Array.isArray(parsed.rules) && parsed.rules.length ? parsed.rules : clone(DEFAULT_RULES),
      records: Array.isArray(parsed.records) ? parsed.records : clone(SEED_RECORDS),
      snapshots: parsed.snapshots || {},
    };
  } catch (error) {
    console.warn("Failed to load state", error);
    return createDefaultState();
  }
}

export function saveState(state) {
  const payload = {
    records: state.records,
    targets: state.targets,
    benchmark: state.benchmark,
    rules: state.rules,
    snapshots: state.snapshots || {},
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return createDefaultState();
}
