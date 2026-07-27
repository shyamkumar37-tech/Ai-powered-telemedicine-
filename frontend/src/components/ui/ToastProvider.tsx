import * as ToastPrimitive from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { X } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

const ToastContext = createContext({ pushToast: (options: DynamicStateObject) => {} });

export interface ToastProviderProps {
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<DynamicStateObject[]>([]);

  const pushToast = useCallback(({ title, message, type = "info", duration = 4200 }: DynamicStateObject) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev: DynamicStateObject) => [...prev, { id, title, message, type, duration }]);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map(({ id, title, message, type, duration }: DynamicStateObject) => (
          <ToastPrimitive.Root
            key={id}
            duration={duration}
            onOpenChange={(open: DynamicStateObject) => {
              if (!open) {
                setToasts((prev: DynamicStateObject) => prev.filter((t: DynamicStateObject) => t.id !== id));
              }
            }}
            className={`
              pointer-events-auto
              bg-tcd-panel border border-tcd-panel-line text-white p-4 rounded-lg shadow-lg
              data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full
              data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full
              data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]
              data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform
              data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-full
              ${type === 'error' ? 'border-red-500/50 bg-red-500/10' : ''}
              ${type === 'success' ? 'border-emerald-500/50 bg-emerald-500/10' : ''}
            `}
          >
            <div className="flex gap-3 items-start justify-between">
              <div>
                {title && <ToastPrimitive.Title className="font-semibold text-sm">{title}</ToastPrimitive.Title>}
                {message && <ToastPrimitive.Description className="text-sm text-slate-300 mt-1">{message}</ToastPrimitive.Description>}
              </div>
              <ToastPrimitive.Close className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </ToastPrimitive.Close>
            </div>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 p-6 flex flex-col gap-2 w-[390px] max-w-[100vw] m-0 list-none z-[100] outline-none pointer-events-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
