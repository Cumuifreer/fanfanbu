import { DISH_CATEGORY } from '../constants/categories';
import type { Dish, RandomMenuResult, RandomMenuSettings } from '../types/dish';

const pickRandom = (items: Dish[], count: number) => {
  const pool = [...items];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, count);
};

export const createRandomMenu = (
  dishes: Dish[],
  settings: RandomMenuSettings,
): RandomMenuResult => {
  const redDishes = dishes.filter((dish) => dish.category === DISH_CATEGORY.RED);
  const whiteDishes = dishes.filter(
    (dish) => dish.category === DISH_CATEGORY.WHITE,
  );
  const setMeals = dishes.filter(
    (dish) => dish.category === DISH_CATEGORY.SET_MEAL,
  );

  return {
    redDishes: pickRandom(redDishes, settings.redCount),
    whiteDishes: pickRandom(whiteDishes, settings.whiteCount),
    setMeals: settings.includeSetMeals
      ? pickRandom(setMeals, settings.setMealCount)
      : [],
    generatedAt: new Date().toISOString(),
  };
};

export const canGenerateRandomMenu = (
  dishes: Dish[],
  settings: RandomMenuSettings,
) => {
  const redCount = dishes.filter((dish) => dish.category === DISH_CATEGORY.RED).length;
  const whiteCount = dishes.filter(
    (dish) => dish.category === DISH_CATEGORY.WHITE,
  ).length;
  const setMealCount = dishes.filter(
    (dish) => dish.category === DISH_CATEGORY.SET_MEAL,
  ).length;

  if (redCount < settings.redCount) {
    return {
      ok: false,
      message: `红区菜目前只有 ${redCount} 道，暂时无法随机出 ${settings.redCount} 道。`,
    };
  }

  if (whiteCount < settings.whiteCount) {
    return {
      ok: false,
      message: `白区菜目前只有 ${whiteCount} 道，暂时无法随机出 ${settings.whiteCount} 道。`,
    };
  }

  if (settings.includeSetMeals && setMealCount < settings.setMealCount) {
    return {
      ok: false,
      message: `定食目前只有 ${setMealCount} 套，暂时无法随机出 ${settings.setMealCount} 套。`,
    };
  }

  return { ok: true, message: '' };
};
