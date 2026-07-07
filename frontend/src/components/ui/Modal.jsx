import { useEffect, useRef } from "react";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../../context/LanguageContext";
import Card from "./Card";

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer = null
}) {
  const { translateUiText = (value) => value } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

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
      const firstFocusable = focusables.find((element) => !element.hasAttribute("aria-hidden"));
      if (firstFocusable instanceof HTMLElement) {
        firstFocusable.focus();
      } else {
        dialog.focus();
      }
    };

    const focusTimer = window.setTimeout(focusFirstControl, 0);

    const onKeyDown = (event) => {
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
        .filter((element) => !element.hasAttribute("disabled"));
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
        lastFocusable.focus();
      } else if (!event.shiftKey && activeElement === lastFocusable) {
        event.preventDefault();
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

  if (!open) {
    return null;
  }

  return (
    <div className="tc-modal-backdrop" onClick={onClose} role="presentation">
      <Card
        ref={dialogRef}
        elevated={false}
        className="tc-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-ink">{title}</h3>
            {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
            onClick={onClose}
            aria-label={translateUiText("Close dialog")}
          >
            {translateUiText("Close")}
          </button>
        </div>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div> : null}
      </Card>
    </div>
  );
}
