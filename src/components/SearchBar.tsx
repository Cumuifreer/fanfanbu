interface SearchBarProps {
  value: string;
  onChange: (nextValue: string) => void;
  onClear: () => void;
}

export const SearchBar = ({ value, onChange, onClear }: SearchBarProps) => (
  <div className="search-card">
    <div className="search-card__icon" aria-hidden="true">
      搜
    </div>
    <input
      type="search"
      className="search-card__input"
      placeholder="搜索菜名、材料或菜谱关键词"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
    {value ? (
      <button type="button" className="ghost-button" onClick={onClear}>
        清空
      </button>
    ) : null}
  </div>
);
