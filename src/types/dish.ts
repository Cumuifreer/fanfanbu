import { DISH_CATEGORY, DISH_FILTER } from '../constants/categories';

export type DishCategory =
  (typeof DISH_CATEGORY)[keyof typeof DISH_CATEGORY];

export type DishFilter = (typeof DISH_FILTER)[keyof typeof DISH_FILTER];

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  ingredients: string[];
  recipeSteps: string[];
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MenuDataset {
  updatedAt: string;
  dishes: Dish[];
}

export interface DishUpsertInput {
  name: string;
  category: DishCategory;
  ingredients: string[];
  recipeSteps: string[];
  image: string | null;
}

export interface DishCounts {
  total: number;
  red: number;
  white: number;
  setMeal: number;
}

export interface EditorDishDraft {
  id: string | null;
  name: string;
  category: DishCategory;
  ingredients: string[];
  recipeSteps: string[];
  image: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface RandomMenuSettings {
  redCount: number;
  whiteCount: number;
  includeSetMeals: boolean;
  setMealCount: number;
}

export interface RandomMenuResult {
  redDishes: Dish[];
  whiteDishes: Dish[];
  setMeals: Dish[];
  generatedAt: string;
}

export interface EditorPublishResult {
  status: 'published' | 'no_changes';
  message: string;
  branch?: string;
  commitMessage?: string;
}

export interface ToastItem {
  id: string;
  tone: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}
