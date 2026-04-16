import { DATASET_FILE } from '../constants/app';
import { DISH_CATEGORY } from '../constants/categories';
import { sortDishesByUpdatedAt } from './dish-form';
import type { Dish, DishCategory, MenuDataset } from '../types/dish';

const allowedCategories = new Set<DishCategory>(Object.values(DISH_CATEGORY));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const isDish = (value: unknown): value is Dish => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    allowedCategories.has(candidate.category as DishCategory) &&
    isStringArray(candidate.ingredients) &&
    isStringArray(candidate.recipeSteps) &&
    (typeof candidate.image === 'string' || candidate.image === null) &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  );
};

export const isMenuDataset = (value: unknown): value is MenuDataset => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.updatedAt === 'string' &&
    Array.isArray(candidate.dishes) &&
    candidate.dishes.every(isDish)
  );
};

export const assertMenuDataset = (value: unknown): MenuDataset => {
  if (!isMenuDataset(value)) {
    throw new Error('菜单数据格式不正确，请检查 data/dishes.json。');
  }

  return {
    ...value,
    dishes: sortDishesByUpdatedAt(value.dishes),
  };
};

export const resolveAssetUrl = (path: string) => {
  if (!path || typeof window === 'undefined') {
    return path;
  }

  if (/^(https?:|data:|blob:)/.test(path)) {
    return path;
  }

  const normalizedPath = path.replace(/^(?:\.\/|\/)+/u, '');
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);

  return new URL(normalizedPath, baseUrl).toString();
};

export const loadStaticDataset = async () => {
  const response = await fetch(resolveAssetUrl(DATASET_FILE), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('静态菜单数据读取失败。');
  }

  const parsed: unknown = await response.json();
  return assertMenuDataset(parsed);
};
