import type { FormEvent } from 'react';

import { EDITABLE_CATEGORY_OPTIONS } from '../constants/categories';
import { formatUpdatedAt } from '../lib/dish-form';
import { EditableTextList } from './EditableTextList';
import { ImagePickerField } from './ImagePickerField';
import type { EditorDishDraft } from '../types/dish';

interface EditorDishFormProps {
  draft: EditorDishDraft;
  imagePreviewUrl: string | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  onChange: (patch: Partial<EditorDishDraft>) => void;
  onPickImage: (file: File) => void;
  onRemoveImage: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export const EditorDishForm = ({
  draft,
  imagePreviewUrl,
  isDirty,
  isSaving,
  saveError,
  onChange,
  onPickImage,
  onRemoveImage,
  onSave,
  onDelete,
}: EditorDishFormProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave();
  };

  const isExistingDish = Boolean(draft.id);

  return (
    <section className="editor-form-panel">
      <div className="editor-form-panel__header">
        <div>
          <span className="pill-note">{isExistingDish ? '编辑菜品' : '新增菜品'}</span>
          <h1>{isExistingDish ? draft.name || '未命名菜品' : '新菜品'}</h1>
          <p>这里保存的是共享菜单数据。保存后，静态展示页读取到的就是这份内容。</p>
        </div>

        <div className="editor-form-panel__status">
          <span className={`status-pill ${isDirty ? 'is-pending' : 'is-saved'}`}>
            {isDirty ? '有未保存改动' : '当前内容已保存'}
          </span>
          {draft.updatedAt ? <span>上次保存：{formatUpdatedAt(draft.updatedAt)}</span> : null}
        </div>
      </div>

      <form className="editor-form" onSubmit={handleSubmit}>
        <div className="editor-form__grid">
          <label className="form-field">
            <span>菜名</span>
            <input
              type="text"
              placeholder="例如：糖醋排骨"
              value={draft.name}
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </label>

          <label className="form-field">
            <span>分类</span>
            <select
              value={draft.category}
              onChange={(event) =>
                onChange({ category: event.target.value as EditorDishDraft['category'] })
              }
            >
              {EDITABLE_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ImagePickerField
          previewUrl={imagePreviewUrl}
          onPick={onPickImage}
          onRemove={onRemoveImage}
        />

        <EditableTextList
          title="所需材料"
          items={draft.ingredients}
          addLabel="新增材料"
          placeholder="例如：五花肉"
          emptyHint="材料可以逐条添加，不需要会写代码。"
          onChange={(ingredients) => onChange({ ingredients })}
        />

        <EditableTextList
          title="菜谱步骤"
          items={draft.recipeSteps}
          addLabel="新增步骤"
          placeholder="例如：先把食材洗净切好，再热锅下油。"
          emptyHint="如果暂时还没整理做法，可以先留空，前台会显示“暂无菜谱”。"
          numbered
          multiline
          reorderable
          onChange={(recipeSteps) => onChange({ recipeSteps })}
        />

        {saveError ? <p className="field-error field-error--block">{saveError}</p> : null}

        <div className="editor-form__actions">
          {isExistingDish ? (
            <button
              type="button"
              className="ghost-button ghost-button--danger"
              onClick={onDelete}
            >
              删除这道菜
            </button>
          ) : (
            <span className="editor-form__hint">新菜保存后会自动加入左侧列表。</span>
          )}

          <button type="submit" className="button button--primary" disabled={isSaving}>
            {isSaving ? '保存中...' : isExistingDish ? '保存修改' : '保存新菜'}
          </button>
        </div>
      </form>
    </section>
  );
};
