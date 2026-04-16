import { useEffect } from 'react';

import type { ToastItem } from '../types/dish';

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (toastId: string) => void;
}

const ToastCard = ({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (toastId: string) => void;
}) => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.id]);

  return (
    <div className={`toast toast--${toast.tone}`} role="status">
      <div>
        <strong>{toast.title}</strong>
        {toast.message ? <p>{toast.message}</p> : null}
      </div>
      <button
        type="button"
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="关闭提示"
      >
        ×
      </button>
    </div>
  );
};

export const ToastViewport = ({ toasts, onDismiss }: ToastViewportProps) => (
  <div className="toast-viewport" aria-live="polite" aria-atomic="true">
    {toasts.map((toast) => (
      <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
    ))}
  </div>
);
