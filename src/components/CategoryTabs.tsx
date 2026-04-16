import { DISH_FILTER, FILTER_OPTIONS } from '../constants/categories';
import type { DishFilter } from '../types/dish';

interface CategoryTabsProps {
  activeFilter: DishFilter;
  counts: {
    total: number;
    red: number;
    white: number;
    setMeal: number;
  };
  onChange: (nextFilter: DishFilter) => void;
}

const countByFilter = (
  filter: DishFilter,
  counts: CategoryTabsProps['counts'],
) => {
  switch (filter) {
    case DISH_FILTER.RED:
      return counts.red;
    case DISH_FILTER.WHITE:
      return counts.white;
    case DISH_FILTER.SET_MEAL:
      return counts.setMeal;
    default:
      return counts.total;
  }
};

export const CategoryTabs = ({
  activeFilter,
  counts,
  onChange,
}: CategoryTabsProps) => (
  <div className="tabs" role="tablist" aria-label="菜品分类">
    {FILTER_OPTIONS.map((option) => {
      const isActive = option.value === activeFilter;

      return (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={`tab-button ${isActive ? 'is-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          <span>{option.label}</span>
          <span className="tab-button__count">
            {countByFilter(option.value, counts)}
          </span>
        </button>
      );
    })}
  </div>
);
