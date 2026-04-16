import { DISH_CATEGORY } from '../constants/categories';
import type {
  Dish,
  DishCounts,
  DishFilter,
  DishUpsertInput,
  EditorDishDraft,
} from '../types/dish';

const comparableDate = (value: string) => Date.parse(value) || 0;

export const createEmptyDishDraft = (): EditorDishDraft => ({
  id: null,
  name: '',
  category: DISH_CATEGORY.RED,
  ingredients: [],
  recipeSteps: [],
  image: null,
  createdAt: null,
  updatedAt: null,
});

export const createDishId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `dish-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const normalizeStringList = (items: string[]) =>
  items.map((item) => item.trim()).filter(Boolean);

export const dishToDraft = (dish: Dish): EditorDishDraft => ({
  id: dish.id,
  name: dish.name,
  category: dish.category,
  ingredients: [...dish.ingredients],
  recipeSteps: [...dish.recipeSteps],
  image: dish.image,
  createdAt: dish.createdAt,
  updatedAt: dish.updatedAt,
});

export const draftToDishInput = (draft: EditorDishDraft): DishUpsertInput => ({
  name: draft.name.trim(),
  category: draft.category,
  ingredients: normalizeStringList(draft.ingredients),
  recipeSteps: normalizeStringList(draft.recipeSteps),
  image: draft.image,
});

export const validateDishInput = (input: DishUpsertInput) => {
  if (!input.name.trim()) {
    return '请先填写菜名。';
  }

  return null;
};

export const sortDishesByUpdatedAt = (dishes: Dish[]) =>
  [...dishes].sort(
    (left, right) => comparableDate(right.updatedAt) - comparableDate(left.updatedAt),
  );

export const buildDishCounts = (dishes: Dish[]): DishCounts => ({
  total: dishes.length,
  red: dishes.filter((dish) => dish.category === DISH_CATEGORY.RED).length,
  white: dishes.filter((dish) => dish.category === DISH_CATEGORY.WHITE).length,
  setMeal: dishes.filter((dish) => dish.category === DISH_CATEGORY.SET_MEAL).length,
});

export const matchesDishSearch = (dish: Dish, keyword: string) => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return true;
  }

  const haystack = [
    dish.name,
    dish.ingredients.join(' '),
    dish.recipeSteps.join(' '),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedKeyword);
};

export const matchesDishFilter = (dish: Dish, filter: DishFilter) =>
  filter === 'all' ? true : dish.category === filter;

export const isDraftEmpty = (draft: EditorDishDraft) => {
  const input = draftToDishInput(draft);

  return (
    !input.name &&
    input.ingredients.length === 0 &&
    input.recipeSteps.length === 0 &&
    !input.image
  );
};

export const isDraftDirty = (draft: EditorDishDraft, baseline: Dish | null) => {
  const current = draftToDishInput(draft);

  if (!baseline) {
    return !isDraftEmpty(draft);
  }

  const baselineComparable: DishUpsertInput = {
    name: baseline.name,
    category: baseline.category,
    ingredients: [...baseline.ingredients],
    recipeSteps: [...baseline.recipeSteps],
    image: baseline.image,
  };

  return JSON.stringify(current) !== JSON.stringify(baselineComparable);
};

export const formatUpdatedAt = (iso: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
