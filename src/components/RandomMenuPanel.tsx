import { CATEGORY_META, DISH_CATEGORY } from '../constants/categories';
import { resolveAssetUrl } from '../lib/menu-data';
import type { RandomMenuResult, RandomMenuSettings } from '../types/dish';

interface RandomMenuPanelProps {
  counts: {
    total: number;
    red: number;
    white: number;
    setMeal: number;
  };
  settings: RandomMenuSettings;
  result: RandomMenuResult | null;
  generatedAtLabel: string | null;
  onSettingsChange: (patch: Partial<RandomMenuSettings>) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
}

const clampNumber = (value: string) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
};

export const RandomMenuPanel = ({
  counts,
  settings,
  result,
  generatedAtLabel,
  onSettingsChange,
  onGenerate,
  onRegenerate,
}: RandomMenuPanelProps) => {
  const renderDishGroup = (title: string, dishes: RandomMenuResult['redDishes']) => (
    <div className="result-group">
      <h4>{title}</h4>
      {dishes.length ? (
        <div className="result-item-list">
          {dishes.map((dish) => (
            <article className="result-item-card" key={dish.id}>
              <div className="result-item-card__media">
                {dish.image ? (
                  <img src={resolveAssetUrl(dish.image)} alt={dish.name} />
                ) : (
                  <div className="result-item-card__empty">暂无图片</div>
                )}
              </div>
              <div className="result-item-card__body">
                <strong>{dish.name}</strong>
                <span>{dish.ingredients.slice(0, 4).join(' / ') || '待补材料'}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted-copy">这次没有抽到这一类菜。</p>
      )}
    </div>
  );

  return (
    <div className="random-panel">
      <div className="random-panel__header">
        <div>
          <h2>自动选菜</h2>
          <p>输入今晚想吃几道红区、几道白区，一键就能生成本次菜单。</p>
        </div>
        <span className="pill-note">适合做饭前快速决定</span>
      </div>

      <div className="availability-strip">
        <span>红区 {counts.red} 道</span>
        <span>白区 {counts.white} 道</span>
        <span>定食 {counts.setMeal} 套</span>
      </div>

      <div className="settings-grid">
        <label className="field-card">
          <span>红区菜数量</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={settings.redCount}
            onChange={(event) =>
              onSettingsChange({ redCount: clampNumber(event.target.value) })
            }
          />
        </label>

        <label className="field-card">
          <span>白区菜数量</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={settings.whiteCount}
            onChange={(event) =>
              onSettingsChange({ whiteCount: clampNumber(event.target.value) })
            }
          />
        </label>
      </div>

      <div className="reserved-note">
        <strong>定食单独展示</strong>
        <p>定食会继续保留在列表里单独查看和维护，默认不参与本次红白区随机。</p>
      </div>

      <button
        type="button"
        className="button button--primary button--block"
        onClick={onGenerate}
      >
        {result ? '重新随机菜单' : '生成本次菜单'}
      </button>

      {result ? (
        <div className="result-panel">
          <div className="result-panel__top">
            <div>
              <h3>本次菜单</h3>
              <p>{generatedAtLabel ? `生成时间：${generatedAtLabel}` : '刚刚生成'}</p>
            </div>
            <button type="button" className="ghost-button" onClick={onRegenerate}>
              一键重抽
            </button>
          </div>

          {renderDishGroup(CATEGORY_META[DISH_CATEGORY.RED].label, result.redDishes)}
          {renderDishGroup(
            CATEGORY_META[DISH_CATEGORY.WHITE].label,
            result.whiteDishes,
          )}
        </div>
      ) : (
        <div className="result-empty">
          <h3>还没生成菜单</h3>
          <p>先设好数量再点按钮，系统会从现有菜品里帮你随机挑出今晚的搭配。</p>
        </div>
      )}
    </div>
  );
};
