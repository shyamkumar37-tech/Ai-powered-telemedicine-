import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext({ pushToast: () => {} });

const DEFAULT_DURATION = 4200;

function buildId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback((toast) => {
    const next = {
      id: buildId(),
      type: toast?.type || "info",
      title: toast?.title || "",
      message: toast?.message || "",
      duration: Number.isFinite(toast?.duration) ? toast.duration : DEFAULT_DURATION
    };
    setToasts((current) => [next, ...current].slice(0, 4));
    if (next.duration > 0) {
      const timer = setTimeout(() => removeToast(next.id), next.duration);
      timers.current.set(next.id, timer);
    }
  }, [removeToast]);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-card--${toast.type}`}>
            <div>
              {toast.title ? <p className="toast-title">{toast.title}</p> : null}
              {toast.message ? <p className="toast-message">{toast.message}</p> : null}
            </div>
            <button
              className="toast-close"
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
