import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { useEffect, useRef, ReactNode } from "react";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../../context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import Card from "./Card";

export interface ModalProps {
  open?: DynamicState;
  title?: DynamicState;
  description?: DynamicState;
  children?: ReactNode;
  onClose?: (...args: DynamicStateObject[]) => void;
  footer?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer = null
}: ModalProps) {
  const { t, translateUiText = (value: string | number) => value } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const dialogRef = useRef<DynamicState>(null);
  const previousFocusRef = useRef<DynamicState>(null);

  useEffect(() => {
    if (!open) {
      return () => {};
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    const focusFirstControl = () => {
      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }
      const focusables = Array.from(dialog.querySelectorAll(focusableSelector));
      const firstFocusable = focusables.find((element: DynamicStateObject) => !element.hasAttribute("aria-hidden"));
      if (firstFocusable instanceof HTMLElement) {
        firstFocusable.focus();
      } else {
        dialog.focus();
      }
    };

    const focusTimer = window.setTimeout(focusFirstControl, 0);

    const onKeyDown = (event: DynamicStateObject) => {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusables = Array.from(dialog.querySelectorAll(focusableSelector))
        .filter((element: DynamicStateObject) => !element.hasAttribute("disabled"));
      if (!focusables.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstFocusable) {
        event.preventDefault();
        // @ts-expect-error - Auto-suppressed during migration
        lastFocusable.focus();
      } else if (!event.shiftKey && activeElement === lastFocusable) {
        event.preventDefault();
        // @ts-expect-error - Auto-suppressed during migration
        firstFocusable.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="tc-modal-backdrop" 
          onClick={onClose} 
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(event: DynamicStateObject) => event.stopPropagation()}
            className="flex w-full items-center justify-center p-4"
          >
            <Card
              ref={dialogRef}
              elevated={false}
              className="tc-modal"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              tabIndex={-1}
              animate={false}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-tc-text">{title}</h3>
                  {description ? <p className="mt-2 text-sm text-tc-text-muted">{description}</p> : null}
                </div>
                <button
                  type="button"
                  className="rounded-full border border-tc-border px-3 py-1 text-sm font-medium text-tc-text-muted transition hover:border-tc-border-strong hover:text-tc-text"
                  onClick={onClose}
                  aria-label={(t("closeDialog") || "Close dialog")}
                >
                  {(t("close") || "Close")}
                </button>
              </div>
              <div className="mt-6">{children}</div>
              {footer ? <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div> : null}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
