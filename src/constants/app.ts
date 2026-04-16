export const APP_TITLE = import.meta.env.VITE_APP_TITLE?.trim() || '饭饭簿';

export const STORAGE_KEYS = {
  randomSettings: 'fanfanbu:random-settings:v2',
} as const;

export const DATASET_FILE = './data/dishes.json';

export const EDITOR_API = {
  dataset: '/api/editor/dataset',
  uploadImage: '/api/editor/upload-image',
} as const;

const maxImageSizeFromEnv = Number(import.meta.env.VITE_MAX_IMAGE_SIZE_MB);

export const MAX_IMAGE_SIZE_MB = Number.isFinite(maxImageSizeFromEnv)
  ? maxImageSizeFromEnv
  : 1.5;
