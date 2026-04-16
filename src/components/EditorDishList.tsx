import { CATEGORY_META } from '../constants/categories';
import { formatUpdatedAt } from '../lib/dish-form';
import type { Dish, DishCounts } from '../types/dish';

interface EditorDishListProps {
  dishes: Dish[];
  counts: DishCounts;
  activeDishId: string | null;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  onCreate: () => void;
  onSelect: (dishId: string) => void;
}

export const EditorDishList = ({
  dishes,
  counts,
  activeDishId,
  searchText,
  onSearchTextChange,
  onCreate,
  onSelect,
}: EditorDishListProps) => (
  <aside className="editor-sidebar">
    <div className="editor-sidebar__top">
      <div>
        <h2>菜单维护</h2>
        <p>新增、修改、删除都在这里完成，保存后会直接更新共享数据文件。</p>
      </div>
      <button type="button" className="button button--primary" onClick={onCreate}>
        新建菜品
      </button>
    </div>

    <div className="editor-sidebar__stats">
      <span>全部 {counts.total}</span>
      <span>红区 {counts.red}</span>
      <span>白区 {counts.white}</span>
      <span>定食 {counts.setMeal}</span>
    </div>

    <div className="search-card search-card--editor">
      <div className="search-card__icon" aria-hidden="true">
        搜
      </div>
      <input
        type="search"
        className="search-card__input"
        placeholder="搜索菜名"
        value={searchText}
        onChange={(event) => onSearchTextChange(event.target.value)}
      />
    </div>

    <div className="editor-dish-list">
      {dishes.length ? (
        dishes.map((dish) => {
          const isActive = dish.id === activeDishId;

          return (
            <button
              type="button"
              key={dish.id}
              className={`editor-dish-row ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelect(dish.id)}
            >
              <div className="editor-dish-row__head">
                <strong>{dish.name}</strong>
                <span className={`dish-badge dish-badge--${dish.category}`}>
                  {CATEGORY_META[dish.category].label}
                </span>
              </div>
              <span className="editor-dish-row__meta">
                最近更新：{formatUpdatedAt(dish.updatedAt)}
              </span>
            </button>
          );
        })
      ) : (
        <div className="editor-dish-list__empty">
          <h3>还没有匹配到菜品</h3>
          <p>试试换个关键词，或者直接点击“新建菜品”。</p>
        </div>
      )}
    </div>
  </aside>
);
