interface EditableTextListProps {
  title: string;
  items: string[];
  addLabel: string;
  placeholder: string;
  emptyHint: string;
  numbered?: boolean;
  multiline?: boolean;
  reorderable?: boolean;
  onChange: (nextItems: string[]) => void;
}

const moveItem = (items: string[], from: number, to: number) => {
  const next = [...items];
  const [target] = next.splice(from, 1);
  next.splice(to, 0, target);
  return next;
};

export const EditableTextList = ({
  title,
  items,
  addLabel,
  placeholder,
  emptyHint,
  numbered = false,
  multiline = false,
  reorderable = false,
  onChange,
}: EditableTextListProps) => {
  const updateAt = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, currentIndex) => currentIndex !== index));
  };

  const addItem = () => {
    onChange([...items, '']);
  };

  return (
    <section className="editor-list-field">
      <div className="editor-list-field__header">
        <div>
          <h3>{title}</h3>
          <p>{emptyHint}</p>
        </div>
        <button type="button" className="button button--secondary" onClick={addItem}>
          {addLabel}
        </button>
      </div>

      {items.length ? (
        <div className="editor-list-field__body">
          {items.map((item, index) => (
            <div className="editor-list-item" key={`${title}-${index}`}>
              <div className="editor-list-item__meta">
                <span className="editor-list-item__badge">
                  {numbered ? `步骤 ${index + 1}` : `材料 ${index + 1}`}
                </span>
              </div>

              {multiline ? (
                <textarea
                  rows={3}
                  value={item}
                  placeholder={placeholder}
                  onChange={(event) => updateAt(index, event.target.value)}
                />
              ) : (
                <input
                  type="text"
                  value={item}
                  placeholder={placeholder}
                  onChange={(event) => updateAt(index, event.target.value)}
                />
              )}

              <div className="editor-list-item__actions">
                {reorderable && index > 0 ? (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onChange(moveItem(items, index, index - 1))}
                  >
                    上移
                  </button>
                ) : null}
                {reorderable && index < items.length - 1 ? (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onChange(moveItem(items, index, index + 1))}
                  >
                    下移
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ghost-button ghost-button--danger"
                  onClick={() => removeAt(index)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="editor-list-field__empty">
          <p>{emptyHint}</p>
        </div>
      )}
    </section>
  );
};
