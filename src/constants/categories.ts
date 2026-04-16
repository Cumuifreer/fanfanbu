export const DISH_CATEGORY = {
  RED: 'red',
  WHITE: 'white',
  SET_MEAL: 'set_meal',
} as const;

export const DISH_FILTER = {
  ALL: 'all',
  RED: DISH_CATEGORY.RED,
  WHITE: DISH_CATEGORY.WHITE,
  SET_MEAL: DISH_CATEGORY.SET_MEAL,
} as const;

export const CATEGORY_META = {
  [DISH_CATEGORY.RED]: {
    label: '红区',
    shortLabel: '红区菜',
    description: '偏下饭、偏主菜、想吃得满足一点时来这里选。',
  },
  [DISH_CATEGORY.WHITE]: {
    label: '白区',
    shortLabel: '白区菜',
    description: '偏清爽、偏配菜、想搭配得轻盈一点时来这里选。',
  },
  [DISH_CATEGORY.SET_MEAL]: {
    label: '定食',
    shortLabel: '定食',
    description: '完整搭配好的单独一餐，默认不参与红白区随机。',
  },
} as const;

export const FILTER_OPTIONS = [
  { value: DISH_FILTER.ALL, label: '全部菜品' },
  { value: DISH_FILTER.RED, label: CATEGORY_META[DISH_CATEGORY.RED].label },
  { value: DISH_FILTER.WHITE, label: CATEGORY_META[DISH_CATEGORY.WHITE].label },
  {
    value: DISH_FILTER.SET_MEAL,
    label: CATEGORY_META[DISH_CATEGORY.SET_MEAL].label,
  },
] as const;

export const EDITABLE_CATEGORY_OPTIONS = [
  { value: DISH_CATEGORY.RED, label: CATEGORY_META[DISH_CATEGORY.RED].label },
  { value: DISH_CATEGORY.WHITE, label: CATEGORY_META[DISH_CATEGORY.WHITE].label },
  {
    value: DISH_CATEGORY.SET_MEAL,
    label: CATEGORY_META[DISH_CATEGORY.SET_MEAL].label,
  },
] as const;

export const RANDOM_MENU_DEFAULTS = {
  redCount: 2,
  whiteCount: 1,
  includeSetMeals: false,
  setMealCount: 1,
} as const;
