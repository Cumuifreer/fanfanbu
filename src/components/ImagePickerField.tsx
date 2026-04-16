import { useId } from 'react';

interface ImagePickerFieldProps {
  previewUrl: string | null;
  onPick: (file: File) => void;
  onRemove: () => void;
}

export const ImagePickerField = ({
  previewUrl,
  onPick,
  onRemove,
}: ImagePickerFieldProps) => {
  const inputId = useId();

  return (
    <section className="editor-image-field">
      <div className="editor-image-field__header">
        <div>
          <h3>图片</h3>
          <p>点击图片或按钮就能选择本地文件，保存后会同步写进共享图片目录。</p>
        </div>
      </div>

      <input
        id={inputId}
        hidden
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (!file) {
            return;
          }

          onPick(file);
          event.target.value = '';
        }}
      />

      <label htmlFor={inputId} className="editor-image-field__preview">
        {previewUrl ? (
          <img src={previewUrl} alt="菜品图片预览" className="editor-image-field__img" />
        ) : (
          <div className="editor-image-field__placeholder">
            <strong>添加图片</strong>
            <span>适合放成品图、备菜图或家里喜欢的封面图</span>
          </div>
        )}
      </label>

      <div className="editor-image-field__actions">
        <label htmlFor={inputId} className="button button--secondary">
          {previewUrl ? '更换图片' : '上传图片'}
        </label>
        {previewUrl ? (
          <button
            type="button"
            className="ghost-button ghost-button--danger"
            onClick={onRemove}
          >
            移除图片
          </button>
        ) : null}
      </div>
    </section>
  );
};
