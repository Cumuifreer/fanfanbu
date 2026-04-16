import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { CategoryTabs } from '../components/CategoryTabs';
import { DishGrid } from '../components/DishGrid';
import { EmptyState } from '../components/EmptyState';
import { RandomMenuPanel } from '../components/RandomMenuPanel';
import { SearchBar } from '../components/SearchBar';
import { ToastViewport } from '../components/ToastViewport';
import { APP_TITLE } from '../constants/app';
import {
  CATEGORY_META,
  DISH_CATEGORY,
  DISH_FILTER,
  RANDOM_MENU_DEFAULTS,
} from '../constants/categories';
import {
  buildDishCounts,
  formatUpdatedAt,
  matchesDishFilter,
  matchesDishSearch,
} from '../lib/dish-form';
import { loadStaticDataset } from '../lib/menu-data';
import { canGenerateRandomMenu, createRandomMenu } from '../lib/random-menu';
import { loadRandomSettings, saveRandomSettings } from '../lib/storage';
import type {
  DishFilter,
  MenuDataset,
  RandomMenuResult,
  RandomMenuSettings,
  ToastItem,
} from '../types/dish';

const defaultRandomSettings: RandomMenuSettings = {
  ...RANDOM_MENU_DEFAULTS,
};

const buildToastId = () =>
  `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getCountByFilter = (
  filter: DishFilter,
  counts: ReturnType<typeof buildDishCounts>,
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

export default function PublicApp() {
  const [dataset, setDataset] = useState<MenuDataset | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DishFilter>(DISH_FILTER.ALL);
  const [searchText, setSearchText] = useState('');
  const deferredSearch = useDeferredValue(searchText);
  const [randomSettings, setRandomSettings] = useState<RandomMenuSettings>(() =>
    loadRandomSettings(defaultRandomSettings),
  );
  const [randomResult, setRandomResult] = useState<RandomMenuResult | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    document.title = APP_TITLE;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const nextDataset = await loadStaticDataset();

        if (!cancelled) {
          setDataset(nextDataset);
          setLoadingError(null);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : '菜单数据加载失败，请稍后重试。';
          setLoadingError(message);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const pushToast = useCallback(
    (tone: ToastItem['tone'], title: string, message?: string) => {
      setToasts((current) => [
        ...current,
        { id: buildToastId(), tone, title, message },
      ]);
    },
    [],
  );

  const dismissToast = useCallback((toastId: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const dishes = dataset?.dishes ?? [];
  const counts = useMemo(() => buildDishCounts(dishes), [dishes]);

  const filteredDishes = useMemo(
    () =>
      dishes.filter(
        (dish) =>
          matchesDishFilter(dish, activeFilter) &&
          matchesDishSearch(dish, deferredSearch),
      ),
    [activeFilter, deferredSearch, dishes],
  );

  const currentCount = getCountByFilter(activeFilter, counts);

  const handleRandomSettingsChange = useCallback(
    (patch: Partial<RandomMenuSettings>) => {
      const nextSettings = { ...randomSettings, ...patch };
      setRandomSettings(nextSettings);

      try {
        saveRandomSettings(nextSettings);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '随机设置保存失败。';
        pushToast('error', '随机设置未保存', message);
      }
    },
    [pushToast, randomSettings],
  );

  const handleGenerateMenu = useCallback(() => {
    const validation = canGenerateRandomMenu(dishes, randomSettings);

    if (!validation.ok) {
      pushToast('error', '暂时无法生成菜单', validation.message);
      return;
    }

    startTransition(() => {
      setRandomResult(createRandomMenu(dishes, randomSettings));
    });

    pushToast('success', '本次菜单已生成', '不满意的话，可以继续一键重抽。');
  }, [dishes, pushToast, randomSettings]);

  const statCards = [
    { label: '全部菜品', value: counts.total },
    { label: CATEGORY_META[DISH_CATEGORY.RED].label, value: counts.red },
    { label: CATEGORY_META[DISH_CATEGORY.WHITE].label, value: counts.white },
    { label: CATEGORY_META[DISH_CATEGORY.SET_MEAL].label, value: counts.setMeal },
  ];

  if (loadingError) {
    return (
      <div className="app-shell">
        <div className="app-ambient app-ambient--one" />
        <div className="app-ambient app-ambient--two" />
        <main className="single-panel-layout">
          <section className="panel">
            <EmptyState
              title="菜单加载失败"
              description={loadingError}
              actionLabel="重新加载"
              onAction={() => window.location.reload()}
            />
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-ambient app-ambient--one" />
      <div className="app-ambient app-ambient--two" />

      <header className="hero-card hero-card--public">
        <div className="hero-copy hero-copy--minimal">
          <h1>{APP_TITLE}</h1>
          {dataset ? (
            <p className="hero-meta">菜单数据最近更新：{formatUpdatedAt(dataset.updatedAt)}</p>
          ) : (
            <p className="hero-meta">正在读取菜单数据...</p>
          )}
        </div>

        <div className="stats-strip">
          {statCards.map((card) => (
            <article className="stat-card" key={card.label}>
              <span className="stat-card__label">{card.label}</span>
              <strong className="stat-card__value">{card.value}</strong>
            </article>
          ))}
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="panel panel--main">
          <div className="section-heading">
            <div>
              <h2>菜品清单</h2>
              <p>
                支持分类切换和搜索。当前条件下共有 <strong>{currentCount}</strong> 道菜。
              </p>
            </div>
          </div>

          <CategoryTabs
            activeFilter={activeFilter}
            counts={counts}
            onChange={setActiveFilter}
          />

          <SearchBar
            value={searchText}
            onChange={setSearchText}
            onClear={() => setSearchText('')}
          />

          <DishGrid
            dishes={filteredDishes}
            emptyTitle={dataset ? '没有找到符合条件的菜' : '正在加载菜单'}
            emptyDescription={
              dataset
                ? '可以换个关键词试试，或者切回“全部菜品”看看。'
                : '稍等片刻，菜单数据马上就会显示出来。'
            }
          />
        </section>

        <aside className="panel panel--side">
          <RandomMenuPanel
            counts={counts}
            result={randomResult}
            settings={randomSettings}
            onSettingsChange={handleRandomSettingsChange}
            onGenerate={handleGenerateMenu}
            onRegenerate={handleGenerateMenu}
            generatedAtLabel={
              randomResult ? formatUpdatedAt(randomResult.generatedAt) : null
            }
          />
        </aside>
      </main>

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
