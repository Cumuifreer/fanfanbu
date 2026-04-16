import { useCallback, useEffect, useMemo, useState } from 'react';

import { ConfirmDialog } from '../components/ConfirmDialog';
import { EditorDishForm } from '../components/EditorDishForm';
import { EditorDishList } from '../components/EditorDishList';
import { EmptyState } from '../components/EmptyState';
import { ToastViewport } from '../components/ToastViewport';
import { APP_TITLE, MAX_IMAGE_SIZE_MB } from '../constants/app';
import {
  buildDishCounts,
  createDishId,
  createEmptyDishDraft,
  dishToDraft,
  draftToDishInput,
  isDraftDirty,
  matchesDishSearch,
  sortDishesByUpdatedAt,
  validateDishInput,
} from '../lib/dish-form';
import {
  loadEditorDataset,
  saveEditorDataset,
  uploadEditorImage,
} from '../lib/editor-api';
import { readFileAsDataUrl, validateImageFile } from '../lib/image';
import { resolveAssetUrl } from '../lib/menu-data';
import type { Dish, EditorDishDraft, MenuDataset, ToastItem } from '../types/dish';

const buildToastId = () =>
  `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const confirmDiscard = (hasUnsavedChanges: boolean) =>
  !hasUnsavedChanges || window.confirm('当前内容还没有保存，确定要切换吗？');

export default function EditorApp() {
  const [dataset, setDataset] = useState<MenuDataset | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<EditorDishDraft>(createEmptyDishDraft);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Dish | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    document.title = `${APP_TITLE} · 编辑版`;
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

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const nextDataset = await loadEditorDataset();

        if (!cancelled) {
          setDataset(nextDataset);
          setLoadingError(null);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : '编辑版无法读取本地菜单文件。';
          setLoadingError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dataset) {
      return;
    }

    if (isCreating) {
      setDraft(createEmptyDishDraft());
      setImagePreviewUrl(null);
      setPendingImageFile(null);
      setSaveError(null);
      return;
    }

    const selectedDish = dataset.dishes.find((dish) => dish.id === selectedDishId);

    if (selectedDish) {
      setDraft(dishToDraft(selectedDish));
      setImagePreviewUrl(selectedDish.image ? resolveAssetUrl(selectedDish.image) : null);
      setPendingImageFile(null);
      setSaveError(null);
      return;
    }

    if (dataset.dishes.length) {
      setSelectedDishId(dataset.dishes[0].id);
      return;
    }

    setIsCreating(true);
  }, [dataset, isCreating, selectedDishId]);

  const activeDish = useMemo(() => {
    if (!dataset || isCreating) {
      return null;
    }

    return dataset.dishes.find((dish) => dish.id === selectedDishId) ?? null;
  }, [dataset, isCreating, selectedDishId]);

  const counts = useMemo(
    () => buildDishCounts(dataset?.dishes ?? []),
    [dataset?.dishes],
  );

  const visibleDishes = useMemo(
    () => (dataset?.dishes ?? []).filter((dish) => matchesDishSearch(dish, searchText)),
    [dataset?.dishes, searchText],
  );

  const dirty = isDraftDirty(draft, activeDish) || pendingImageFile !== null;

  const handleDraftChange = useCallback((patch: Partial<EditorDishDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaveError(null);
  }, []);

  const handleCreateDish = useCallback(() => {
    if (!confirmDiscard(dirty)) {
      return;
    }

    setIsCreating(true);
    setSelectedDishId(null);
  }, [dirty]);

  const handleSelectDish = useCallback(
    (dishId: string) => {
      if (dishId === selectedDishId && !isCreating) {
        return;
      }

      if (!confirmDiscard(dirty)) {
        return;
      }

      setIsCreating(false);
      setSelectedDishId(dishId);
    },
    [dirty, isCreating, selectedDishId],
  );

  const handlePickImage = useCallback(
    async (file: File) => {
      try {
        validateImageFile(file, MAX_IMAGE_SIZE_MB);
        const preview = await readFileAsDataUrl(file);
        setPendingImageFile(file);
        setImagePreviewUrl(preview);
        pushToast('success', '图片已选中', '点击保存后会写入共享图片目录。');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '图片处理失败，请重新选择。';
        pushToast('error', '图片不可用', message);
      }
    },
    [pushToast],
  );

  const handleRemoveImage = useCallback(() => {
    setPendingImageFile(null);
    setImagePreviewUrl(null);
    setDraft((current) => ({ ...current, image: null }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!dataset) {
      return;
    }

    const normalizedInput = draftToDishInput(draft);
    const validationError = validateDishInput(normalizedInput);

    if (validationError) {
      setSaveError(validationError);
      pushToast('error', '保存失败', validationError);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    let nextImagePath = normalizedInput.image;

    try {
      if (pendingImageFile) {
        nextImagePath = await uploadEditorImage(pendingImageFile);
      }

      const now = new Date().toISOString();
      const nextDish: Dish = activeDish
        ? {
            ...activeDish,
            ...normalizedInput,
            image: nextImagePath,
            updatedAt: now,
          }
        : {
            id: createDishId(),
            ...normalizedInput,
            image: nextImagePath,
            createdAt: now,
            updatedAt: now,
          };

      const nextDishes = activeDish
        ? dataset.dishes.map((dish) => (dish.id === activeDish.id ? nextDish : dish))
        : [nextDish, ...dataset.dishes];

      const savedDataset = await saveEditorDataset({
        updatedAt: now,
        dishes: sortDishesByUpdatedAt(nextDishes),
      });

      setDataset(savedDataset);
      setIsCreating(false);
      setSelectedDishId(nextDish.id);
      setPendingImageFile(null);
      setSearchText('');
      pushToast(
        'success',
        activeDish ? '修改已保存' : '新菜已保存',
        '共享数据文件已经更新，静态展示页刷新后就能看到。',
      );
    } catch (error) {
      if (pendingImageFile && nextImagePath && nextImagePath !== normalizedInput.image) {
        setDraft((current) => ({ ...current, image: nextImagePath }));
        setImagePreviewUrl(resolveAssetUrl(nextImagePath));
        setPendingImageFile(null);
      }

      const message =
        error instanceof Error ? error.message : '保存失败，请稍后再试。';
      setSaveError(message);
      pushToast('error', '保存失败', message);
    } finally {
      setIsSaving(false);
    }
  }, [activeDish, dataset, draft, pendingImageFile, pushToast]);

  const handleDeleteDish = useCallback(async () => {
    if (!dataset || !activeDish) {
      return;
    }

    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      const savedDataset = await saveEditorDataset({
        updatedAt: now,
        dishes: dataset.dishes.filter((dish) => dish.id !== activeDish.id),
      });

      setDataset(savedDataset);
      setDeleteTarget(null);
      setPendingImageFile(null);

      if (savedDataset.dishes.length) {
        setIsCreating(false);
        setSelectedDishId(savedDataset.dishes[0].id);
      } else {
        setIsCreating(true);
        setSelectedDishId(null);
      }

      pushToast('success', '菜品已删除');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '删除失败，请稍后再试。';
      pushToast('error', '删除失败', message);
    } finally {
      setIsSaving(false);
    }
  }, [activeDish, dataset, pushToast]);

  if (isLoading) {
    return (
      <div className="app-shell">
        <div className="app-ambient app-ambient--one" />
        <div className="app-ambient app-ambient--two" />
        <main className="single-panel-layout">
          <section className="panel">
            <EmptyState
              title="正在打开编辑版"
              description="正在读取本地共享数据文件和图片资源，请稍等片刻。"
            />
          </section>
        </main>
      </div>
    );
  }

  if (loadingError || !dataset) {
    return (
      <div className="app-shell">
        <div className="app-ambient app-ambient--one" />
        <div className="app-ambient app-ambient--two" />
        <main className="single-panel-layout">
          <section className="panel">
            <EmptyState
              title="编辑版无法启动"
              description={
                loadingError ??
                '请使用本地开发服务器打开 `editor.html`，编辑版需要本地文件写入能力。'
              }
              actionLabel="重新加载"
              onAction={() => window.location.reload()}
            />
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--editor">
      <div className="app-ambient app-ambient--one" />
      <div className="app-ambient app-ambient--two" />

      <header className="hero-card hero-card--editor">
        <div className="hero-copy hero-copy--minimal">
          <h1>{APP_TITLE} 编辑台</h1>
        </div>

        <div className="editor-header-actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => window.location.reload()}
          >
            重新读取文件
          </button>
        </div>
      </header>

      <main className="editor-layout">
        <EditorDishList
          dishes={visibleDishes}
          counts={counts}
          activeDishId={isCreating ? null : selectedDishId}
          searchText={searchText}
          onSearchTextChange={setSearchText}
          onCreate={handleCreateDish}
          onSelect={handleSelectDish}
        />

        <EditorDishForm
          draft={draft}
          imagePreviewUrl={imagePreviewUrl}
          isDirty={dirty}
          isSaving={isSaving}
          saveError={saveError}
          onChange={handleDraftChange}
          onPickImage={handlePickImage}
          onRemoveImage={handleRemoveImage}
          onSave={() => void handleSave()}
          onDelete={() => setDeleteTarget(activeDish)}
        />
      </main>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="确认删除这道菜吗？"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” 删除后会立刻从共享菜单数据文件中移除。`
            : ''
        }
        confirmText="确认删除"
        cancelText="再想想"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteDish()}
      />

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
