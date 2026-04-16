import { STORAGE_KEYS } from '../constants/app';
import type { RandomMenuSettings } from '../types/dish';

const safeWindow = () =>
  typeof window !== 'undefined' ? window.localStorage : null;

export const loadJsonState = <T,>(key: string, fallback: T): T => {
  const storage = safeWindow();

  if (!storage) {
    return fallback;
  }

  try {
    const raw = storage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const saveJsonState = <T,>(key: string, value: T) => {
  const storage = safeWindow();

  if (!storage) {
    throw new Error('当前环境不支持本地存储。');
  }

  storage.setItem(key, JSON.stringify(value));
};

export const loadRandomSettings = (fallback: RandomMenuSettings) =>
  loadJsonState<RandomMenuSettings>(STORAGE_KEYS.randomSettings, fallback);

export const saveRandomSettings = (value: RandomMenuSettings) =>
  saveJsonState(STORAGE_KEYS.randomSettings, value);
