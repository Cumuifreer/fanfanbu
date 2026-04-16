import { CATEGORY_META } from '../constants/categories';
import { formatUpdatedAt } from '../lib/dish-form';
import { resolveAssetUrl } from '../lib/menu-data';
import type { Dish } from '../types/dish';

interface DishCardProps {
  dish: Dish;
  onSelect?: (dish: Dish) => void;
}

export const DishCard = ({ dish, onSelect }: DishCardProps) => (
  <article className="dish-card">
    <div className="dish-card__media">
      {dish.image ? (
        <img
          src={resolveAssetUrl(dish.image)}
          alt={dish.name}
          className="dish-card__image"
        />
      ) : (
        <div className="dish-card__placeholder">
          <span>暂无图片</span>
        </div>
      )}

      <span className={`dish-badge dish-badge--${dish.category}`}>
        {CATEGORY_META[dish.category].label}
      </span>
    </div>

    <div className="dish-card__body">
      <div className="dish-card__head">
        <div>
          <h3>{dish.name}</h3>
          <p>{CATEGORY_META[dish.category].description}</p>
        </div>
      </div>

      <section className="dish-card__section">
        <h4>材料</h4>
        {dish.ingredients.length ? (
          <div className="ingredient-list">
            {dish.ingredients.map((ingredient) => (
              <span className="ingredient-chip" key={`${dish.id}-${ingredient}`}>
                {ingredient}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted-copy">材料暂未填写，后续可在编辑模式中补充。</p>
        )}
      </section>

      <section className="dish-card__section">
        <h4>菜谱</h4>
        {dish.recipeSteps.length ? (
          <ol className="recipe-step-list">
            {dish.recipeSteps.map((step, index) => (
              <li key={`${dish.id}-step-${index}`}>
                <span className="recipe-step-list__index">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted-copy">暂无菜谱，后续可以再补充。</p>
        )}
      </section>

      <footer className="dish-card__footer">
        <span>最近更新：{formatUpdatedAt(dish.updatedAt)}</span>
        {onSelect ? (
          <button type="button" className="ghost-button" onClick={() => onSelect(dish)}>
            查看详情
          </button>
        ) : null}
      </footer>
    </div>
  </article>
);
