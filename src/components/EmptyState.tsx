interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => (
  <div className="empty-state">
    <div className="empty-state__badge">饭饭簿</div>
    <h3>{title}</h3>
    <p>{description}</p>
    {actionLabel && onAction ? (
      <button type="button" className="button button--primary" onClick={onAction}>
        {actionLabel}
      </button>
    ) : null}
  </div>
);
